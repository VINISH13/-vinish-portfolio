"""
Load demo content so the portfolio looks complete on first run.

    python manage.py seed_portfolio                 # only if the DB is empty
    python manage.py seed_portfolio --name "Jane Doe" --email jane@site.dev
    python manage.py seed_portfolio --reset         # wipe content and reseed

Everything created here is editable from the Django admin.
"""
from datetime import date

from django.core.management.base import BaseCommand
from django.db import transaction

from portfolio.models import (
    Education,
    Experience,
    Profile,
    Project,
    ProjectCategory,
    Skill,
    SkillCategory,
    Technology,
)

TECH_ICONS = {
    "Python": "devicon-python-plain colored",
    "Django": "devicon-django-plain",
    "Django REST Framework": "devicon-djangorest-plain",
    "FastAPI": "devicon-fastapi-plain colored",
    "Flask": "devicon-flask-original",
    "JavaScript": "devicon-javascript-plain colored",
    "TypeScript": "devicon-typescript-plain colored",
    "React": "devicon-react-original colored",
    "HTML5": "devicon-html5-plain colored",
    "CSS3": "devicon-css3-plain colored",
    "Bootstrap": "devicon-bootstrap-plain colored",
    "Tailwind CSS": "devicon-tailwindcss-original colored",
    "PostgreSQL": "devicon-postgresql-plain colored",
    "MySQL": "devicon-mysql-original colored",
    "SQLite": "devicon-sqlite-plain colored",
    "Redis": "devicon-redis-plain colored",
    "Celery": "",
    "Docker": "devicon-docker-plain colored",
    "Git": "devicon-git-plain colored",
    "GitHub Actions": "devicon-githubactions-plain colored",
    "AWS": "devicon-amazonwebservices-plain-wordmark colored",
    "Linux": "devicon-linux-plain",
    "Nginx": "devicon-nginx-original colored",
    "Pandas": "devicon-pandas-plain colored",
    "WebSockets": "",
    "Stripe": "",
    "Chart.js": "",
}

SKILLS = [
    ("Backend Development", "bi-server", "APIs, business logic and data modelling.", [
        ("Python", 92), ("Django", 90), ("Django REST Framework", 85), ("FastAPI", 72), ("Celery", 68),
    ]),
    ("Frontend Development", "bi-window-stack", "Responsive, accessible, pixel-perfect UIs.", [
        ("JavaScript", 84), ("HTML5", 92), ("CSS3", 88), ("Bootstrap", 90), ("React", 70),
    ]),
    ("Databases", "bi-database", "Schema design, query tuning and caching.", [
        ("PostgreSQL", 82), ("MySQL", 78), ("SQLite", 85), ("Redis", 66),
    ]),
    ("DevOps & Tools", "bi-gear-wide-connected", "Shipping reliably from laptop to cloud.", [
        ("Git", 90), ("Docker", 74), ("Linux", 78), ("GitHub Actions", 70), ("AWS", 62), ("Nginx", 65),
    ]),
]


