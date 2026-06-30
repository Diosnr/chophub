import axios from 'axios';
import { useAuth } from './auth';

const baseURL = (import.meta.env.VITE_API_URL as string) || '';

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
  return res.data as {
    token: string;
    requiresVerification: boolean;
    user: import('./auth').AuthUser;
  };
}

export async function login(payload: { email: string; password: string }) {
  const res = await api.post('/api/auth/login', payload);
  return res.data as {
    token: string;
    requiresVerification: boolean;
    user: import('./auth').AuthUser;
  };
}

export async function fetchMe() {
  const res = await api.get('/api/auth/me');
  return res.data as import('./auth').AuthUser;
}

export async function verifyCode(payload: { email: string; code: string }) {
  const res = await api.post('/api/auth/verify', payload);
  return res.data as {
    verified?: boolean;
    alreadyVerified?: boolean;
    user: import('./auth').AuthUser;
  };
}

export async function resendCode(email: string) {
  const res = await api.post('/api/auth/resend-code', { email });
  return res.data as { sent?: boolean; alreadyVerified?: boolean };
}

export async function listAdmins() {
  const res = await api.get('/api/admin/admins');
  return res.data as Array<{
    _id: string;
    email: string;
    name: string;
    role: 'admin' | 'superadmin';
    emailVerified: boolean;
    walletBalance: number;
    createdAt: string;
  }>;
}

export async function searchUsers(q: string) {
  const res = await api.get('/api/admin/users/search', { params: { q } });
  return res.data as Array<{
    _id: string;
    email: string;
    name: string;
    role: 'customer' | 'vendor' | 'admin' | 'superadmin';
    emailVerified: boolean;
    walletBalance: number;
  }>;
}

export async function promoteToAdmin(userId: string) {
  const res = await api.post(`/api/admin/admins/promote/${userId}`);
  return res.data;
}

export async function demoteAdmin(userId: string) {
  const res = await api.post(`/api/admin/admins/demote/${userId}`);
  return res.data;
}

export async function updateProfile(payload: { name: string; phone?: string }) {
  const res = await api.patch('/api/auth/me', payload);
  return res.data as import('./auth').AuthUser & { phone?: string };
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }) {
  const res = await api.post('/api/auth/change-password', payload);
  return res.data;
}

export async function rejectVendor(vendorId: string, reason?: string) {
  const res = await api.post(`/api/vendors/${vendorId}/reject`, { reason });
  return res.data;
}
