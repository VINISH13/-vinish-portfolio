"""
Prepare a fresh deployment (e.g. Render) in one idempotent step:

1. If the database has no Profile yet, load portfolio/fixtures/portfolio_data.json
   (your real content, exported from the local database).
2. If DJANGO_SUPERUSER_USERNAME and DJANGO_SUPERUSER_PASSWORD are set and that user
   doesn't exist, create it so you can log in to /admin/.

Safe to run on every start: existing content and users are never overwritten.

    python manage.py ensure_portfolio_data

To refresh the fixture after editing content locally:

    python manage.py dumpdata portfolio.technology portfolio.skillcategory portfolio.skill \
        portfolio.profile portfolio.experience portfolio.projectcategory portfolio.project \
        portfolio.education --indent 2 --natural-foreign -o portfolio/fixtures/portfolio_data.json
"""
import os

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand

from portfolio.models import Profile


class Command(BaseCommand):
    help = "Load portfolio content into an empty database and create an admin user from env vars."

    def handle(self, *args, **options):
        if Profile.objects.exists():
            self.stdout.write("Portfolio content already present — nothing to load.")
        else:
            call_command("loaddata", "portfolio_data", verbosity=0)
            self.stdout.write(self.style.SUCCESS("Loaded portfolio content from portfolio_data.json."))

        username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")
        if username and password:
            User = get_user_model()
            if User.objects.filter(username=username).exists():
                self.stdout.write(f"Admin user '{username}' already exists.")
            else:
                User.objects.create_superuser(username=username, email=os.environ.get("DJANGO_SUPERUSER_EMAIL", ""), password=password)
                self.stdout.write(self.style.SUCCESS(f"Created admin user '{username}'."))
