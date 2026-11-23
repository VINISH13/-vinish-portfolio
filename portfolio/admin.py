from django.contrib import admin, messages
from django.utils.html import format_html

from .models import (
    ContactMessage,
    Education,
    Experience,
    Profile,
    Project,
    ProjectCategory,
    Skill,
    SkillCategory,
    Technology,
)

admin.site.site_header = "Portfolio Control Center"
admin.site.site_title = "Portfolio Admin"
admin.site.index_title = "Manage your portfolio content"


def thumb(file_field, size=48, rounded="10px"):
    if not file_field:
        return format_html('<span style="opacity:.5">—</span>')
    return format_html(
        '<img src="{}" style="width:{}px;height:{}px;object-fit:cover;border-radius:{};'
        'box-shadow:0 0 0 1px rgba(139,92,246,.4)">',
        file_field.url, size, size, rounded,
    )


# --------------------------------------------------------------------------- #
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("avatar", "full_name", "headline", "email", "available_for_work", "updated_at")
    readonly_fields = ("avatar_preview", "updated_at")
    fieldsets = (
        ("Identity", {"fields": ("full_name", "headline", "typing_roles", ("profile_image", "avatar_preview"), "resume")}),
        ("Content", {"fields": ("hero_intro", "about", "meta_description")}),
        ("Contact", {"fields": (("email", "phone"), "location")}),
        ("Social links", {"fields": (("github_url", "linkedin_url"), ("twitter_url", "website_url"))}),
        ("Highlights", {"fields": (("years_experience", "projects_completed"), "available_for_work", "updated_at")}),
    )

    @admin.display(description="")
    def avatar(self, obj):
        return thumb(obj.profile_image, 40, "50%")

    @admin.display(description="Preview")
    def avatar_preview(self, obj):
        return thumb(obj.profile_image, 120, "50%")

    def has_add_permission(self, request):
        # Only one profile is allowed.
        return not Profile.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


# --------------------------------------------------------------------------- #
@admin.register(Technology)
class TechnologyAdmin(admin.ModelAdmin):
    list_display = ("name", "icon", "icon_class", "project_count")
    list_editable = ("icon_class",)
    search_fields = ("name",)

    @admin.display(description="Icon")
    def icon(self, obj):
        return format_html('<i class="{}" style="font-size:22px"></i>', obj.icon_class) if obj.icon_class else "—"

    @admin.display(description="Projects")
    def project_count(self, obj):
        return obj.projects.count()


class SkillInline(admin.TabularInline):
    model = Skill
    extra = 1
    fields = ("name", "proficiency", "icon_class", "order", "is_active")


@admin.register(SkillCategory)
class SkillCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "icon_preview", "skill_count", "order")
    list_editable = ("order",)
    inlines = [SkillInline]

    @admin.display(description="Icon")
    def icon_preview(self, obj):
        return format_html('<i class="bi {}" style="font-size:20px;color:#8b5cf6"></i> <code>{}</code>', obj.icon, obj.icon)

    @admin.display(description="Skills")
    def skill_count(self, obj):
        return obj.skills.count()


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "proficiency_bar", "proficiency", "order", "is_active")
    list_editable = ("proficiency", "order", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name",)

    @admin.display(description="Level")
    def proficiency_bar(self, obj):
        return format_html(
            '<div style="width:140px;height:8px;border-radius:8px;background:rgba(127,127,127,.2)">'
            '<div style="width:{}%;height:100%;border-radius:8px;background:linear-gradient(90deg,#00d4ff,#8b5cf6)"></div></div>',
            obj.proficiency,
        )


# --------------------------------------------------------------------------- #
@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    list_display = ("title", "company", "employment_type", "start_date", "end_display", "is_active")
    list_filter = ("employment_type", "is_current", "is_active")
    list_editable = ("is_active",)
    search_fields = ("title", "company", "summary")
    filter_horizontal = ("technologies",)
    date_hierarchy = "start_date"
    fieldsets = (
        (None, {"fields": (("title", "employment_type"), ("company", "company_url"), "location")}),
        ("Timeline", {"fields": (("start_date", "end_date"), "is_current")}),
        ("Details", {"fields": ("summary", "highlights", "technologies")}),
        ("Display", {"fields": (("order", "is_active"),)}),
    )

    @admin.display(description="End")
    def end_display(self, obj):
        return "Present" if obj.is_current else (obj.end_date or "—")


# --------------------------------------------------------------------------- #
@admin.register(ProjectCategory)
class ProjectCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "order")
    list_editable = ("order",)
    prepopulated_fields = {"slug": ("name",)}


