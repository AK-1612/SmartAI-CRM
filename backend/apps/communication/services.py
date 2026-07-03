import os
import logging
from apps.communication.models import CommunicationLog

logger = logging.getLogger(__name__)

# Try importing twilio, but fallback safely if not installed yet.
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False


class TwilioService:
    @staticmethod
    def send_sms(to_number, body):
        """Send an SMS using Twilio."""
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        from_number = os.environ.get('TWILIO_PHONE_NUMBER')
        
        if not all([account_sid, auth_token, from_number]):
            logger.warning("Twilio credentials missing. Mocking SMS send.")
            return "mocked-sid-sms"
            
        if not TWILIO_AVAILABLE:
            logger.warning("twilio package not installed. Mocking SMS send.")
            return "mocked-sid-sms"
            
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=body,
            from_=from_number,
            to=to_number
        )
        return message.sid

    @staticmethod
    def send_whatsapp(to_number, body):
        """Send a WhatsApp message using Twilio."""
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        from_whatsapp_number = os.environ.get('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')
        
        # Ensure to_number is formatted for whatsapp
        if not to_number.startswith('whatsapp:'):
            to_number = f"whatsapp:{to_number}"
            
        if not all([account_sid, auth_token, from_whatsapp_number]):
            logger.warning("Twilio credentials missing. Mocking WhatsApp send.")
            return "mocked-sid-whatsapp"
            
        if not TWILIO_AVAILABLE:
            logger.warning("twilio package not installed. Mocking WhatsApp send.")
            return "mocked-sid-whatsapp"
            
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=body,
            from_=from_whatsapp_number,
            to=to_number
        )
        return message.sid


class EmailService:
    @staticmethod
    def send_email(to_email, subject, body):
        """Send an email using Django's core mail system."""
        from django.core.mail import send_mail
        from django.conf import settings
        
        try:
            # Using Django's configured EMAIL_HOST etc.
            send_mail(
                subject,
                body,
                settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@example.com',
                [to_email],
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            raise e

class CommunicationService:
    @staticmethod
    def send_message(log_entry: CommunicationLog):
        """Dispatches the message to the correct service and updates the log."""
        try:
            if log_entry.channel == 'SMS':
                TwilioService.send_sms(log_entry.recipient, log_entry.content)
            elif log_entry.channel == 'WHATSAPP':
                TwilioService.send_whatsapp(log_entry.recipient, log_entry.content)
            elif log_entry.channel == 'EMAIL':
                EmailService.send_email(log_entry.recipient, log_entry.subject, log_entry.content)
                
            log_entry.status = 'SENT'
        except Exception as e:
            log_entry.status = 'FAILED'
            log_entry.error_message = str(e)
            
        log_entry.save(update_fields=['status', 'error_message'])
        return log_entry
