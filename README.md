# Orbit 🔵

**Orbit** is a verified marketplace exclusively for university students. It provides a safe, trusted platform to buy, sell, and swap items with other verified student profiles using their university email addresses.

## ✨ Features

- **Exclusive Access:** Powered by Clerk Authentication, restricting access solely to users with valid university email addresses.
- **Categorized Listings:** Browse through dedicated categories like Dorm, Clothes, School, Leisure, and Accessories.
- **Wishlist & Likes:** Save your favorite items to your wishlist for later.
- **Real-Time Chat:** Integrated messaging powered by WebSockets to negotiate and chat with sellers instantly.
- **Secure Meetups:** In-person meetup verification system via WebSockets and temporary codes.
- **Trust & Safety:** Built-in listing reporting and moderation system.
- **Interactive Maps:** Built-in Mapbox integration to view meetup locations on or around campus.
- **Cloud Storage:** Fast, scalable image uploads utilizing Amazon S3.

## 🛠 Tech Stack

### Frontend
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Animation:** [Framer Motion](https://www.framer.com/motion/)
- **Auth:** [Clerk](https://clerk.com/)
- **Maps:** Mapbox GL
- **Icons:** Lucide React

### Backend
- **Framework:** [NestJS](https://nestjs.com/)
- **Database:** PostgreSQL with [Prisma ORM](https://www.prisma.io/) (Amazon RDS)
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
- AWS S3 Credentials
- Mapbox API Key

### 1. Clone the repository
```bash
git clone https://github.com/your-username/orbit.git
cd orbit
```

### 2. Backend Setup
```bash
cd backend
npm install

# Set up your environment variables
# Create a .env file with your Prisma database URL, Clerk keys, Redis config, and AWS S3 credentials.

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
# Create a .env.local file with your Clerk publishable key and Mapbox API key.

# Start the frontend development server
npm run dev
```
*The frontend will run on http://localhost:3001 (or another available port).*
