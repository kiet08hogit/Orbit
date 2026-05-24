# Circlo 🔵

**Circlo** is a verified marketplace exclusively for University of Illinois Chicago (UIC) students. It provides a safe, trusted platform to buy, sell, and swap items with other verified `@uic.edu` student profiles. 

## ✨ Features

- **Exclusive Access:** Powered by Clerk Authentication, restricting access solely to users with valid `@uic.edu` email addresses.
- **Categorized Listings:** Browse through dedicated categories like Dorm, Clothes, School, Leisure, and Accessories.
- **Real-Time Chat:** Integrated messaging powered by WebSockets to negotiate and chat with sellers instantly.
- **Match Your Needs:** A fun, interactive swipe feature to discover items you might be interested in.
- **Interactive Maps:** Built-in Mapbox integration to view meetup locations on or around campus.
- **Cloud Storage:** Fast, scalable image uploads utilizing Azure Blob Storage.

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
- **Database:** PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Real-Time:** Socket.io
- **File Storage:** Azure Blob Storage
- **Auth Verification:** Clerk Backend SDK

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database
- Clerk API Keys
- Azure Blob Storage credentials
- Mapbox API Key

### 1. Clone the repository
```bash
git clone https://github.com/your-username/circlo.git
cd circlo
```

### 2. Backend Setup
```bash
cd backend
npm install

# Set up your environment variables
# Create a .env file with your Prisma database URL, Clerk secret keys, and Azure storage credentials.

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
