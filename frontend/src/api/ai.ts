import {client} from './client';import type {AIFeatures,AIResult} from '../types';
export async function predict(features:AIFeatures){try{return (await client.post<AIResult>('/ml/predict',features)).data}catch{return (await client.post<AIResult>('/predict',features)).data}}
