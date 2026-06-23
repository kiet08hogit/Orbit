# Orbit 🔵

**Orbit** is a verified marketplace exclusively for university students. It provides a safe, trusted platform to buy, sell, and swap items with other verified student profiles using their university email addresses.

## ✨ Features

- **Exclusive Access:** Powered by Clerk Authentication, restricting access solely to users with valid university email addresses.
- **Categorized Listings & Pagination:** Browse through dedicated categories (Dorm, Clothes, School, Leisure, Accessories, Services) using seamless Shadcn UI pagination.
- **Secure Payments:** Integrated **Stripe API** allows users to reserve and purchase items using Orbit Secure Payment safely.
- **AI-Powered "Match Your Needs":** Uses the **Gemini API** to semantically search through marketplace listings and intelligently match users with the perfect item.
- **Community & Marketplace Hub:** Switch seamlessly between shopping in the Marketplace and engaging in the Community Hub using a sleek global navigation dropdown.
- **Wishlist & Likes:** Save your favorite items to your wishlist for later.
- **Real-Time Chat:** Integrated messaging powered by WebSockets to negotiate and chat with sellers instantly.
- **Secure Meetups:** In-person meetup verification system via WebSockets and temporary codes.
- **Interactive Maps:** Built-in Mapbox integration to view meetup locations on or around campus.
- **Cloud Storage:** Fast, scalable image uploads utilizing Amazon S3.

## 🛠 Tech Stack

### Frontend
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) (Dropdowns, Pagination, Sonner Toasts)
- **Animation:** [Framer Motion](https://www.framer.com/motion/)
- **Auth:** [Clerk](https://clerk.com/)
- **Payments:** [Stripe React](https://stripe.com/)
- **Maps:** Mapbox GL
- **Icons:** Lucide React

### Backend
- **Framework:** [NestJS](https://nestjs.com/)
- **Database:** PostgreSQL with [Prisma ORM](https://www.prisma.io/) (Amazon RDS)
- **Payments:** Stripe API (via Webhooks)
- **AI:** Google Gemini API (for semantic search & smart matching)
- **Caching & Message Queues:** Redis (Amazon ElastiCache) & BullMQ
- **Rate Limiting:** Global Redis Throttler
- **Real-Time:** Socket.io
- **File Storage:** Amazon S3
- **Auth Verification:** Clerk Backend SDK

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database
- Clerk API Keys
- Stripe API Keys
- Gemini API Key
- AWS S3 Credentials
- Mapbox API Key

### 1. Clone the repository
```bash
git clone https://github.com/kiet08hogit/CampusPal.git
cd Orbit
```

### 2. Backend Setup
```bash
cd backend
npm install

# Set up your environment variables
# Create a .env file with your Prisma database URL, Clerk keys, Stripe secret key, Gemini API key, Redis config, and AWS S3 credentials.

# Run database migrations
npx prisma db push

# Start the development server
npm run start:dev
```
*The backend runs on http://localhost:3000 by default.*

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Set up your environment variables
# Create a .env.local file with your Clerk publishable key, Stripe publishable key, and Mapbox API key.

# Start the frontend development server
npm run dev
```
*The frontend will run on http://localhost:3000 (or another available port).*
