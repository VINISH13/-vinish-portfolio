from django.conf import settings
from django.utils import timezone

from .models import Profile
from .ui import get_ui

NAV_ITEMS = [
    ("home", "Home"),
    ("about", "About"),
    ("experience", "Experience"),
    ("projects", "Projects"),
    ("education", "Education"),
    ("contact", "Contact"),
]


def site_context(request):
    """Expose the profile and navigation on every page (skipped for the admin)."""
    if request.path.startswith("/admin/"):
        return {}
    return {
        "profile": Profile.get_solo(),
        "nav_items": NAV_ITEMS,
        "current_year": timezone.now().year,
        "ui": get_ui(request),
        "ui_switcher": False,  # design switcher removed; site uses PORTFOLIO_UI only
    }
