"""Workflow engine serializers."""
from rest_framework import serializers

from .models import ApprovalRequest, Workflow, WorkflowRun, WorkflowStep


class WorkflowStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowStep
        fields = ["id", "order", "action_type", "action_config"]


class WorkflowSerializer(serializers.ModelSerializer):
    steps = WorkflowStepSerializer(many=True, required=False)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Workflow
        fields = [
            "id",
            "name",
            "description",
            "trigger_type",
            "trigger_conditions",
            "is_active",
            "created_by",
            "created_at",
            "updated_at",
            "steps",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def create(self, validated_data):
        steps_data = validated_data.pop("steps", [])
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        workflow = Workflow.objects.create(**validated_data)
        for index, step in enumerate(steps_data):
            step.setdefault("order", index)
            WorkflowStep.objects.create(workflow=workflow, **step)
        return workflow

    def update(self, instance, validated_data):
        steps_data = validated_data.pop("steps", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if steps_data is not None:
            instance.steps.all().delete()
            for index, step in enumerate(steps_data):
                step.setdefault("order", index)
                WorkflowStep.objects.create(workflow=instance, **step)
        return instance


class WorkflowRunSerializer(serializers.ModelSerializer):
    workflow_name = serializers.CharField(source="workflow.name", read_only=True)

    class Meta:
        model = WorkflowRun
        fields = [
            "id",
            "workflow",
            "workflow_name",
            "trigger_payload",
            "status",
            "current_step",
            "log",
            "error_message",
            "started_at",
            "finished_at",
        ]
        read_only_fields = fields


class ApprovalRequestSerializer(serializers.ModelSerializer):
    workflow_name = serializers.CharField(source="workflow_run.workflow.name", read_only=True)

    class Meta:
        model = ApprovalRequest
        fields = [
            "id",
            "workflow_run",
            "workflow_name",
            "step",
            "approver",
            "status",
            "comment",
            "requested_at",
            "decided_at",
        ]
        read_only_fields = ["workflow_run", "step", "approver", "requested_at", "decided_at"]


class TriggerEventSerializer(serializers.Serializer):
    trigger_type = serializers.ChoiceField(choices=Workflow.TriggerType.choices)
    payload = serializers.JSONField(default=dict)


class ApprovalDecisionSerializer(serializers.Serializer):
    approved = serializers.BooleanField()
    comment = serializers.CharField(required=False, allow_blank=True, default="")
