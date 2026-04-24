export interface SupermarketSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  activeFlyer: FlyerSummary | null;
}

export interface SupermarketDetail extends SupermarketSummary {
  phone: string | null;
  website: string | null;
  isVerified: boolean;
  flyers: FlyerSummary[];
}

export interface FlyerSummary {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  validFrom: string;
  validTo: string;
  isExpired: boolean;
  uploadedAt: string;
}

export interface FlyerDetail extends FlyerSummary {
  pdfUrl: string;
  supermarketId: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  preferredLocale: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface FavoriteItem {
  id: string;
  supermarketId: string;
  supermarket: SupermarketSummary;
  notifyEnabled: boolean;
  createdAt: string;
}

export interface SupermarketAccountProfile {
  id: string;
  email: string;
  supermarket: SupermarketDetail | null;
}

export type Locale = 'pt-BR' | 'en';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
