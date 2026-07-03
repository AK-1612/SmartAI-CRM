from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.leads.models import Lead, LeadInteraction
from apps.leads.serializers import LeadSerializer, LeadInteractionSerializer
from apps.leads.services import AIScoringService

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer

    def perform_create(self, serializer):
        lead = serializer.save()
        AIScoringService.calculate_score(lead)

    def perform_update(self, serializer):
        lead = serializer.save()
        AIScoringService.calculate_score(lead)

    @action(detail=True, methods=['post'])
    def score(self, request, pk=None):
        """Force AI rescoring for a lead."""
        lead = self.get_object()
        AIScoringService.calculate_score(lead)
        serializer = self.get_serializer(lead)
        return Response(serializer.data)


class LeadInteractionViewSet(viewsets.ModelViewSet):
    queryset = LeadInteraction.objects.all()
    serializer_class = LeadInteractionSerializer

    def perform_create(self, serializer):
        # Set created_by to current user if request.user is authenticated
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(created_by=user)
