import axios from 'axios';
import { FlyerSummary, SupermarketDetail } from '@promo-boa/shared';
import { CreateFlyerInput } from '@promo-boa/shared';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

const http = axios.create({ baseURL: BASE_URL });

http.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('portal_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface PortalAuthResult {
  accessToken: string;
  account: { id: string; email: string };
}

export const portalApi = {
  login: async (email: string, password: string): Promise<PortalAuthResult> => {
    const { data } = await http.post('/portal/auth/login', { email, password });
    return data;
  },

  register: async (email: string, password: string): Promise<PortalAuthResult> => {
    const { data } = await http.post('/portal/auth/register', { email, password });
    return data;
  },

  getSupermarket: async (): Promise<SupermarketDetail | null> => {
    try {
      const { data } = await http.get('/portal/supermarkets/me');
      return data;
    } catch {
      return null;
    }
  },

  getFlyers: async (supermarketId: string): Promise<FlyerSummary[]> => {
    const { data } = await http.get(`/supermarkets/${supermarketId}/flyers`);
    return data;
  },

  uploadFlyer: async (
    supermarketId: string,
    file: File,
    dto: CreateFlyerInput,
    onProgress?: (pct: number) => void,
  ): Promise<FlyerSummary> => {
    const form = new FormData();
    form.append('pdf', file);
    form.append('title', dto.title);
    form.append('validFrom', new Date(dto.validFrom).toISOString());
    form.append('validTo', new Date(dto.validTo).toISOString());

    const { data } = await http.post(
      `/portal/supermarkets/${supermarketId}/flyers`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      },
    );
    return data;
  },

  deleteFlyer: async (flyerId: string): Promise<void> => {
    await http.delete(`/portal/flyers/${flyerId}`);
  },

  createSupermarket: async (dto: Omit<CreateFlyerInput, 'validFrom' | 'validTo'>): Promise<SupermarketDetail> => {
    const { data } = await http.post('/portal/supermarkets', dto);
    return data;
  },

  updateSupermarket: async (id: string, dto: Partial<Record<string, unknown>>): Promise<SupermarketDetail> => {
    const { data } = await http.patch(`/portal/supermarkets/${id}`, dto);
    return data;
  },
};
