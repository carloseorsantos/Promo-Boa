import { create } from 'zustand';
import { SupermarketDetail } from '@promo-boa/shared';

interface AuthState {
  account: { id: string; email: string } | null;
  supermarket: SupermarketDetail | null;
  setSession: (token: string, account: { id: string; email: string }) => void;
  setSupermarket: (supermarket: SupermarketDetail) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>(() => ({
  account: typeof window !== 'undefined' ? (() => {
    const raw = localStorage.getItem('portal_account');
    return raw ? JSON.parse(raw) : null;
  })() : null,
  supermarket: null,

  setSession: (token, account) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('portal_access_token', token);
      localStorage.setItem('portal_account', JSON.stringify(account));
    }
    useAuthStore.setState({ account });
  },

  setSupermarket: (supermarket) => {
    useAuthStore.setState({ supermarket });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('portal_access_token');
      localStorage.removeItem('portal_account');
    }
    useAuthStore.setState({ account: null, supermarket: null });
  },
}));
