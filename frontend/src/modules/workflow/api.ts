import { apiClient } from "../../services/apiClient";
import type { ApprovalRequest, TriggerType, Workflow, WorkflowRun } from "../../types/api";

export const workflowApi = {
  list: () => apiClient.get<Workflow[]>("/workflow/workflows/").then((res) => res.data),

  create: (payload: Pick<Workflow, "name" | "description" | "trigger_type" | "is_active" | "steps">) =>
    apiClient.post<Workflow>("/workflow/workflows/", payload).then((res) => res.data),

  activate: (id: number) => apiClient.post<Workflow>(`/workflow/workflows/${id}/activate/`).then((res) => res.data),

  deactivate: (id: number) =>
    apiClient.post<Workflow>(`/workflow/workflows/${id}/deactivate/`).then((res) => res.data),

  trigger: (triggerType: TriggerType, payload: Record<string, unknown>) =>
    apiClient
      .post<WorkflowRun[]>("/workflow/workflows/trigger/", { trigger_type: triggerType, payload })
      .then((res) => res.data),

  listRuns: (workflowId?: number) =>
    apiClient
      .get<WorkflowRun[]>("/workflow/runs/", { params: workflowId ? { workflow: workflowId } : undefined })
      .then((res) => res.data),

  listApprovals: (mineOnly: boolean) =>
    apiClient
      .get<ApprovalRequest[]>("/workflow/approvals/", { params: { mine: mineOnly ? "true" : "false" } })
      .then((res) => res.data),

  decideApproval: (id: number, approved: boolean, comment = "") =>
    apiClient
      .post<ApprovalRequest>(`/workflow/approvals/${id}/decide/`, { approved, comment })
      .then((res) => res.data)
};
