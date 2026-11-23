from django.conf import settings

UI_CHOICES = ("v1", "v2", "v3", "v4", "v5")

# Template used for each page in each design.
TEMPLATES = {
    "v1": {"home": "portfolio/home.html", "project": "portfolio/project_detail.html", "404": "404.html"},
    "v2": {"home": "v2/home.html", "project": "v2/project_detail.html", "404": "v2/404.html"},
    "v3": {"home": "v3/home.html", "project": "v3/project_detail.html", "404": "v3/404.html"},
    "v4": {"home": "v4/home.html", "project": "v4/project_detail.html", "404": "v4/404.html"},
    "v5": {"home": "v5/home.html", "project": "v5/project_detail.html", "404": "v5/404.html"},
}


def get_ui(request):
    """Return the active design, set by the PORTFOLIO_UI setting (default: futuristic "v3")."""
    return settings.PORTFOLIO_UI if settings.PORTFOLIO_UI in UI_CHOICES else "v3"


def template_for(request, page):
    return TEMPLATES[get_ui(request)][page]
