/**
 * Domain types mirroring backend/prisma/schema.prisma and the web frontend.
 */

export type ListingCategory =
  | 'DORM'
  | 'SUBLEASE'
  | 'CLOTHES'
  | 'SCHOOL'
  | 'LEISURE'
  | 'ACCESSORIES'
  | 'SERVICES'
  | 'OTHER';

export type ListingStatus =
  | 'ACTIVE'
  | 'SOLD'
  | 'REMOVED'
  | 'PENDING_PAYMENT'
  | 'RESERVED';

export type PostType = 'DISCUSSION' | 'EVENT' | 'CHECK_IN' | 'LOOKING_FOR';

export type NotificationType =
  | 'FOLLOW'
  | 'LIKE'
  | 'COMMENT'
  | 'PURCHASE'
  | 'OFFER'
  | 'WARNING';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING_MEETUP'
  | 'PAID_PENDING_MEETUP'
  | 'MEETING_STARTED'
  | 'MEETUP_CONFIRMED'
  | 'COMPLETED_BY_SELLER'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'DISPUTED'
  | 'EXPIRED'
  | 'DECLINED';

export type MeetupStatus = 'NONE' | 'PROPOSED' | 'ACCEPTED' | 'CANCELLED';
export type PaymentMethod = 'DIRECT' | 'STRIPE';
export type PaymentStatus =
  | 'UNPAID'
  | 'UNPAID_EXTERNAL'
  | 'PAID_HELD'
  | 'RELEASED_TO_SELLER';

export interface User {
  id: string;
  clerkUserId: string;
  email?: string;
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  major?: string | null;
  classYear?: string | null;
  university?: string | null;
  onboardingComplete?: boolean;
  isEduVerified?: boolean;
  stripeAccountLinked?: boolean;
  role?: 'USER' | 'ADMIN';
  isBanned?: boolean;
  createdAt?: string;
  // notification prefs
  emailNotifications?: boolean;
  emailFrequency?: string;
  digestTime?: string;
  notifyMessages?: boolean;
  notifyComments?: boolean;
  notifyWishlists?: boolean;
  notifyMeetups?: boolean;
  notifyReminders?: boolean;
  profanityFilter?: boolean;
  // profile endpoint extras
  listings?: Listing[];
  _count?: { followers?: number; following?: number };
  isFollowing?: boolean;
  hasChatted?: boolean;
}

export interface ListingImage {
  id?: string;
  url: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  status: ListingStatus;
  sellerId?: string;
  seller?: User;
  images?: ListingImage[];
  brand?: string | null;
  colors?: string | null;
  size?: string | null;
  material?: string | null;
  acceptsDirectPayment?: boolean;
  acceptsProtectedPayment?: boolean;
  location?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  content: string;
  imageUrls?: string[];
  conversationId: string;
  senderId: string;
  isRead?: boolean;
  createdAt: string;
  listingId?: string | null;
  replyToId?: string | null;
  sender?: User;
  listing?: Listing | null;
  replyTo?: Message | null;
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  members: { user: User }[];
  messages: Message[];
}

export interface Post {
  id: string;
  content: string;
  postType: PostType;
  imageUrls?: string[];
  isAnonymous?: boolean;
  createdAt: string;
  author: User;
  _count: { likes: number; comments: number };
  likes?: { userId: string }[];
}

export interface PostComment {
  id: string;
  content: string;
  postId: string;
  createdAt: string;
  author: User;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  content: string | null;
  isRead: boolean;
  linkUrl: string | null;
  createdAt: string;
  actor?: (User & { isFollowedByMe?: boolean }) | null;
}

export interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  meetupLocation?: string | null;
  meetupStatus: MeetupStatus;
  meetupTime?: string | null;
  meetupVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  listing?: Listing;
  buyer?: User;
  seller?: User;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewer?: User;
}

export interface ReviewsResponse {
  reviews: Review[];
  averageRating: number;
  totalCount: number;
}

export interface Report {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter?: User;
  reportedUser?: User | null;
  listing?: Listing | null;
}

export interface AdminStats {
  totalUsers: number;
  totalListings: number;
  pendingReports: number;
  totalTransactions: number;
}

export interface AiSuggestion {
  title?: string;
  description?: string;
  price?: number | string;
  category?: ListingCategory;
  colors?: string;
  size?: string;
  material?: string;
  brand?: string;
}

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  listing?: Listing;
  buyer?: User;
  seller?: User;
}
