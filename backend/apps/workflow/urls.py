"""Workflow engine API routes."""
from rest_framework.routers import DefaultRouter

from .views import ApprovalRequestViewSet, WorkflowRunViewSet, WorkflowViewSet

app_name = "workflow"

router = DefaultRouter()
router.register("workflows", WorkflowViewSet, basename="workflow")
router.register("runs", WorkflowRunViewSet, basename="workflow-run")
router.register("approvals", ApprovalRequestViewSet, basename="approval-request")

urlpatterns = router.urls
