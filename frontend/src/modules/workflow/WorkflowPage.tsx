import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ActionType, TriggerType, WorkflowStep } from "../../types/api";
import { workflowApi } from "./api";

const TRIGGER_TYPES: TriggerType[] = [
  "lead_created",
  "lead_status_changed",
  "deal_stage_changed",
  "ticket_created",
  "ticket_escalated",
  "customer_onboarded",
  "manual"
];

const ACTION_TYPES: ActionType[] = [
  "send_email",
  "send_sms",
  "create_task",
  "assign_lead",
  "escalate_ticket",
  "request_approval",
  "wait"
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  running: "bg-blue-100 text-blue-700",
  waiting_approval: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700"
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function StepBuilder({ steps, onChange }: { steps: WorkflowStep[]; onChange: (steps: WorkflowStep[]) => void }) {
  const addStep = () => {
    onChange([...steps, { order: steps.length, action_type: "send_email", action_config: {} }]);
  };

  const updateStep = (index: number, patch: Partial<WorkflowStep>) => {
    onChange(steps.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, order: i })));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const reordered = [...steps];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onChange(reordered.map((step, i) => ({ ...step, order: i })));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Steps</p>
        <button
          type="button"
          onClick={addStep}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          + Add step
        </button>
      </div>
      {steps.length === 0 && <p className="text-xs text-slate-400">No steps yet — add one to build the automation.</p>}
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
          <span className="w-5 text-center text-xs font-semibold text-slate-400">{index + 1}</span>
          <select
            value={step.action_type}
            onChange={(e) => updateStep(index, { action_type: e.target.value as ActionType })}
            className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
          >
            {ACTION_TYPES.map((action) => (
              <option key={action} value={action}>
                {action.replace("_", " ")}
              </option>
            ))}
          </select>
          <input
            placeholder='config JSON e.g. {"subject":"Welcome"}'
            defaultValue={JSON.stringify(step.action_config)}
            onBlur={(e) => {
              try {
                updateStep(index, { action_config: JSON.parse(e.target.value || "{}") });
              } catch {
                // ignore invalid JSON until corrected
              }
            }}
            className="flex-[2] rounded border border-slate-300 px-2 py-1 text-xs"
          />
          <button type="button" onClick={() => moveStep(index, -1)} className="text-xs text-slate-400 hover:text-slate-700">
            ↑
          </button>
          <button type="button" onClick={() => moveStep(index, 1)} className="text-xs text-slate-400 hover:text-slate-700">
            ↓
          </button>
          <button type="button" onClick={() => removeStep(index)} className="text-xs text-red-400 hover:text-red-600">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default function WorkflowPage() {
  const queryClient = useQueryClient();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("lead_created");
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  const [testPayload, setTestPayload] = useState('{"lead_id": 1, "email": "lead@example.com"}');

  const workflowsQuery = useQuery({ queryKey: ["workflows"], queryFn: workflowApi.list });
  const runsQuery = useQuery({
    queryKey: ["workflow-runs", selectedWorkflowId],
    queryFn: () => workflowApi.listRuns(selectedWorkflowId ?? undefined),
    enabled: workflowsQuery.isSuccess
  });
  const approvalsQuery = useQuery({ queryKey: ["approvals"], queryFn: () => workflowApi.listApprovals(true) });

  const createMutation = useMutation({
    mutationFn: () => workflowApi.create({ name, description, trigger_type: triggerType, is_active: true, steps }),
    onSuccess: () => {
      setName("");
      setDescription("");
      setSteps([]);
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, activate }: { id: number; activate: boolean }) =>
      activate ? workflowApi.activate(id) : workflowApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workflows"] })
  });

  const triggerMutation = useMutation({
    mutationFn: () => {
      const workflow = workflowsQuery.data?.find((w) => w.id === selectedWorkflowId);
      const payload = JSON.parse(testPayload || "{}");
      return workflowApi.trigger(workflow?.trigger_type ?? "manual", payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workflow-runs"] })
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) => workflowApi.decideApproval(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-runs"] });
    }
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-950">Workflow Automation Engine</h1>
        <p className="mt-1 text-sm text-slate-600">
          Build trigger-based automations — auto-assign leads, send follow-ups, escalate tickets, and route
          approvals — then watch them run.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">New workflow</h2>
          <form
            className="mt-3 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <input
              required
              placeholder="Name (e.g. Escalate urgent tickets)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              rows={2}
            />
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as TriggerType)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {TRIGGER_TYPES.map((trigger) => (
                <option key={trigger} value={trigger}>
                  {trigger.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            <StepBuilder steps={steps} onChange={setSteps} />

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {createMutation.isPending ? "Saving…" : "Create workflow"}
            </button>
          </form>

          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Workflows</h2>
          <ul className="mt-3 space-y-2">
            {workflowsQuery.data?.map((workflow) => (
              <li
                key={workflow.id}
                onClick={() => setSelectedWorkflowId(workflow.id)}
                className={`cursor-pointer rounded-md border p-3 text-sm transition ${
                  selectedWorkflowId === workflow.id ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{workflow.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMutation.mutate({ id: workflow.id, activate: !workflow.is_active });
                    }}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      workflow.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {workflow.is_active ? "Active" : "Inactive"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {workflow.trigger_type.replace(/_/g, " ")} · {workflow.steps.length} step
                  {workflow.steps.length === 1 ? "" : "s"}
                </p>
              </li>
            ))}
            {workflowsQuery.isSuccess && workflowsQuery.data.length === 0 && (
              <p className="text-xs text-slate-400">No workflows yet — create one above.</p>
            )}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Test trigger</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Fire the selected workflow's trigger type manually with a JSON payload to see it run.
            </p>
            <textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              rows={2}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
            />
            <button
              onClick={() => triggerMutation.mutate()}
              disabled={!selectedWorkflowId || triggerMutation.isPending}
              className="mt-2 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {selectedWorkflowId ? "Run test trigger" : "Select a workflow first"}
            </button>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Run history</h2>
            <div className="mt-3 space-y-3">
              {runsQuery.data?.map((run) => (
                <div key={run.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{run.workflow_name}</span>
                    <StatusBadge status={run.status} />
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {run.log.map((entry, i) => (
                      <li key={i}>
                        <span className="font-mono text-slate-400">#{entry.step}</span> {entry.action_type} —{" "}
                        {entry.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {runsQuery.isSuccess && runsQuery.data.length === 0 && (
                <p className="text-xs text-slate-400">No runs yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Approvals awaiting me</h2>
            <div className="mt-3 space-y-2">
              {approvalsQuery.data
                ?.filter((approval) => approval.status === "pending")
                .map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                    <span>{approval.workflow_name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => decideMutation.mutate({ id: approval.id, approved: true })}
                        className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => decideMutation.mutate({ id: approval.id, approved: false })}
                        className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              {approvalsQuery.isSuccess &&
                approvalsQuery.data.filter((approval) => approval.status === "pending").length === 0 && (
                  <p className="text-xs text-slate-400">Nothing waiting on you right now.</p>
                )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
