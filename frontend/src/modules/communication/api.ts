import { apiClient } from "../../services/apiClient";
import type { CommunicationLog, MessageTemplate } from "../../types/api";

export type SendMessagePayload = {
  lead?: number;
  recipient: string;
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  subject?: string;
  content: string;
};

export const communicationApi = {
  listLogs: () => apiClient.get<CommunicationLog[]>("/communication/logs/").then((res) => res.data),
  
  sendLog: (payload: SendMessagePayload) => apiClient.post<CommunicationLog>("/communication/logs/", payload).then((res) => res.data),
  
  listTemplates: () => apiClient.get<MessageTemplate[]>("/communication/templates/").then((res) => res.data),
};
