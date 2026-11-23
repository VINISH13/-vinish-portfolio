# Developer Portfolio (Django)

A modern, dark-themed developer portfolio with neon accents and glassmorphism. All content is managed from the Django admin.

**Stack:** Python · Django 5 · SQLite · HTML5 · CSS3 · Bootstrap 5 · Vanilla JS

## Quick start

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_portfolio --name "Your Name" --email you@example.com   # optional demo content
python manage.py createsuperuser
python manage.py runserver
```

- Site: http://127.0.0.1:8000/
- Admin: http://127.0.0.1:8000/admin/

## Managing content (no code changes needed)

| Admin section       | Controls                                                                  |
|---------------------|---------------------------------------------------------------------------|
| **Profile**         | Name, headline, typing roles, intro, About text, photo, resume, socials, stats |
| **Skill categories**| Skill groups, with skills edited inline (proficiency %, Devicon icon)     |
| **Technologies**    | Tech badges reused by projects and experience                              |
| **Experience**      | Roles, internships, dates, highlights (one per line), tech stack          |
| **Projects**        | Cards, category (drives the filter), image, GitHub / live links, featured |
| **Education**       | Degrees, institutions, years, grade                                        |
| **Contact messages**| Form submissions; opening one marks it read; bulk read/unread actions     |

Uploading a **resume** turns on the "Download Resume" buttons. Uploading a **profile image** replaces the initials avatar. Projects without an image get a generated neon placeholder that uses the project's Bootstrap icon.

## Features

- Hero section with an animated typing effect, an orbiting tech avatar, and count-up stats
- Dark/light theme toggle. The choice is saved, and the first visit follows the OS setting with no flash on load.
- Scroll-reveal animations, an animated skill bar for each skill, a tech marquee, and 3D card tilt
- Responsive glass navbar that highlights the section in view, plus a scroll progress bar and a back-to-top button
- Project category filter with animated transitions, and a detail page for each project
- Contact form:
  - validated on both client and server
  - submitted with AJAX, with a fallback that works without JavaScript
  - protected by a honeypot field and per-IP rate limiting
  - can optionally send an email notification
- Respects `prefers-reduced-motion`. Includes a skip link and keyboard focus styles.
- Custom neon-themed Django admin with image previews, inline editing, and bulk actions

## Project structure

```
config/                 settings, urls, wsgi/asgi
portfolio/
  models.py             Profile, Skill(Category), Technology, Experience, Project(Category), Education, ContactMessage
  admin.py              customised admin
  views.py / forms.py   pages + contact handling
  context_processors.py profile & nav on every page
  management/commands/seed_portfolio.py
templates/
  base.html, 404.html
  partials/             navbar, footer, social links
  portfolio/sections/   hero, about, skills, experience, projects, education, contact
  portfolio/components/ section header, project card, tech badges
static/css/style.css    theme + all site styles
static/css/admin.css    admin theme
static/js/main.js       all interactions
static/js/theme-init.js pre-paint theme loader
```

## Configuration (environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | dev key | **Set in production** |
| `DJANGO_DEBUG` | `True` | Set `False` in production |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated |
| `CONTACT_NOTIFY_EMAIL` | empty | Email address that receives a notification for each new message |
| `DJANGO_EMAIL_BACKEND`, `DJANGO_EMAIL_HOST`, … | console | SMTP settings |
| `CONTACT_RATE_LIMIT` / `CONTACT_RATE_WINDOW` | `5` / `600` | Submissions allowed per IP per window (seconds) |

For production, run `python manage.py collectstatic` and serve `staticfiles/` and `media/` through your web server or a package like WhiteNoise.

## Designs

Two designs share the same content and backend:

| Design | Templates | Styles / JS |
|---|---|---|
| **Modern** (default, `v2`) | `templates/v2/` | `static/v2/css/style.css`, `static/v2/js/main.js` |
| **Neon** (`v1`) | `templates/portfolio/`, `templates/base.html` | `static/css/style.css`, `static/js/main.js` |

- Choose the live design with the `PORTFOLIO_UI` environment variable (`v2` or `v1`).
- The on-page design switcher has been removed; change `PORTFOLIO_UI` to switch designs.
- A full snapshot of the Neon design and its data (as of 2026-11-23) is in `backups/ui_v1_2026-11-23/`.
- **Futuristic** (`v3`, **chosen design — the default**): `templates/v3/`, `static/v3/css/style.css`, `static/v3/js/main.js`. The switcher shows all three designs.
- **Professional** (`v4`): `templates/v4/`, `static/v4/css/style.css`, `static/v4/js/main.js`. Light by default, with its own saved dark-mode choice.
- **Minimal 3D** (`v5`): `templates/v5/`, `static/v5/css/style.css`, `static/v5/js/main.js`. Uses Three.js (loaded from cdnjs) for the hero's interactive particle sphere; falls back to a soft glow if WebGL is unavailable.
