import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import type {
  AdminStats,
  AiSuggestion,
  AppNotification,
  Conversation,
  Listing,
  ListingCategory,
  Message,
  Post,
  PostComment,
  PostType,
  Report,
  ReviewsResponse,
  Transaction,
  User,
  Offer,
} from './types';

export const baseURL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ||
  'http://127.0.0.1:3000';

/** Resolve relative upload paths (e.g. /uploads/..) against the API host. */
export function getImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${baseURL}${url}`;
}

type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;

export function registerTokenGetter(fn: TokenGetter) {
  getToken = fn;
}

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

// ───────────────── Users ─────────────────

export const usersApi = {
  me: async (): Promise<User> => (await api.get<User>('/users/me')).data,
  updateMe: async (payload: Partial<User>): Promise<User> =>
    (await api.patch<User>('/users/me', payload)).data,
  get: async (id: string): Promise<User> =>
    (await api.get<User>(`/users/${id}`)).data,
  search: async (q: string): Promise<User[]> =>
    (await api.get<User[]>('/users/search', { params: { q } })).data,
  followers: async (id: string): Promise<User[]> =>
    (await api.get<User[]>(`/users/${id}/followers`)).data,
  following: async (id: string): Promise<User[]> =>
    (await api.get<User[]>(`/users/${id}/following`)).data,
  toggleFollow: async (id: string): Promise<{ following: boolean }> =>
    (await api.post<{ following: boolean }>(`/users/${id}/follow`)).data,
  removeFollower: async (followerId: string) =>
    (await api.delete(`/users/${followerId}/follower`)).data,
  sendEduCode: async () => (await api.post('/users/verify-edu/send')).data,
  verifyEduCode: async (code: string) =>
    (await api.post('/users/verify-edu/verify', { code })).data,
};

// ───────────────── Listings ─────────────────

export const listingsApi = {
  /** Swipe feed: ACTIVE, not own, not yet swiped. */
  feed: async (): Promise<Listing[]> =>
    (await api.get<Listing[]>('/listings')).data,
  all: async (params?: { category?: ListingCategory; q?: string }): Promise<Listing[]> =>
    (await api.get<Listing[]>('/listings/all', { params })).data,
  recommendations: async (q: string, category?: ListingCategory): Promise<Listing[]> =>
    (await api.get<Listing[]>('/listings/recommendations', { params: { q, category } })).data,
  recommended: async (): Promise<Listing[]> =>
    (await api.get<Listing[]>('/listings/recommended')).data,
  hot: async (): Promise<Listing[]> =>
    (await api.get<Listing[]>('/listings/hot')).data,
  viewed: async (): Promise<Listing[]> =>
    (await api.get<Listing[]>('/listings/viewed')).data,
  myListings: async (): Promise<Listing[]> =>
    (await api.get<Listing[]>('/listings/my-listings')).data,
  wishlist: async (): Promise<Listing[]> =>
    (await api.get<Listing[]>('/listings/wishlist')).data,
  wishlistCount: async (): Promise<{ count: number }> =>
    (await api.get<{ count: number }>('/listings/wishlist-count')).data,
  get: async (id: string): Promise<Listing> =>
    (await api.get<Listing>(`/listings/${id}`)).data,
  create: async (form: FormData): Promise<Listing> =>
    (await api.post<Listing>('/listings', form, multipart)).data,
  update: async (id: string, payload: Partial<Listing>): Promise<Listing> =>
    (await api.put<Listing>(`/listings/${id}`, payload)).data,
  delete: async (id: string) => api.delete(`/listings/${id}`),
  view: async (id: string) => api.post(`/listings/${id}/view`),
  swipe: async (id: string, swipeType: 'LIKE' | 'SKIP') =>
    api.post(`/listings/${id}/swipe`, { type: swipeType }),
  aiSuggest: async (form: FormData): Promise<AiSuggestion> =>
    (await api.post<AiSuggestion>('/listings/ai-suggest', form, multipart)).data,
};

// ───────────────── Chat ─────────────────

export const chatApi = {
  inbox: async (): Promise<Conversation[]> =>
    (await api.get<Conversation[]>('/chat/inbox')).data,
  messages: async (conversationId: string): Promise<Message[]> =>
    (await api.get<Message[]>(`/chat/inbox/${conversationId}`)).data,
  unreadCount: async (): Promise<{ count: number }> =>
    (await api.get<{ count: number }>('/chat/unread-count')).data,
  startConversation: async (otherClerkUserId: string): Promise<Conversation> =>
    (await api.post<Conversation>(`/chat/conversation/${otherClerkUserId}`)).data,
  sendImages: async (conversationId: string, form: FormData): Promise<Message> =>
    (await api.post<Message>(`/chat/message/${conversationId}/images`, form, multipart)).data,
};

// ───────────────── Posts / Community ─────────────────

export const postsApi = {
  list: async (postType?: PostType): Promise<Post[]> =>
    (await api.get<Post[]>('/posts', { params: postType ? { type: postType } : undefined })).data,
  create: async (form: FormData): Promise<Post> =>
    (await api.post<Post>('/posts', form, multipart)).data,
  delete: async (id: string) => api.delete(`/posts/${id}`),
  toggleLike: async (id: string): Promise<{ liked: boolean; likeCount: number }> =>
    (await api.post<{ liked: boolean; likeCount: number }>(`/posts/${id}/like`)).data,
  comments: async (id: string): Promise<PostComment[]> =>
    (await api.get<PostComment[]>(`/posts/${id}/comments`)).data,
  addComment: async (id: string, content: string): Promise<{ comment: PostComment; commentCount: number }> =>
    (await api.post(`/posts/${id}/comment`, { content })).data,
};

// ───────────────── Offers ─────────────────

export const offersApi = {
  create: async (payload: { listingId: string; price: number }): Promise<Offer> =>
    (await api.post<Offer>('/offers', payload)).data,
  mySentOffers: async (): Promise<Offer[]> =>
    (await api.get<Offer[]>('/offers/me/sent')).data,
  cancel: async (id: string) => api.delete(`/offers/${id}`),
};

// ───────────────── Transactions ─────────────────

export const transactionsApi = {
  offers: async (): Promise<{
    my_offers: Transaction[];
    received_offers: Transaction[];
    meetups: Transaction[];
  }> => (await api.get('/transactions/offers')).data,
  history: async (): Promise<{ buying: Transaction[]; selling: Transaction[] }> =>
    (await api.get('/transactions/history')).data,
  active: async (listingId: string, otherUserId: string): Promise<Transaction | null> =>
    (await api.get('/transactions/active', { params: { listingId, otherUserId } })).data,
  activeAsSeller: async (): Promise<Transaction[]> =>
    (await api.get('/transactions/active/seller')).data,
  activeAsBuyer: async (): Promise<Transaction[]> =>
    (await api.get('/transactions/active/buyer')).data,
  activeMeetupCode: async (listingId: string, sellerId: string) =>
    (await api.get('/transactions/active-meetup-code', { params: { listingId, sellerId } })).data,
  directReservation: async (listingId: string): Promise<Transaction> =>
    (await api.post('/transactions/direct-reservation', { listingId })).data,
  startMeetup: async (listingId: string, buyerId: string): Promise<{ message: string }> =>
    (await api.post('/transactions/start-meetup', { listingId, buyerId })).data,
  verifyMeetupCode: async (transactionId: string, code: string): Promise<{ message: string }> =>
    (await api.post('/transactions/verify-meetup-code', { transactionId, code })).data,
  markAsSold: async (id: string) => (await api.post(`/transactions/${id}/mark-as-sold`)).data,
  proposeMeetup: async (id: string, location: string, time: string): Promise<Transaction> =>
    (await api.post(`/transactions/${id}/meetup/propose`, { location, time })).data,
  acceptMeetup: async (id: string): Promise<Transaction> =>
    (await api.post(`/transactions/${id}/meetup/accept`)).data,
  cancelMeetup: async (id: string): Promise<Transaction> =>
    (await api.post(`/transactions/${id}/meetup/cancel`)).data,
};

// ───────────────── Payments ─────────────────

export const paymentsApi = {
  connectStatus: async (): Promise<{ linked: boolean }> =>
    (await api.get('/payments/connect/status')).data,
  startConnect: async (): Promise<{ url: string }> =>
    (await api.post('/payments/connect')).data,
  createIntent: async (listingId: string): Promise<{ clientSecret: string; paymentIntentId: string }> =>
    (await api.post('/payments/intent', { listingId })).data,
};

// ───────────────── Reviews ─────────────────

export const reviewsApi = {
  forUser: async (userId: string): Promise<ReviewsResponse> =>
    (await api.get(`/reviews/user/${userId}`)).data,
  create: async (revieweeId: string, rating: number, comment?: string) =>
    (await api.post('/reviews', { revieweeId, rating, comment })).data,
};

// ───────────────── Notifications ─────────────────

export const notificationsApi = {
  list: async (filter?: string): Promise<AppNotification[]> =>
    (await api.get('/notifications', { params: filter && filter !== 'ALL' ? { filter } : undefined })).data,
  unreadCount: async (): Promise<{ unreadCount: number }> =>
    (await api.get('/notifications/unread-count')).data,
  markRead: async (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: async () => api.patch('/notifications/read-all'),
};

// ───────────────── Reports ─────────────────

export const reportsApi = {
  create: async (payload: { listingId?: string; reportedUserId?: string; reason: string }) =>
    (await api.post('/reports', payload)).data,
};

// ───────────────── Admin ─────────────────

export const adminApi = {
  stats: async (): Promise<AdminStats> => (await api.get('/admin/stats')).data,
  users: async (): Promise<User[]> => (await api.get('/admin/users')).data,
  banUser: async (id: string, isBanned: boolean) =>
    (await api.patch(`/admin/users/${id}/ban`, { isBanned })).data,
  warnUser: async (id: string, title: string, message: string) =>
    (await api.patch(`/admin/users/${id}/warn`, { title, message })).data,
  reports: async (): Promise<Report[]> => (await api.get('/admin/reports')).data,
  updateReport: async (id: string, status: string) =>
    (await api.patch(`/admin/reports/${id}`, { status })).data,
};