@admin.action(description="Publish selected projects")
def publish(modeladmin, request, queryset):
    queryset.update(is_published=True)


@admin.action(description="Unpublish selected projects")
def unpublish(modeladmin, request, queryset):
    queryset.update(is_published=False)


@admin.action(description="Mark as featured")
def feature(modeladmin, request, queryset):
    queryset.update(is_featured=True)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("cover", "title", "category", "tech_list", "is_featured", "is_published", "order")
    list_display_links = ("cover", "title")
    list_editable = ("is_featured", "is_published", "order")
    list_filter = ("category", "is_featured", "is_published", "technologies")
    search_fields = ("title", "tagline", "description")
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("technologies",)
    readonly_fields = ("cover_preview",)
    actions = [publish, unpublish, feature]
    fieldsets = (
        (None, {"fields": (("title", "slug"), "category", "tagline")}),
        ("Content", {"fields": ("description", "key_features", "technologies")}),
        ("Media", {"fields": (("image", "cover_preview"), "icon")}),
        ("Links", {"fields": (("github_url", "live_url"), "completed_on")}),
        ("Display", {"fields": (("is_featured", "is_published", "order"),)}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("category").prefetch_related("technologies")

    @admin.display(description="")
    def cover(self, obj):
        return thumb(obj.image, 56)

    @admin.display(description="Preview")
    def cover_preview(self, obj):
        return thumb(obj.image, 200)

    @admin.display(description="Tech")
    def tech_list(self, obj):
        return ", ".join(t.name for t in obj.technologies.all()[:4])


# --------------------------------------------------------------------------- #
@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ("degree", "institution", "start_year", "end_year", "grade", "order")
    list_editable = ("order",)
    search_fields = ("degree", "institution", "field_of_study")


# --------------------------------------------------------------------------- #
@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("status", "name", "email_link", "subject", "created_at")
    list_display_links = ("name", "subject")
    list_filter = ("is_read", "created_at")
    search_fields = ("name", "email", "subject", "message")
    date_hierarchy = "created_at"
    readonly_fields = ("name", "email", "subject", "message", "ip_address", "user_agent", "created_at")
    fields = ("name", "email", "subject", "message", "is_read", "created_at", "ip_address", "user_agent")
    actions = ["mark_read", "mark_unread"]

    def has_add_permission(self, request):
        return False

    def change_view(self, request, object_id, form_url="", extra_context=None):
        ContactMessage.objects.filter(pk=object_id, is_read=False).update(is_read=True)
        return super().change_view(request, object_id, form_url, extra_context)

    @admin.display(description="", ordering="is_read")
    def status(self, obj):
        color = "#64748b" if obj.is_read else "#00d4ff"
        label = "Read" if obj.is_read else "New"
        return format_html(
            '<span style="padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600;'
            'border:1px solid {0};color:{0}">{1}</span>', color, label,
        )

    @admin.display(description="Email", ordering="email")
    def email_link(self, obj):
        return format_html('<a href="mailto:{0}">{0}</a>', obj.email)

    @admin.action(description="Mark selected as read")
    def mark_read(self, request, queryset):
        n = queryset.update(is_read=True)
        self.message_user(request, f"{n} message(s) marked as read.", messages.SUCCESS)

    @admin.action(description="Mark selected as unread")
    def mark_unread(self, request, queryset):
        n = queryset.update(is_read=False)
        self.message_user(request, f"{n} message(s) marked as unread.", messages.SUCCESS)
