"""Customer support models."""
from django.conf import settings
from django.db import models
from django.utils import timezone


class SLAPolicy(models.Model):
    """Response/resolution targets per priority level."""

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    name = models.CharField(max_length=100)
    priority = models.CharField(max_length=10, choices=Priority.choices, unique=True)
    response_time_minutes = models.PositiveIntegerField(help_text="Target time to first response.")
    resolution_time_minutes = models.PositiveIntegerField(help_text="Target time to resolution.")

    class Meta:
        verbose_name = "SLA policy"
        verbose_name_plural = "SLA policies"

    def __str__(self) -> str:
        return f"{self.name} ({self.priority})"


class KnowledgeBaseArticle(models.Model):
    """A published help-center article, also used as the chatbot's answer source."""

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    body = models.TextField()
    category = models.CharField(max_length=100, blank=True)
    keywords = models.JSONField(default=list, blank=True, help_text="Extra terms for search/chatbot matching.")
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title


class Ticket(models.Model):
    """A support ticket raised by a customer."""

    class Status(models.TextChoices):
        NEW = "new", "New"
        OPEN = "open", "Open"
        PENDING = "pending", "Pending Customer"
        ESCALATED = "escalated", "Escalated"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    class Category(models.TextChoices):
        BILLING = "billing", "Billing"
        TECHNICAL = "technical", "Technical"
        ACCOUNT = "account", "Account"
        FEATURE_REQUEST = "feature_request", "Feature Request"
        COMPLAINT = "complaint", "Complaint"
        GENERAL = "general", "General"

    class Sentiment(models.TextChoices):
        POSITIVE = "positive", "Positive"
        NEUTRAL = "neutral", "Neutral"
        NEGATIVE = "negative", "Negative"

    subject = models.CharField(max_length=200)
    description = models.TextField()
    customer_name = models.CharField(max_length=150)
    customer_email = models.EmailField()

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.GENERAL)
    sentiment = models.CharField(max_length=10, choices=Sentiment.choices, blank=True)
    sentiment_score = models.FloatField(null=True, blank=True, help_text="-1.0 (negative) to 1.0 (positive).")

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets_logged",
    )

    sla_policy = models.ForeignKey(SLAPolicy, on_delete=models.SET_NULL, null=True, blank=True, related_name="tickets")
    response_due_at = models.DateTimeField(null=True, blank=True)
    resolution_due_at = models.DateTimeField(null=True, blank=True)
    first_responded_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "priority"]),
            models.Index(fields=["assigned_to", "status"]),
        ]

    def __str__(self) -> str:
        return f"#{self.pk} {self.subject}"

    @property
    def is_response_sla_breached(self) -> bool:
        if not self.response_due_at:
            return False
        checkpoint = self.first_responded_at or timezone.now()
        return checkpoint > self.response_due_at

    @property
    def is_resolution_sla_breached(self) -> bool:
        if not self.resolution_due_at:
            return False
        checkpoint = self.resolved_at or timezone.now()
        return checkpoint > self.resolution_due_at


class TicketComment(models.Model):
    """A reply or internal note on a ticket."""

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    body = models.TextField()
    is_internal = models.BooleanField(default=False, help_text="Internal note, not visible to the customer.")
    is_ai_suggested = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Comment on #{self.ticket_id} by {self.author_id}"
