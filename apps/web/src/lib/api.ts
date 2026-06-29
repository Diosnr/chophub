import axios from 'axios';
import { useAuth } from './auth';

const baseURL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function signup(payload: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  referredBy?: string;
}) {
  const res = await api.post('/api/auth/signup', payload);
  return res.data as { token: string; user: import('./auth').AuthUser };
}

export async function login(payload: { email: string; password: string }) {
  const res = await api.post('/api/auth/login', payload);
  return res.data as { token: string; user: import('./auth').AuthUser };
}

export async function fetchMe() {
  const res = await api.get('/api/auth/me');
  return res.data;
}
