import {client} from './client';import type {DashboardData} from '../types';
export const getDashboard=async()=>(await client.get<DashboardData>('/dashboard')).data;
