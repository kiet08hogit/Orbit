import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import type { Conversation, Listing, Message, User } from './types';

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ||
  'http://127.0.0.1:3000';

type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;

export function registerTokenGetter(fn: TokenGetter) {
  getToken = fn;
}

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ───────────────── Listings ─────────────────

export const listingsApi = {
  list: async (): Promise<Listing[]> => {
    const { data } = await api.get<Listing[]>('/listings/all');
    return data;
  },
  search: async (q: string): Promise<Listing[]> => {
    const { data } = await api.get<Listing[]>('/listings/recommendations', {
      params: { q },
    });
    return data;
  },
  get: async (id: string): Promise<Listing> => {
    const { data } = await api.get<Listing>(`/listings/${id}`);
    return data;
  },
  create: async (form: FormData): Promise<Listing> => {
    const { data } = await api.post<Listing>('/listings', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  update: async (id: string, payload: Partial<Listing>): Promise<Listing> => {
    const { data } = await api.put<Listing>(`/listings/${id}`, payload);
    return data;
  },
  delete: async (id: string) => api.delete(`/listings/${id}`),
};

// ───────────────── Users ─────────────────

export const usersApi = {
  get: async (id: string): Promise<User> => {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },
  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/users/me');
    return data;
  },
  update: async (id: string, payload: Partial<User>): Promise<User> => {
    const { data } = await api.put<User>(`/users/${id}`, payload);
    return data;
  },
};

// ───────────────── Chat ─────────────────

export const chatApi = {
  conversations: async (): Promise<Conversation[]> => {
    const { data } = await api.get<Conversation[]>('/conversations');
    return data;
  },
  messages: async (conversationId: string): Promise<Message[]> => {
    const { data } = await api.get<Message[]>(
      `/conversations/${conversationId}/messages`,
    );
    return data;
  },
};

// ───────────────── Payments ─────────────────

export const paymentsApi = {
  connectStatus: async (): Promise<{ connected: boolean; chargesEnabled: boolean }> => {
    const { data } = await api.get('/payments/connect/status');
    return data;
  },
  startConnect: async (): Promise<{ url: string }> => {
    const { data } = await api.post('/payments/setup');
    return data;
  },
  paymentSheet: async (listingId: string): Promise<{
    paymentIntent: string;
    ephemeralKey: string;
    customer: string;
  }> => {
    const { data } = await api.post(`/payments/sheet/${listingId}`);
    return data;
  },
};
