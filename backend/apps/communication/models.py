from django.db import models
from django.conf import settings
from apps.leads.models import Lead

class CommunicationLog(models.Model):
    CHANNEL_CHOICES = [
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
        ('WHATSAPP', 'WhatsApp'),
        ('CALL', 'Call'),
    ]
    
    DIRECTION_CHOICES = [
        ('INBOUND', 'Inbound'),
        ('OUTBOUND', 'Outbound'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('FAILED', 'Failed'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='communications')
    # If dealing with contacts, we could add a contact ForeignKey here later.
    
    recipient = models.CharField(max_length=255, help_text="Email address or phone number")
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    direction = models.CharField(max_length=20, choices=DIRECTION_CHOICES, default='OUTBOUND')
    
    subject = models.CharField(max_length=255, blank=True, help_text="Used primarily for emails")
    content = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    error_message = models.TextField(blank=True)
    
    sent_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_communications')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.channel} to {self.recipient} ({self.status})"
    
    class Meta:
        ordering = ['-timestamp']


class MessageTemplate(models.Model):
    name = models.CharField(max_length=100, unique=True)
    channel = models.CharField(max_length=20, choices=CommunicationLog.CHANNEL_CHOICES)
    subject_template = models.CharField(max_length=255, blank=True)
    body_template = models.TextField(help_text="Use {{ variable }} syntax for interpolation")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
