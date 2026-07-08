import {client} from './client';import type {Contact,ContactInput,ContactPage,ContactQuery} from '../types';
export const getContacts=async(params:ContactQuery)=>(await client.get<ContactPage>('/contacts',{params})).data;
export const getContact=async(id:string)=>(await client.get<Contact>(`/contacts/${id}`)).data;
export const createContact=async(input:ContactInput)=>(await client.post<Contact>('/contacts',input)).data;
export const updateContact=async(id:string,input:Partial<ContactInput>)=>(await client.patch<Contact>(`/contacts/${id}`,input)).data;
export const deleteContact=async(id:string)=>client.delete(`/contacts/${id}`);
export const getTimeline=async(id:string)=>(await client.get(`/contacts/${id}/timeline`)).data;
