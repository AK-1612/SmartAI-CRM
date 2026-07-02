"""Workflow engine API views."""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ApprovalRequest, Workflow, WorkflowRun
from .serializers import (
    ApprovalDecisionSerializer,
    ApprovalRequestSerializer,
    TriggerEventSerializer,
    WorkflowRunSerializer,
    WorkflowSerializer,
)
from .services import ApprovalService, WorkflowService


class WorkflowViewSet(viewsets.ModelViewSet):
    """CRUD for workflow definitions, plus activate/deactivate/trigger actions."""

    queryset = Workflow.objects.prefetch_related("steps").all()
    serializer_class = WorkflowSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        workflow = self.get_object()
        workflow.is_active = True
        workflow.save(update_fields=["is_active"])
        return Response(self.get_serializer(workflow).data)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        workflow = self.get_object()
        workflow.is_active = False
        workflow.save(update_fields=["is_active"])
        return Response(self.get_serializer(workflow).data)

    @action(detail=False, methods=["post"])
    def trigger(self, request):
        """Manually fire a trigger event. Other backend modules can call
        ``WorkflowService.trigger_event(...)`` directly instead of hitting this
        endpoint — it mainly exists for demos, tests, and the "run now" button."""
        serializer = TriggerEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        runs = WorkflowService.trigger_event(**serializer.validated_data)
        return Response(WorkflowRunSerializer(runs, many=True).data, status=status.HTTP_201_CREATED)


class WorkflowRunViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only execution history, filterable by ?workflow= and ?status=."""

    queryset = WorkflowRun.objects.select_related("workflow").all()
    serializer_class = WorkflowRunSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        workflow_id = self.request.query_params.get("workflow")
        if workflow_id:
            queryset = queryset.filter(workflow_id=workflow_id)
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset


class ApprovalRequestViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only list of approval requests, with a decide() action to approve/reject."""

    serializer_class = ApprovalRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ApprovalRequest.objects.select_related("workflow_run__workflow")
        if self.request.query_params.get("mine") == "true":
            queryset = queryset.filter(approver=self.request.user)
        return queryset

    @action(detail=True, methods=["post"])
    def decide(self, request, pk=None):
        approval_request = self.get_object()
        serializer = ApprovalDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ApprovalService.decide(approval_request, **serializer.validated_data)
        return Response(ApprovalRequestSerializer(approval_request).data)
