import { create } from 'zustand';
import { api, storeTokens, clearTokens, getStoredAccessToken } from '../services/api';
import { UserProfile } from '@promo-boa/shared';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  initialized: false,

  initialize: async () => {
    try {
      const token = await getStoredAccessToken();
      if (token) {
        const user = await api.getMe();
        set({ user });
      }
    } catch {
      await clearTokens();
    } finally {
      set({ initialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken, refreshToken, user } = await api.login(email, password);
      await storeTokens(accessToken, refreshToken);
      set({ user, isLoading: false });
      return true;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Login failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken, refreshToken, user } = await api.register(email, password, name);
      await storeTokens(accessToken, refreshToken);
      set({ user, isLoading: false });
      return true;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Registration failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await clearTokens();
    set({ user: null });
  },
}));
