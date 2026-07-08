export const currency=(value:number|undefined)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value||0);
export const dateTime=(value:string|undefined)=>value?new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'—';
export const initials=(name:string)=>name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
export const apiError=(error:unknown)=>{if(typeof error==='object'&&error&&'response'in error){const e=error as {response?:{data?:{detail?:string}}};return e.response?.data?.detail||'Request failed'}return 'Something went wrong'};
