from django.core.validators import FileExtensionValidator, MaxValueValidator, MinValueValidator
from django.db import models
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


def _lines(text):
    """Split a textarea value into a clean list of non-empty lines."""
    return [line.strip(" -•\t") for line in (text or "").splitlines() if line.strip(" -•\t")]


# --------------------------------------------------------------------------- #
# Profile (singleton)
# --------------------------------------------------------------------------- #
class Profile(TimeStampedModel):
    full_name = models.CharField(max_length=120)
    headline = models.CharField(max_length=160, help_text="Short title, e.g. 'Full Stack Developer'.")
    typing_roles = models.TextField(
        default="Python Developer\nDjango Developer\nFull Stack Developer",
        help_text="Roles shown in the animated typing effect. One per line.",
    )
    hero_intro = models.TextField(help_text="One or two sentences shown in the hero banner.")
    about = models.TextField(help_text="About Me section. Blank lines separate paragraphs.")
    profile_image = models.ImageField(upload_to="profile/", blank=True)
    resume = models.FileField(
        upload_to="resume/",
        blank=True,
        validators=[FileExtensionValidator(["pdf", "doc", "docx"])],
        help_text="PDF recommended. Powers the 'Download Resume' button.",
    )

    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    location = models.CharField(max_length=120, blank=True)

    github_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    twitter_url = models.URLField("X / Twitter URL", blank=True)
    website_url = models.URLField(blank=True)

    years_experience = models.PositiveSmallIntegerField(default=1)
    projects_completed = models.PositiveSmallIntegerField(default=10)
    available_for_work = models.BooleanField(default=True)
    meta_description = models.CharField(max_length=160, blank=True, help_text="SEO description.")

    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profile"

    def __str__(self):
        return self.full_name

    @classmethod
    def get_solo(cls):
        return cls.objects.first()

    @property
    def roles_list(self):
        return _lines(self.typing_roles) or [self.headline]

    @property
    def _name_parts(self):
        # Treat dots as separators too, so "A.Vinish" -> ["A", "Vinish"].
        return [p for p in self.full_name.replace(".", " ").split() if p]

    @property
    def first_name(self):
        """Short display name for the logo; skips leading initials like 'A.'."""
        parts = self._name_parts
        named = [p for p in parts if len(p) > 1]
        return (named or parts or [""])[0]

    @property
    def initials(self):
        parts = self._name_parts
        return "".join(p[0] for p in parts[:2]).upper() if parts else "ME"


# --------------------------------------------------------------------------- #
# Skills & technologies
# --------------------------------------------------------------------------- #
class Technology(models.Model):
    name = models.CharField(max_length=60, unique=True)
    icon_class = models.CharField(
        max_length=80,
        blank=True,
        help_text="Optional Devicon class, e.g. 'devicon-python-plain colored'. See devicon.dev",
    )

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Technologies"

    def __str__(self):
        return self.name


class SkillCategory(models.Model):
    name = models.CharField(max_length=80, unique=True)
    icon = models.CharField(max_length=60, default="bi-code-slash", help_text="Bootstrap Icons class, e.g. 'bi-server'.")
    description = models.CharField(max_length=200, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]
        verbose_name_plural = "Skill categories"

    def __str__(self):
        return self.name


class Skill(models.Model):
    category = models.ForeignKey(SkillCategory, on_delete=models.CASCADE, related_name="skills")
    name = models.CharField(max_length=80)
    proficiency = models.PositiveSmallIntegerField(
        default=80, validators=[MinValueValidator(0), MaxValueValidator(100)], help_text="0–100"
    )
    icon_class = models.CharField(max_length=80, blank=True, help_text="Optional Devicon class.")
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "-proficiency", "name"]
        unique_together = ("category", "name")

    def __str__(self):
        return f"{self.name} ({self.proficiency}%)"

    @property
    def level_label(self):
        if self.proficiency >= 90:
            return "Expert"
        if self.proficiency >= 75:
            return "Advanced"
        if self.proficiency >= 55:
            return "Intermediate"
        return "Familiar"


