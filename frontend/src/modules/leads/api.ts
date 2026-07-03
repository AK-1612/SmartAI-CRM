import { apiClient } from "../../services/apiClient";
import type { Lead, LeadInteraction, LeadStatus } from "../../types/api";

export type CreateLeadPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  status?: LeadStatus;
  source?: string;
};

export type CreateInteractionPayload = {
  lead: number;
  interaction_type: "EMAIL" | "CALL" | "MEETING" | "NOTE";
  notes: string;
};

export const leadsApi = {
  listLeads: () => apiClient.get<Lead[]>("/leads/leads/").then((res) => res.data),
  
  getLead: (id: number) => apiClient.get<Lead>(`/leads/leads/${id}/`).then((res) => res.data),
  
  createLead: (payload: CreateLeadPayload) => apiClient.post<Lead>("/leads/leads/", payload).then((res) => res.data),
  
  updateLead: (id: number, payload: Partial<CreateLeadPayload>) => apiClient.patch<Lead>(`/leads/leads/${id}/`, payload).then((res) => res.data),
  
  deleteLead: (id: number) => apiClient.delete(`/leads/leads/${id}/`).then((res) => res.data),
  
  scoreLead: (id: number) => apiClient.post<Lead>(`/leads/leads/${id}/score/`).then((res) => res.data),
  
  listInteractions: () => apiClient.get<LeadInteraction[]>("/leads/interactions/").then((res) => res.data),
  
  createInteraction: (payload: CreateInteractionPayload) => apiClient.post<LeadInteraction>("/leads/interactions/", payload).then((res) => res.data),
};
