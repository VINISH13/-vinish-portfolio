import logging

from django.conf import settings
from django.contrib import messages
from django.core.cache import cache
from django.core.mail import send_mail
from django.db.models import Count, Prefetch, Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.http import require_POST

from .forms import ContactForm
from .models import Education, Experience, Project, ProjectCategory, Skill, SkillCategory

logger = logging.getLogger(__name__)


def _published_projects():
    return Project.objects.filter(is_published=True).select_related("category").prefetch_related("technologies")


def _home_context(form=None):
    return {
        "skill_categories": SkillCategory.objects.prefetch_related(
            Prefetch("skills", queryset=Skill.objects.filter(is_active=True))
        ),
        "experiences": Experience.objects.filter(is_active=True).prefetch_related("technologies"),
        "projects": _published_projects(),
        "project_categories": ProjectCategory.objects.annotate(
            n=Count("projects", filter=Q(projects__is_published=True))
        ).filter(n__gt=0),
        "education": Education.objects.all(),
        "form": form or ContactForm(),
    }


def home(request):
    return render(request, "portfolio/home.html", _home_context())


def project_detail(request, slug):
    project = get_object_or_404(_published_projects(), slug=slug)
    related = _published_projects().exclude(pk=project.pk)
    if project.category_id:
        related = related.filter(category=project.category)
    return render(request, "portfolio/project_detail.html", {"project": project, "related_projects": related[:3]})


def _client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    return forwarded.split(",")[0].strip() if forwarded else request.META.get("REMOTE_ADDR")


def _rate_limited(ip):
    key = f"contact-rate:{ip}"
    count = cache.get(key, 0)
    if count >= settings.CONTACT_RATE_LIMIT:
        return True
    cache.set(key, count + 1, settings.CONTACT_RATE_WINDOW)
    return False


def _notify(msg):
    if not settings.CONTACT_NOTIFY_EMAIL:
        return
    try:
        send_mail(
            subject=f"[Portfolio] {msg.subject}",
            message=f"From: {msg.name} <{msg.email}>\n\n{msg.message}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.CONTACT_NOTIFY_EMAIL],
            fail_silently=False,
        )
    except Exception:  # never fail the request because email is down
        logger.exception("Could not send contact notification email")


@require_POST
def contact(request):
    is_ajax = request.headers.get("x-requested-with") == "XMLHttpRequest"
    form = ContactForm(request.POST)
    success_text = "Thanks for reaching out! I'll get back to you within 24–48 hours."

    if form.is_valid():
        ip = _client_ip(request)
        if form.is_spam:
            # Pretend success so bots learn nothing.
            return JsonResponse({"ok": True, "message": success_text}) if is_ajax else redirect(reverse("portfolio:home") + "#contact")
        if _rate_limited(ip):
            error = "Too many messages sent. Please try again in a few minutes."
            if is_ajax:
                return JsonResponse({"ok": False, "message": error, "errors": {}}, status=429)
            messages.error(request, error)
            return redirect(reverse("portfolio:home") + "#contact")

        msg = form.save(commit=False)
        msg.ip_address = ip
        msg.user_agent = request.META.get("HTTP_USER_AGENT", "")[:255]
        msg.save()
        _notify(msg)

        if is_ajax:
            return JsonResponse({"ok": True, "message": success_text})
        messages.success(request, success_text)
        return redirect(reverse("portfolio:home") + "#contact")

    if is_ajax:
        errors = {field: [e["message"] for e in errs] for field, errs in form.errors.get_json_data().items()}
        return JsonResponse({"ok": False, "message": "Please fix the highlighted fields.", "errors": errors}, status=400)
    return render(request, "portfolio/home.html", _home_context(form), status=400)


def page_not_found(request, exception):
    return render(request, "404.html", status=404)