# --------------------------------------------------------------------------- #
# Experience
# --------------------------------------------------------------------------- #
class Experience(TimeStampedModel):
    class EmploymentType(models.TextChoices):
        FULL_TIME = "full_time", "Full-time"
        PART_TIME = "part_time", "Part-time"
        INTERNSHIP = "internship", "Internship"
        CONTRACT = "contract", "Contract"
        FREELANCE = "freelance", "Freelance"

    title = models.CharField("Role", max_length=120)
    company = models.CharField(max_length=120)
    company_url = models.URLField(blank=True)
    employment_type = models.CharField(max_length=20, choices=EmploymentType.choices, default=EmploymentType.FULL_TIME)
    location = models.CharField(max_length=120, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField("Currently working here", default=False)
    summary = models.TextField(blank=True)
    highlights = models.TextField(blank=True, help_text="Key achievements. One per line.")
    technologies = models.ManyToManyField(Technology, blank=True, related_name="experiences")
    order = models.PositiveSmallIntegerField(default=0, help_text="Lower numbers appear first among equal dates.")
    is_active = models.BooleanField("Visible", default=True)

    class Meta:
        ordering = ["-is_current", "-start_date", "order"]
        verbose_name_plural = "Experience"

    def __str__(self):
        return f"{self.title} @ {self.company}"

    @property
    def highlights_list(self):
        return _lines(self.highlights)

    @property
    def duration(self):
        end = timezone.localdate() if self.is_current or not self.end_date else self.end_date
        months = (end.year - self.start_date.year) * 12 + end.month - self.start_date.month + 1
        years, months = divmod(max(months, 1), 12)
        parts = []
        if years:
            parts.append(f"{years} yr{'s' if years > 1 else ''}")
        if months:
            parts.append(f"{months} mo{'s' if months > 1 else ''}")
        return " ".join(parts)


# --------------------------------------------------------------------------- #
# Projects
# --------------------------------------------------------------------------- #
class ProjectCategory(models.Model):
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(max_length=60, unique=True, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]
        verbose_name_plural = "Project categories"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Project(TimeStampedModel):
    title = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    category = models.ForeignKey(
        ProjectCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="projects"
    )
    tagline = models.CharField(max_length=200, help_text="One-line summary shown on the card.")
    description = models.TextField(help_text="Full description for the project page. Blank lines separate paragraphs.")
    key_features = models.TextField(blank=True, help_text="One feature per line.")
    image = models.ImageField(upload_to="projects/", blank=True, help_text="Recommended 1200×750.")
    icon = models.CharField(max_length=60, default="bi-rocket-takeoff", help_text="Bootstrap icon used when no image is set.")
    technologies = models.ManyToManyField(Technology, blank=True, related_name="projects")
    github_url = models.URLField(blank=True)
    live_url = models.URLField("Live demo URL", blank=True)
    completed_on = models.DateField(null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "-is_featured", "-completed_on", "-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title) or "project"
            slug, n = base, 2
            while Project.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug, n = f"{base}-{n}", n + 1
            self.slug = slug
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse("portfolio:project_detail", kwargs={"slug": self.slug})

    @property
    def features_list(self):
        return _lines(self.key_features)


# --------------------------------------------------------------------------- #
# Education
# --------------------------------------------------------------------------- #
class Education(models.Model):
    degree = models.CharField(max_length=150)
    field_of_study = models.CharField(max_length=150, blank=True)
    institution = models.CharField(max_length=150)
    institution_url = models.URLField(blank=True)
    location = models.CharField(max_length=120, blank=True)
    start_year = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Optional. Leave empty to hide the years.")
    end_year = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Leave empty if ongoing.")
    grade = models.CharField(max_length=60, blank=True, help_text="e.g. 'CGPA 8.9 / 10'")
    description = models.TextField(blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "-start_year"]
        verbose_name_plural = "Education"

    def __str__(self):
        return f"{self.degree} — {self.institution}"


# --------------------------------------------------------------------------- #
# Contact messages
# --------------------------------------------------------------------------- #
class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=150)
    message = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name}: {self.subject}"
