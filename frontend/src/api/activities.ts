import {client} from './client';import type {Activity,ActivityInput} from '../types';
export const getActivities=async(params?:{contact_id?:string;type?:string})=>(await client.get<Activity[]>('/activities',{params})).data;
export const createActivity=async(input:ActivityInput)=>(await client.post<Activity>('/activities',input)).data;
export const deleteActivity=async(id:string)=>client.delete(`/activities/${id}`);
