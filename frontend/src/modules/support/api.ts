import { apiClient } from "../../services/apiClient";
import type {
  ChatbotReply,
  KnowledgeBaseArticle,
  SupportSummary,
  Ticket,
  TicketComment
} from "../../types/api";

export type TicketFilters = {
  status?: string;
  priority?: string;
  assigned_to?: "me" | "unassigned";
};

export type CreateTicketPayload = {
  subject: string;
  description: string;
  customer_name: string;
  customer_email: string;
  priority?: string;
};

export const supportApi = {
  listTickets: (filters?: TicketFilters) =>
    apiClient.get<Ticket[]>("/support/tickets/", { params: filters }).then((res) => res.data),

  createTicket: (payload: CreateTicketPayload) =>
    apiClient.post<Ticket>("/support/tickets/", payload).then((res) => res.data),

  assign: (id: number, agentId: number) =>
    apiClient.post<Ticket>(`/support/tickets/${id}/assign/`, { agent_id: agentId }).then((res) => res.data),

  resolve: (id: number) => apiClient.post<Ticket>(`/support/tickets/${id}/resolve/`).then((res) => res.data),

  escalate: (id: number) => apiClient.post<Ticket>(`/support/tickets/${id}/escalate/`).then((res) => res.data),

  listComments: (id: number) =>
    apiClient.get<TicketComment[]>(`/support/tickets/${id}/comments/`).then((res) => res.data),

  addComment: (id: number, body: string, isInternal = false) =>
    apiClient
      .post<TicketComment>(`/support/tickets/${id}/comments/`, { body, is_internal: isInternal })
      .then((res) => res.data),

  suggestResponse: (id: number) =>
    apiClient
      .get<{ suggested_response: string }>(`/support/tickets/${id}/suggest-response/`)
      .then((res) => res.data),

  chatbot: (message: string) =>
    apiClient.post<ChatbotReply>("/support/chatbot/", { message }).then((res) => res.data),

  listArticles: () =>
    apiClient
      .get<KnowledgeBaseArticle[]>("/support/kb-articles/", { params: { published: "true" } })
      .then((res) => res.data),

  summary: () => apiClient.get<SupportSummary>("/support/summary/").then((res) => res.data)
};
