import { create } from 'zustand';
import { SupermarketDetail } from '@promo-boa/shared';

interface AuthState {
  account: { id: string; email: string } | null;
  supermarket: SupermarketDetail | null;
  setSession: (token: string, account: { id: string; email: string }) => void;
  setSupermarket: (supermarket: SupermarketDetail) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  account:
    typeof window !== 'undefined'
      ? (() => {
          const raw = localStorage.getItem('portal_account');
          return raw ? (JSON.parse(raw) as { id: string; email: string }) : null;
        })()
      : null,
  supermarket: null,

  setSession: (token: string, account: { id: string; email: string }) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('portal_access_token', token);
      localStorage.setItem('portal_account', JSON.stringify(account));
    }
    set({ account });
  },

  setSupermarket: (supermarket: SupermarketDetail) => {
    set({ supermarket });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('portal_access_token');
      localStorage.removeItem('portal_account');
    }
    set({ account: null, supermarket: null });
  },
}));
