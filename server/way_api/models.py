from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, username=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Role.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        USER = "user", "User"
        ADMIN = "admin", "Admin"

    username = models.CharField(max_length=150, blank=True)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=120)
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.USER)
    grade_or_age = models.CharField(max_length=40, blank=True)
    preferred_language = models.CharField(max_length=8, default="ru")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]
    objects = UserManager()


class Profession(models.Model):
    slug = models.SlugField(unique=True)
    title_ru = models.CharField(max_length=160)
    title_en = models.CharField(max_length=160)
    description_ru = models.TextField()
    description_en = models.TextField()
    category = models.CharField(max_length=40)
    skills = models.JSONField(default=list)
    fit_tags = models.JSONField(default=list)
    details = models.JSONField(default=dict)
    scoring_tags = models.JSONField(default=list)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title_en"]


class TestQuestion(models.Model):
    category = models.CharField(max_length=40)
    sort_order = models.PositiveIntegerField(unique=True)
    text_ru = models.TextField()
    text_en = models.TextField()
    type = models.CharField(max_length=40, default="single_choice")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order"]


class TestQuestionOption(models.Model):
    question = models.ForeignKey(TestQuestion, related_name="options", on_delete=models.CASCADE)
    label_ru = models.CharField(max_length=220)
    label_en = models.CharField(max_length=220)
    value = models.IntegerField()
    scoring_payload = models.JSONField(default=dict)
    sort_order = models.PositiveIntegerField()

    class Meta:
        ordering = ["sort_order"]
        unique_together = ("question", "sort_order")


class TestAttempt(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"
        ABANDONED = "abandoned", "Abandoned"

    user = models.ForeignKey(User, related_name="attempts", on_delete=models.CASCADE)
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.IN_PROGRESS)


class TestAnswer(models.Model):
    attempt = models.ForeignKey(TestAttempt, related_name="answers", on_delete=models.CASCADE)
    question = models.ForeignKey(TestQuestion, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(TestQuestionOption, on_delete=models.PROTECT)
    numeric_value = models.IntegerField(null=True, blank=True)
    payload_snapshot = models.JSONField(default=dict)

    class Meta:
        unique_together = ("attempt", "question")


class TestResult(models.Model):
    attempt = models.OneToOneField(TestAttempt, related_name="result", on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name="results", on_delete=models.CASCADE)
    summary_ru = models.TextField()
    summary_en = models.TextField()
    strengths = models.JSONField(default=list)
    work_style = models.JSONField(default=dict)
    preferred_environment = models.JSONField(default=dict)
    recommended_directions = models.JSONField(default=list)
    roadmap = models.JSONField(default=list)
    ai_explanation_ru = models.TextField(blank=True)
    ai_explanation_en = models.TextField(blank=True)
    ai_reasoning_ru = models.JSONField(default=list)
    ai_reasoning_en = models.JSONField(default=list)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]


class ResultRecommendation(models.Model):
    result = models.ForeignKey(TestResult, related_name="recommendations", on_delete=models.CASCADE)
    profession = models.ForeignKey(Profession, related_name="recommendations", on_delete=models.CASCADE)
    match_percent = models.PositiveIntegerField()
    reason_ru = models.TextField()
    reason_en = models.TextField()

    class Meta:
        unique_together = ("result", "profession")


class SavedProfession(models.Model):
    user = models.ForeignKey(User, related_name="saved_professions", on_delete=models.CASCADE)
    profession = models.ForeignKey(Profession, related_name="saved_by", on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("user", "profession")
        ordering = ["-created_at"]


class GuideConversation(models.Model):
    user = models.ForeignKey(User, related_name="conversations", on_delete=models.CASCADE)
    title = models.CharField(max_length=160)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]


class GuideMessage(models.Model):
    class Role(models.TextChoices):
        USER = "user", "User"
        ASSISTANT = "assistant", "Assistant"
        SYSTEM = "system", "System"

    conversation = models.ForeignKey(GuideConversation, related_name="messages", on_delete=models.CASCADE)
    role = models.CharField(max_length=16, choices=Role.choices)
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["created_at"]


class AdminAuditLog(models.Model):
    admin_user = models.ForeignKey(User, related_name="audit_logs", on_delete=models.CASCADE)
    action = models.CharField(max_length=80)
    target_user = models.ForeignKey(User, null=True, blank=True, related_name="targeted_audit_logs", on_delete=models.SET_NULL)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)
