import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthRole = 'customer' | 'vendor' | 'admin' | 'superadmin';

export interface AuthUser {
  _id: string;
  email: string;
  name: string;
  role: AuthRole;
  emailVerified: boolean;
  walletBalance: number;
  referralCode: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  pendingVerificationEmail: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  setPendingVerification: (email: string | null) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      pendingVerificationEmail: null,
      setAuth: (user, token) => set({ user, token }),
      setPendingVerification: (email) => set({ pendingVerificationEmail: email }),
      logout: () => set({ user: null, token: null, pendingVerificationEmail: null }),
    }),
    { name: 'chophub-auth' }
  )
);
