export type ListingCategory =
  | 'HOUSING'
  | 'CLOTHES'
  | 'SCHOOL'
  | 'LEISURE'
  | 'ACCESSORIES'
  | 'OTHER';

export type ListingStatus = 'ACTIVE' | 'SOLD' | 'DELETED';

export interface User {
  id: string;
  clerkUserId: string;
  name?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  major?: string;
  classYear?: string;
  createdAt: string;
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
  seller: User;
  images: ListingImage[];
  brand?: string;
  colors?: string;
  size?: string;
  material?: string;
  acceptsDirectPayment: boolean;
  acceptsProtectedPayment: boolean;
  location?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unread: boolean;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: User;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  images?: string[];
  commentCount: number;
  createdAt: string;
}
