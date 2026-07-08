import {client} from './client';
export async function login(email:string,password:string){const body=new URLSearchParams({username:email,password});const {data}=await client.post('/auth/token',body,{headers:{'Content-Type':'application/x-www-form-urlencoded'}});localStorage.setItem('access_token',data.access_token);localStorage.setItem('refresh_token',data.refresh_token);localStorage.setItem('user_email',email);return data}
export function logout(){localStorage.removeItem('access_token');localStorage.removeItem('refresh_token');localStorage.removeItem('user_email');location.href='/login'}
