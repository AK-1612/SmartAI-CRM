import { apiClient } from "../../services/apiClient";

export type ChatPayload = {
  query: string;
};

export type ChatResponse = {
  query: string;
  response: string;
};

export const assistantApi = {
  chat: (payload: ChatPayload) => apiClient.post<ChatResponse>("/assistant/chat/", payload).then((res) => res.data),
};
