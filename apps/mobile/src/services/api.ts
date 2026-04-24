import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { SupermarketSummary, SupermarketDetail, FlyerDetail, FavoriteItem, AuthTokens, UserProfile } from '@promo-boa/shared';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

const REFRESH_TOKEN_KEY = 'refresh_token';
const ACCESS_TOKEN_KEY = 'access_token';

const http: AxiosInstance = axios.create({ baseURL: BASE_URL });

http.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(http(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) return Promise.reject(error);

      const { data } = await axios.post<AuthTokens>(`${BASE_URL}/auth/refresh`, { refreshToken });
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);

      refreshQueue.forEach((cb) => cb(data.accessToken));
      refreshQueue = [];

      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return http(original);
    } catch {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export async function storeTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function getStoredAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export const api = {
  getSupermarketsNearby: async (params: { lat: number; lng: number; radius: number }): Promise<SupermarketSummary[]> => {
    const { data } = await http.get('/supermarkets', { params });
    return data;
  },

  getSupermarketById: async (id: string): Promise<SupermarketDetail> => {
    const { data } = await http.get(`/supermarkets/${id}`);
    return data;
  },

  getFlyerById: async (id: string): Promise<FlyerDetail> => {
    const { data } = await http.get(`/flyers/${id}`);
    return data;
  },

  login: async (email: string, password: string): Promise<AuthTokens> => {
    const { data } = await http.post<AuthTokens>('/auth/login', { email, password });
    return data;
  },

  register: async (email: string, password: string, name?: string): Promise<AuthTokens> => {
    const { data } = await http.post<AuthTokens>('/auth/register', { email, password, name });
    return data;
  },

  getMe: async (): Promise<UserProfile> => {
    const { data } = await http.get('/auth/me');
    return data;
  },

  updateMe: async (updates: Partial<UserProfile & { expoPushToken: string | null }>): Promise<UserProfile> => {
    const { data } = await http.patch('/auth/me', updates);
    return data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await http.post('/auth/logout', { refreshToken });
  },

  getFavorites: async (): Promise<FavoriteItem[]> => {
    const { data } = await http.get('/favorites');
    return data;
  },

  addFavorite: async (supermarketId: string): Promise<{ id: string }> => {
    const { data } = await http.post('/favorites', { supermarketId });
    return data;
  },

  removeFavorite: async (supermarketId: string): Promise<void> => {
    await http.delete(`/favorites/${supermarketId}`);
  },

  updateFavoriteNotification: async (supermarketId: string, enabled: boolean): Promise<void> => {
    await http.patch(`/favorites/${supermarketId}/notifications`, { enabled });
  },
};
