import type { Conversation, Listing, Message, User } from '@/lib/types';

const ada: User = {
  id: 'u1',
  clerkUserId: 'user_ada',
  name: 'Ada Loveland',
  username: 'ada',
  major: 'CS',
  classYear: 'Junior',
  avatarUrl: undefined,
  createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
};

const milo: User = {
  id: 'u2',
  clerkUserId: 'user_milo',
  name: 'Milo Park',
  username: 'milo',
  major: 'Architecture',
  classYear: 'Senior',
  createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
};

const ren: User = {
  id: 'u3',
  clerkUserId: 'user_ren',
  name: 'Ren Vasquez',
  username: 'ren',
  major: 'Bio',
  classYear: 'Sophomore',
  createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
};

export const mockListings: Listing[] = [
  {
    id: 'l1',
    title: 'Ikea Markus desk chair — barely used',
    description:
      'Bought last semester, switched to standing setup. Mesh back is intact, lumbar support works. Pickup in West Loop.',
    price: 110,
    category: 'HOUSING',
    status: 'ACTIVE',
    seller: ada,
    images: [{ url: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=900' }],
    location: 'West Loop',
    acceptsDirectPayment: true,
    acceptsProtectedPayment: true,
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
  {
    id: 'l2',
    title: 'Vintage Levi’s 501 — 32x32',
    description: 'Thrifted in Pilsen. Sun-faded but solid. Selvedge intact.',
    price: 38,
    category: 'CLOTHES',
    status: 'ACTIVE',
    seller: milo,
    images: [{ url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=900' }],
    brand: 'Levi’s',
    size: '32x32',
    acceptsDirectPayment: true,
    acceptsProtectedPayment: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'l3',
    title: 'TI-84 Plus CE — color screen',
    description: 'Used for one semester of Calc II. Includes USB cable.',
    price: 65,
    category: 'SCHOOL',
    status: 'ACTIVE',
    seller: ren,
    images: [{ url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=900' }],
    acceptsDirectPayment: true,
    acceptsProtectedPayment: true,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: 'l4',
    title: 'Decathlon kayak — single-person inflatable',
    description: 'Used twice on the Chicago river. Pump and dry-bag included.',
    price: 220,
    category: 'LEISURE',
    status: 'ACTIVE',
    seller: ada,
    images: [{ url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900' }],
    acceptsDirectPayment: true,
    acceptsProtectedPayment: true,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'l5',
    title: 'Sony WH-1000XM4 headphones',
    description: 'Box-fresh condition, sold the pair, kept the case. Ear pads spotless.',
    price: 175,
    category: 'ACCESSORIES',
    status: 'ACTIVE',
    seller: milo,
    images: [{ url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=900' }],
    brand: 'Sony',
    acceptsDirectPayment: true,
    acceptsProtectedPayment: true,
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
  {
    id: 'l6',
    title: 'Mid-century lamp, brass + linen shade',
    description: 'Estate-sale find. Rewired last month. 60W max.',
    price: 45,
    category: 'OTHER',
    status: 'ACTIVE',
    seller: ren,
    images: [{ url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=900' }],
    acceptsDirectPayment: true,
    acceptsProtectedPayment: false,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
];

export const mockConversations: Conversation[] = [
  {
    id: 'c1',
    participants: [ada, milo],
    lastMessage: {
      id: 'm9',
      conversationId: 'c1',
      sender: milo,
      content: 'Sounds good — Saturday at 2 works.',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: false,
    },
    unread: true,
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'c2',
    participants: [ada, ren],
    lastMessage: {
      id: 'm12',
      conversationId: 'c2',
      sender: ada,
      content: 'Will it fit a TI-Nspire case?',
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      read: true,
    },
    unread: false,
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
];

export const mockMessages: Record<string, Message[]> = {
  c1: [
    {
      id: 'm1',
      conversationId: 'c1',
      sender: ada,
      content: 'Hey! Is the chair still available?',
      createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      read: true,
    },
    {
      id: 'm2',
      conversationId: 'c1',
      sender: milo,
      content: 'Yes — when are you around to pick it up?',
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      read: true,
    },
    {
      id: 'm3',
      conversationId: 'c1',
      sender: ada,
      content: 'This weekend? Maybe Saturday around 2?',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: 'm9',
      conversationId: 'c1',
      sender: milo,
      content: 'Sounds good — Saturday at 2 works.',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: false,
    },
  ],
};

export const mockUser = ada;