class Command(BaseCommand):
    help = "Seed the database with demo portfolio content."

    def add_arguments(self, parser):
        parser.add_argument("--name", default="Your Name", help="Full name for the profile.")
        parser.add_argument("--email", default="hello@example.com", help="Contact email for the profile.")
        parser.add_argument("--reset", action="store_true", help="Delete existing portfolio content first.")

    @transaction.atomic
    def handle(self, *args, **opts):
        if opts["reset"]:
            for model in (Project, ProjectCategory, Experience, Education, Skill, SkillCategory, Technology, Profile):
                model.objects.all().delete()
            self.stdout.write(self.style.WARNING("Existing portfolio content deleted."))
        elif Profile.objects.exists():
            self.stdout.write(self.style.NOTICE("Profile already exists — skipping. Use --reset to reseed."))
            return

        tech = {name: Technology.objects.create(name=name, icon_class=icon) for name, icon in TECH_ICONS.items()}
        t = lambda *names: [tech[n] for n in names]  # noqa: E731

        Profile.objects.create(
            full_name=opts["name"],
            headline="Junior Software Engineer | Python Developer (Django)",
            typing_roles="Junior Software Engineer\nPython Developer (Django)",
            hero_intro=(
                "I design and build fast, secure and scalable web applications with Python and Django — "
                "from clean REST APIs to polished, responsive interfaces that users love."
            ),
            about=(
                "I'm a junior software engineer and Python developer specialising in Django, who loves turning complex problems into simple, elegant software. "
                "My core stack is Python and Django, paired with modern JavaScript and a strong eye for UI/UX.\n\n"
                "Over the past few years I've shipped production features across internships and professional roles — "
                "building REST APIs, payment flows, real-time dashboards and admin tooling used by thousands of people. "
                "I care deeply about readable code, automated tests and performance.\n\n"
                "When I'm not coding, I'm exploring new tech, contributing to open source, or writing about what I learn."
            ),
            email=opts["email"],
            phone="+1 555 012 3456",
            location="Remote · Worldwide",
            github_url="https://github.com/",
            linkedin_url="https://www.linkedin.com/",
            years_experience=2,
            projects_completed=15,
            available_for_work=True,
            meta_description="Junior Software Engineer and Python Developer (Django) portfolio — projects, experience and skills.",
        )

        for order, (cat_name, icon, desc, skills) in enumerate(SKILLS):
            cat = SkillCategory.objects.create(name=cat_name, icon=icon, description=desc, order=order)
            for s_order, (name, level) in enumerate(skills):
                Skill.objects.create(
                    category=cat, name=name, proficiency=level, order=s_order, icon_class=TECH_ICONS.get(name, "")
                )

        exp = Experience.objects.create(
            title="Software Engineer", company="Nimbus Labs", employment_type=Experience.EmploymentType.FULL_TIME,
            location="Remote", start_date=date(2025, 7, 1), is_current=True,
            summary="Building the core SaaS platform and internal tooling for a fast-growing B2B product.",
            highlights=(
                "Designed and shipped a multi-tenant REST API serving 2M+ requests/day\n"
                "Cut average page load time by 48% with query optimisation and Redis caching\n"
                "Introduced CI pipelines with automated tests, raising coverage from 41% to 87%\n"
                "Mentored two interns and led weekly code-review sessions"
            ),
        )
        exp.technologies.set(t("Python", "Django", "Django REST Framework", "PostgreSQL", "Redis", "Docker", "AWS"))

        exp = Experience.objects.create(
            title="Backend Developer Intern", company="ByteForge Technologies",
            employment_type=Experience.EmploymentType.INTERNSHIP, location="Hybrid",
            start_date=date(2024, 12, 1), end_date=date(2025, 6, 30),
            summary="Worked with the platform team on payments, notifications and the admin dashboard.",
            highlights=(
                "Built a Stripe-powered subscription billing module end-to-end\n"
                "Implemented async email & SMS notifications with Celery and Redis\n"
                "Created a custom Django admin dashboard that saved ops ~10 hours/week"
            ),
        )
        exp.technologies.set(t("Python", "Django", "Celery", "Redis", "Stripe", "MySQL"))

        exp = Experience.objects.create(
            title="Web Developer Intern", company="PixelCraft Studio",
            employment_type=Experience.EmploymentType.INTERNSHIP, location="On-site",
            start_date=date(2024, 5, 1), end_date=date(2024, 8, 31),
            summary="Developed responsive client websites and reusable UI components.",
            highlights=(
                "Delivered 6 responsive client websites with 95+ Lighthouse scores\n"
                "Built a reusable Bootstrap component library adopted across projects"
            ),
        )
        exp.technologies.set(t("HTML5", "CSS3", "JavaScript", "Bootstrap", "Git"))

        web = ProjectCategory.objects.create(name="Web Apps", order=0)
        api = ProjectCategory.objects.create(name="APIs & Backend", order=1)
        tools = ProjectCategory.objects.create(name="Tools & Data", order=2)

        projects = [
            dict(
                title="ShopSphere — E-commerce Platform", category=web, icon="bi-bag-heart", is_featured=True,
                tagline="Full-featured online store with cart, Stripe checkout, order tracking and an analytics dashboard.",
                description=(
                    "ShopSphere is a production-ready e-commerce platform built with Django. It supports product "
                    "variants, a persistent cart, coupon codes, secure Stripe checkout and real-time order tracking.\n\n"
                    "The admin side ships with a custom analytics dashboard showing revenue, conversion and top products."
                ),
                key_features="Stripe checkout & webhooks\nProduct variants and inventory\nOrder tracking emails\nSales analytics dashboard",
                techs=("Python", "Django", "PostgreSQL", "Stripe", "Bootstrap", "JavaScript", "Docker"),
                completed_on=date(2025, 9, 1),
            ),
            dict(
                title="TaskFlow — Team Productivity API", category=api, icon="bi-kanban", is_featured=True,
                tagline="RESTful project-management API with JWT auth, role-based permissions and real-time updates.",
                description=(
                    "TaskFlow is a REST API for team task management. It provides workspaces, boards, tasks, comments "
                    "and activity feeds, with JWT authentication and granular role-based permissions.\n\n"
                    "Live updates are pushed to clients over WebSockets, and heavy work runs in Celery background jobs."
                ),
                key_features="JWT auth with refresh tokens\nRole-based access control\nWebSocket live updates\nOpenAPI docs",
                techs=("Python", "Django REST Framework", "PostgreSQL", "Redis", "Celery", "WebSockets"),
                completed_on=date(2025, 5, 1),
            ),
            dict(
                title="DevBlog CMS", category=web, icon="bi-journal-code",
                tagline="Markdown-powered blogging platform with syntax highlighting, tags, search and SEO.",
                description=(
                    "A fast, SEO-friendly blogging CMS for developers. Authors write in Markdown with live preview; "
                    "readers get syntax-highlighted code, tag filtering and full-text search."
                ),
                key_features="Markdown editor with preview\nFull-text search\nRSS feed & sitemap\nDark/light reading mode",
                techs=("Python", "Django", "SQLite", "HTML5", "CSS3", "JavaScript"),
                completed_on=date(2024, 11, 1),
            ),
            dict(
                title="WeatherNow API Gateway", category=api, icon="bi-cloud-sun",
                tagline="High-performance async API aggregating multiple weather providers with caching and rate limiting.",
                description=(
                    "An async FastAPI gateway that normalises data from several weather providers, caches responses "
                    "in Redis and enforces per-key rate limits."
                ),
                key_features="Async provider fan-out\nRedis response caching\nAPI-key rate limiting",
                techs=("Python", "FastAPI", "Redis", "Docker"),
                completed_on=date(2024, 8, 1),
            ),
            dict(
                title="Expense Insights Dashboard", category=tools, icon="bi-graph-up-arrow",
                tagline="Personal finance tracker that turns bank CSV exports into interactive spending insights.",
                description=(
                    "Upload bank statements as CSV and get automatic categorisation, monthly budgets and interactive "
                    "charts. Built with Django, Pandas and Chart.js."
                ),
                key_features="CSV import & auto-categorisation\nMonthly budgets & alerts\nInteractive charts",
                techs=("Python", "Django", "Pandas", "Chart.js", "Bootstrap"),
                completed_on=date(2024, 4, 1),
            ),
            dict(
                title="DeployBot CLI", category=tools, icon="bi-terminal",
                tagline="Command-line tool that automates Django deployments to Linux servers with zero downtime.",
                description=(
                    "DeployBot provisions a server, configures Nginx and Gunicorn, runs migrations and performs "
                    "zero-downtime releases with a single command."
                ),
                key_features="One-command deploys\nAutomatic rollback\nNginx & SSL setup",
                techs=("Python", "Linux", "Nginx", "Docker", "GitHub Actions"),
                completed_on=date(2024, 1, 1),
            ),
        ]
        for order, data in enumerate(projects):
            techs = data.pop("techs")
            project = Project.objects.create(
                order=order, github_url="https://github.com/", live_url="https://example.com/", **data
            )
            project.technologies.set(t(*techs))

        Education.objects.create(
            degree="Bachelor of Technology", field_of_study="Computer Science & Engineering",
            institution="State University of Technology", start_year=2021, end_year=2025, grade="CGPA 8.7 / 10",
            description="Coursework in data structures, algorithms, DBMS, operating systems and web engineering.",
            order=0,
        )
        Education.objects.create(
            degree="Higher Secondary Education", field_of_study="Science (PCM) with Computer Science",
            institution="Greenfield Senior Secondary School", start_year=2019, end_year=2021, grade="92%",
            order=1,
        )

        self.stdout.write(self.style.SUCCESS("Demo portfolio content created. Edit everything at /admin/."))
