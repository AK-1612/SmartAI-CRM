from rest_framework import viewsets
from apps.communication.models import CommunicationLog, MessageTemplate
from apps.communication.serializers import CommunicationLogSerializer, MessageTemplateSerializer
from apps.communication.services import CommunicationService

class CommunicationLogViewSet(viewsets.ModelViewSet):
    queryset = CommunicationLog.objects.all()
    serializer_class = CommunicationLogSerializer

    def perform_create(self, serializer):
        # Set sent_by to current user if request.user is authenticated
        user = self.request.user if self.request.user.is_authenticated else None
        log_entry = serializer.save(sent_by=user, status='PENDING')
        
        # Dispatch message
        CommunicationService.send_message(log_entry)


class MessageTemplateViewSet(viewsets.ModelViewSet):
    queryset = MessageTemplate.objects.all()
    serializer_class = MessageTemplateSerializer
