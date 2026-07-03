from django.db import models
from django.conf import settings

class Lead(models.Model):
    STATUS_CHOICES = [
        ('NEW', 'New'),
        ('CONTACTED', 'Contacted'),
        ('QUALIFIED', 'Qualified'),
        ('CONVERTED', 'Converted'),
        ('LOST', 'Lost'),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    company = models.CharField(max_length=255, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')
    source = models.CharField(max_length=100, blank=True, help_text="e.g., Website, Referral, Cold Call")
    
    # AI Scoring Fields
    score = models.IntegerField(default=0, help_text="AI calculated score (0-100)")
    conversion_probability = models.FloatField(default=0.0, help_text="Probability of conversion (0.0 to 1.0)")
    ai_insights = models.TextField(blank=True, help_text="AI generated insights or reasons for the score")
    
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.company})"

    class Meta:
        ordering = ['-score', '-created_at']


class LeadInteraction(models.Model):
    INTERACTION_TYPES = [
        ('EMAIL', 'Email'),
        ('CALL', 'Call'),
        ('MEETING', 'Meeting'),
        ('NOTE', 'Note'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='interactions')
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPES)
    notes = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='logged_interactions')

    def __str__(self):
        return f"{self.interaction_type} for {self.lead} on {self.date.strftime('%Y-%m-%d')}"
    
    class Meta:
        ordering = ['-date']
