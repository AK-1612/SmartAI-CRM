import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json"
  }
});

// TODO: Add auth token injection and response interceptors when auth flows exist.
