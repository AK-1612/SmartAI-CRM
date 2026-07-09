import {client} from './client';

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  due_at?: string | null;
  read_at?: string | null;
  created_at: string;
};

export type NotificationInput = {
  title: string;
  message: string;
  type?: string;
  due_at?: string | null;
};

export const getNotifications = async (unread_only: boolean = false) => 
  (await client.get<Notification[]>('/notifications', { params: { unread_only } })).data;

export const createNotification = async (input: NotificationInput) => 
  (await client.post<Notification>('/notifications', input)).data;

export const markNotificationRead = async (id: string) => 
  (await client.post<Notification>(`/notifications/${id}/read`)).data;

export const deleteNotification = async (id: string) => 
  client.delete(`/notifications/${id}`);
