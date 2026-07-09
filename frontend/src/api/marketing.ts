import {client} from './client';

export type Campaign = {
  id: string;
  name: string;
  channel: 'Email' | 'SMS' | 'WhatsApp';
  status: 'Draft' | 'Scheduled' | 'Active' | 'Completed';
  subject?: string | null;
  content?: string | null;
  target_segment?: string | null;
  sent_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
  sent_at?: string | null;
};

export type CampaignInput = Omit<Campaign, 'id' | 'sent_count' | 'open_count' | 'click_count' | 'created_at' | 'sent_at'>;

export const getCampaigns = async (params?: { channel?: string; status?: string }) => 
  (await client.get<Campaign[]>('/campaigns', { params })).data;

export const createCampaign = async (input: CampaignInput) => 
  (await client.post<Campaign>('/campaigns', input)).data;

export const updateCampaign = async (id: string, input: Partial<CampaignInput>) => 
  (await client.patch<Campaign>(`/campaigns/${id}`, input)).data;

export const sendCampaign = async (id: string) => 
  (await client.post<Campaign>(`/campaigns/${id}/send`)).data;

export const deleteCampaign = async (id: string) => 
  client.delete(`/campaigns/${id}`);
