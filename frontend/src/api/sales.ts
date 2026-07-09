import {client} from './client';

export type Deal = {
  id: string;
  contact_id: string;
  name: string;
  stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  value: number;
  close_date: string;
  status: 'Open' | 'Won' | 'Lost';
  created_at: string;
  updated_at: string;
};

export type DealInput = Omit<Deal, 'id' | 'created_at' | 'updated_at'>;

export type ForecastData = {
  pipeline_total: number;
  forecasted_revenue: number;
  actual_won_revenue: number;
  open_deals_count: number;
};

export const getDeals = async (params?: { contact_id?: string; stage?: string }) => 
  (await client.get<Deal[]>('/deals', { params })).data;

export const createDeal = async (input: DealInput) => 
  (await client.post<Deal>('/deals', input)).data;

export const updateDeal = async (id: string, input: Partial<DealInput>) => 
  (await client.patch<Deal>(`/deals/${id}`, input)).data;

export const deleteDeal = async (id: string) => 
  client.delete(`/deals/${id}`);

export const getForecast = async () => 
  (await client.get<ForecastData>('/deals/forecast')).data;
