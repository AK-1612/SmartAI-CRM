"""Workflow engine tests."""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Workflow, WorkflowRun, WorkflowStep


class WorkflowExecutionTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="agent", password="pass12345")
        self.client.force_authenticate(self.user)

    def test_trigger_runs_active_workflow_and_logs_each_step(self):
        workflow = Workflow.objects.create(
            name="Auto-assign new leads",
            trigger_type=Workflow.TriggerType.LEAD_CREATED,
            created_by=self.user,
        )
        WorkflowStep.objects.create(
            workflow=workflow,
            order=0,
            action_type=WorkflowStep.ActionType.ASSIGN_LEAD,
            action_config={"assignee": "round_robin"},
        )
        WorkflowStep.objects.create(
            workflow=workflow,
            order=1,
            action_type=WorkflowStep.ActionType.SEND_EMAIL,
            action_config={"subject": "Welcome"},
        )

        response = self.client.post(
            reverse("workflow:workflow-trigger"),
            {"trigger_type": "lead_created", "payload": {"lead_id": 1, "email": "lead@example.com"}},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        run = WorkflowRun.objects.get()
        self.assertEqual(run.status, WorkflowRun.Status.COMPLETED)
        self.assertEqual(len(run.log), 2)
        self.assertTrue(all(entry["status"] == "ok" for entry in run.log))

    def test_inactive_workflow_is_not_triggered(self):
        Workflow.objects.create(
            name="Disabled automation",
            trigger_type=Workflow.TriggerType.LEAD_CREATED,
            is_active=False,
            created_by=self.user,
        )
        self.client.post(
            reverse("workflow:workflow-trigger"),
            {"trigger_type": "lead_created", "payload": {}},
            format="json",
        )
        self.assertEqual(WorkflowRun.objects.count(), 0)

    def test_trigger_conditions_filter_out_non_matching_events(self):
        Workflow.objects.create(
            name="High priority tickets only",
            trigger_type=Workflow.TriggerType.TICKET_CREATED,
            trigger_conditions={"priority": "high"},
            created_by=self.user,
        )
        response = self.client.post(
            reverse("workflow:workflow-trigger"),
            {"trigger_type": "ticket_created", "payload": {"priority": "low"}},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(WorkflowRun.objects.count(), 0)

    def test_approval_step_pauses_run_until_decision(self):
        approver = get_user_model().objects.create_user(username="manager", password="pass12345")
        workflow = Workflow.objects.create(
            name="Big discount approval",
            trigger_type=Workflow.TriggerType.MANUAL,
            created_by=self.user,
        )
        WorkflowStep.objects.create(
            workflow=workflow,
            order=0,
            action_type=WorkflowStep.ActionType.REQUEST_APPROVAL,
            action_config={"approver_id": approver.id},
        )
        WorkflowStep.objects.create(
            workflow=workflow, order=1, action_type=WorkflowStep.ActionType.SEND_EMAIL,
        )

        self.client.post(
            reverse("workflow:workflow-trigger"),
            {"trigger_type": "manual", "payload": {}},
            format="json",
        )
        run = WorkflowRun.objects.get()
        self.assertEqual(run.status, WorkflowRun.Status.WAITING_APPROVAL)

        approval = run.approval_requests.get()
        self.client.force_authenticate(approver)
        response = self.client.post(
            reverse("workflow:approval-request-decide", args=[approval.id]),
            {"approved": True},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        run.refresh_from_db()
        self.assertEqual(run.status, WorkflowRun.Status.COMPLETED)
        self.assertEqual(len(run.log), 2)
