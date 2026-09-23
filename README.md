# <img width="50" height="50" alt="Orbit_logo" src="https://github.com/user-attachments/assets/cdc7c95f-4867-45cf-9288-f3d07af498f9" /> Orbit

**Orbit** is a verified marketplace and community platform exclusively for university students. Access is gated to `.edu` email addresses, so every buyer, seller, and poster is a verified student.

This README documents how Orbit is actually built — the services, the data model, and the request flows behind each feature.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Repository Layout](#repository-layout)
- [Backend Module Map](#backend-module-map)
- [Request Lifecycle](#request-lifecycle)
- [Data Model](#data-model)
- [How It Works](#how-it-works)
  - [Authentication and .edu Gating](#authentication-and-edu-gating)
  - [Creating a Listing](#creating-a-listing)
  - [Search and Discovery](#search-and-discovery)
  - [Real-Time Chat](#real-time-chat)
  - [Secure Meetup Verification](#secure-meetup-verification)
  - [Protected Payments](#protected-payments)
- [How Redis Is Used](#how-redis-is-used)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Load Testing](#load-testing)
- [CI/CD](#cicd)

---

## Features

| Feature | What it does |
|---|---|
| **Verified access** | Clerk authentication, with `.edu` enforcement in both the auth guard and the signup webhook |
| **Marketplace listings** | Eight categories, multi-image uploads to S3, offers, and price negotiation |
| **AI listing assistant** | Upload a photo and Gemini drafts the title, description, price, and category |
| **Semantic search** | Natural-language queries matched against pgvector embeddings, not keywords |
| **Swipe discovery** | Tinder-style like/skip feed that feeds a recommendation vector |
| **Community hub** | Posts, likes, comments, follows, and notifications |
| **Real-time chat** | Socket.io messaging with read receipts, image messages, and replies |
| **AI meetup detection** | Gemini reads chat for a proposed time and place, then offers to schedule it |
| **Secure meetups** | Six-digit codes verified in person to confirm handoff |
| **Protected payments** | Stripe Connect escrow — funds held at authorization, captured after the meetup |
| **Moderation** | Reports, warnings, bans, and an admin dashboard |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Web** | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, Framer Motion |
| **Mobile** | Expo SDK 51, Expo Router, React Native |
| **Backend** | NestJS 11, TypeScript, Socket.io |
| **Database** | PostgreSQL with the `pgvector` extension, via Prisma 7 (Amazon RDS) |
| **Cache / Queue** | Redis — response cache, rate-limit store, and BullMQ broker |
| **Auth** | Clerk (`@clerk/backend`, `@clerk/nextjs`, `@clerk/clerk-expo`) |
| **Payments** | Stripe Connect with manual capture |
| **AI** | Google Gemini — embeddings, vision, and LangChain structured output |
| **Storage** | Amazon S3 with presigned URLs |
| **Maps** | Mapbox GL |

---

## System Architecture

```mermaid
graph TB
    subgraph clients["Clients"]
        Web["Next.js 16 Web App<br/>App Router · React 19"]
        Mobile["Expo Mobile App<br/>React Native"]
    end

    subgraph api["NestJS Backend · port 3000"]
        Pipeline["Guards and Interceptors<br/>throttle · auth · cache · presign"]
        REST["REST Controllers"]
        WS["Socket.io Gateway"]
        Workers["BullMQ Workers"]
    end

    subgraph data["Data Layer"]
        PG[("PostgreSQL + pgvector")]
        Redis[("Redis")]
        S3[("Amazon S3")]
    end

    subgraph external["External Services"]
        Clerk["Clerk"]
        Stripe["Stripe Connect"]
        Gemini["Google Gemini"]
    end

    Web -->|"HTTPS · Bearer JWT"| Pipeline
    Mobile -->|"HTTPS · Bearer JWT"| Pipeline
    Web <-->|"WebSocket"| WS
    Mobile <-->|"WebSocket"| WS

    Pipeline --> REST
    REST --> PG
    REST --> S3
    REST --> Redis
    WS --> PG
    Workers --> Redis

    REST -.->|"verify JWT"| Clerk
    REST -.->|"payment intents"| Stripe
    REST -.->|"embed · vision"| Gemini
    Clerk -.->|"user webhooks"| REST
    Stripe -.->|"payment webhooks"| REST
```

---

## Repository Layout

```
Orbit/
├── backend/            NestJS API, Prisma schema, WebSocket gateway
│   ├── prisma/         schema.prisma — models, enums, pgvector column
│   └── src/
│       ├── common/     guards, interceptors, decorators, shared types
│       ├── database/   PrismaService and module
│       └── modules/    one folder per domain (see module map)
├── frontend/           Next.js 16 web client
│   └── app/            App Router pages
├── mobile/             Expo + React Native client
├── load-tests/         k6 scripts
├── Architecture/       design notes and diagrams (Obsidian vault)
└── docker-compose.yml  local Redis + pgvector Postgres
```

---

## Backend Module Map

Each domain is a self-contained Nest module with its own controller and service.

```mermaid
graph LR
    subgraph core["Identity and Access"]
        Users["UsersModule<br/>profiles · follows · .edu codes"]
        Webhooks["WebhooksModule<br/>Clerk sync"]
        Admin["AdminModule<br/>stats · bans · reports"]
    end

    subgraph market["Marketplace"]
        Listings["ListingsModule<br/>CRUD · feed · swipe · vectors"]
        Offers["OffersModule<br/>price negotiation"]
        Transactions["TransactionsModule<br/>reservations · meetups"]
        Payments["PaymentsModule<br/>Stripe Connect escrow"]
    end

    subgraph social["Community"]
        Posts["PostsModule<br/>posts · likes · comments"]
        Chat["ChatModule<br/>gateway · conversations"]
        Reviews["ReviewsModule<br/>seller ratings"]
        Notifications["NotificationsModule"]
        Reports["ReportsModule"]
    end

    subgraph infra["Infrastructure"]
        Storage["StorageModule<br/>S3 upload · presign"]
        AI["AiModule<br/>Gemini embed · vision"]
        Jobs["JobsModule<br/>BullMQ processors"]
        Health["HealthModule"]
    end

    Listings --> AI
    Listings --> Storage
    Listings --> Chat
    Offers --> Listings
    Transactions --> Chat
    Payments --> Transactions
    Chat --> AI
    Chat --> Storage
    Posts --> Storage
    Webhooks --> Users
```

---

## Request Lifecycle

Every HTTP request passes through the same pipeline before it reaches a controller:

```mermaid
flowchart TD
    Req["Incoming request"] --> Throttle{"ThrottlerGuard<br/>global · Redis-backed"}
    Throttle -->|"over 100 req/min per IP"| R429["429 Too Many Requests"]
    Throttle -->|"within limit"| Auth{"Route has ClerkAuthGuard?"}

    Auth -->|"no · public route"| Cache
    Auth -->|"yes"| Verify["Verify Clerk JWT<br/>fetch user · require .edu"]
    Verify -->|"invalid"| R401["401 Unauthorized"]
    Verify -->|"non-.edu email"| R403["403 Forbidden"]
    Verify -->|"ok"| Attach["Attach req.user<br/>clerkUserId + email"]

    Attach --> Cache{"CacheInterceptor<br/>on this route?"}
    Cache -->|"hit"| Presign
    Cache -->|"miss"| Validate["ValidationPipe<br/>whitelist · transform"]
    Validate --> Handler["Controller and Service<br/>Prisma queries"]
    Handler --> Store["Store response in Redis<br/>TTL 60s"]
    Store --> Presign["S3PresignInterceptor<br/>rewrite S3 URLs · 1h signed"]
    Presign --> Res["JSON response"]
```

The global `S3PresignInterceptor` walks every response body and swaps any raw S3 URL for a time-limited signed URL, so the bucket itself never has to be public.

---

## Data Model

PostgreSQL with `pgvector`. `Listing.embedding` holds a 768-dimension Gemini vector used for semantic search and recommendations.

### Marketplace core

```mermaid
erDiagram
    User ||--o{ Listing : "sells"
    User ||--o{ Interaction : "swipes"
    User ||--o{ ListingView : "views"
    User ||--o{ Offer : "makes"
    User ||--o{ Transaction : "buys or sells"
    Listing ||--o{ ListingImage : "has"
    Listing ||--o{ Interaction : "receives"
    Listing ||--o{ ListingView : "tracked by"
    Listing ||--o{ Offer : "receives"
    Listing ||--o{ Transaction : "settled by"

    User {
        string id PK
        string clerkUserId UK
        string email UK
        string username UK
        string university
        boolean isEduVerified
        string stripeAccountId UK
        boolean stripeAccountLinked
        enum role "USER | ADMIN | MODERATOR"
        boolean isBanned
    }

    Listing {
        string id PK
        string sellerId FK
        string title
        string description
        float price
        enum category "DORM | SUBLEASE | CLOTHES | SCHOOL | LEISURE | ACCESSORIES | SERVICES | OTHER"
        enum status "ACTIVE | SOLD | REMOVED | PENDING_PAYMENT | RESERVED"
        vector embedding "768-dim Gemini"
        boolean acceptsDirectPayment
        boolean acceptsProtectedPayment
        string location
    }

    ListingImage {
        string id PK
        string listingId FK
        string url "S3 object URL"
    }

    Interaction {
        string id PK
        string userId FK
        string listingId FK
        enum type "LIKE | SKIP"
    }

    ListingView {
        string id PK
        string userId FK
        string listingId FK
        datetime viewedAt
    }

    Offer {
        string id PK
        string buyerId FK
        string listingId FK
        float price
        enum status "PENDING | ACCEPTED | REJECTED | CANCELLED"
    }

    Transaction {
        string id PK
        string listingId FK
        string buyerId FK
        string sellerId FK
        int amount "cents"
        enum paymentMethod "DIRECT | STRIPE"
        enum paymentStatus "UNPAID | PAID_HELD | RELEASED_TO_SELLER"
        enum orderStatus "PENDING_MEETUP through COMPLETED"
        string stripePaymentIntentId UK
        string meetupCode "6 digits"
        datetime meetupCodeExpiresAt
        enum meetupStatus "NONE | PROPOSED | ACCEPTED | CANCELLED"
    }
```

### Chat, community, and trust

```mermaid
erDiagram
    User ||--o{ ConversationMember : "joins"
    Conversation ||--o{ ConversationMember : "includes"
    Conversation ||--o{ Message : "contains"
    User ||--o{ Message : "sends"
    Message ||--o{ Message : "replies to"
    User ||--o{ Post : "authors"
    Post ||--o{ PostLike : "receives"
    Post ||--o{ PostComment : "receives"
    User ||--o{ Review : "gives and receives"
    User ||--o{ Notification : "receives"
    User ||--o{ Report : "files and is reported"

    Conversation {
        string id PK
        datetime createdAt
    }

    ConversationMember {
        string id PK
        string conversationId FK
        string userId FK
    }

    Message {
        string id PK
        string conversationId FK
        string senderId FK
        string content
        array imageUrls
        boolean isRead
        string listingId FK "optional context"
        string replyToId FK "optional thread"
    }

    Post {
        string id PK
        string authorId FK
        string content
        enum postType "DISCUSSION | EVENT | CHECK_IN | LOOKING_FOR"
        array imageUrls
        boolean isAnonymous
    }

    Review {
        string id PK
        string reviewerId FK
        string revieweeId FK
        int rating
        string comment
    }

    Notification {
        string id PK
        string userId FK
        string actorId FK
        enum type "FOLLOW | LIKE | COMMENT | PURCHASE | OFFER | WARNING"
        boolean isRead
        string linkUrl
    }

    Report {
        string id PK
        string reporterId FK
        string reportedUserId FK
        string listingId FK
        string reason
        string status
    }
```

Uniqueness constraints keep the data honest: `Interaction` and `ListingView` are unique per `(userId, listingId)`, `ConversationMember` is unique per `(conversationId, userId)`, and `PostLike` is unique per `(postId, userId)`.

---

## How It Works

### Authentication and .edu Gating

Orbit never stores passwords. Clerk issues the JWT, and the backend enforces the student-only rule in two independent places.

```mermaid
sequenceDiagram
    participant U as Student
    participant FE as Next.js
    participant C as Clerk
    participant API as NestJS
    participant DB as PostgreSQL

    U->>C: Sign up with university email
    C-->>API: Webhook user.created (svix-signed)
    API->>API: Verify signature, inspect primary email
    alt Email does not end in .edu
        API->>C: deleteUser(id)
        API-->>C: Account removed
    else Valid .edu
        API-->>C: Accept
    end

    U->>FE: Open the app
    FE->>C: Get session token
    C-->>FE: JWT
    FE->>API: GET /users/me (Bearer JWT)
    API->>C: verifyToken + fetch user
    C-->>API: Clerk user and primary email
    API->>API: Reject if email is not .edu (403)
    API->>DB: Upsert local user by clerkUserId
    DB-->>API: User row
    API-->>FE: Profile
```

Deletions flow the other way too: a Clerk `user.deleted` webhook removes the matching Postgres row.

### Creating a Listing

Image upload, AI drafting, and vector indexing happen in one request.

```mermaid
sequenceDiagram
    participant U as Seller
    participant FE as Frontend
    participant API as ListingsController
    participant S3 as Amazon S3
    participant G as Gemini
    participant DB as PostgreSQL

    opt AI assist
        U->>FE: Upload a photo
        FE->>API: POST /listings/ai-suggest
        API->>G: gemini-flash-latest (vision)
        G-->>API: title, description, price, category
        API-->>FE: Prefilled draft
    end

    U->>FE: Confirm details
    FE->>API: POST /listings (multipart, up to 6 images)
    API->>API: ValidationPipe checks CreateListingDto
    loop each image
        API->>S3: Upload object
        S3-->>API: Object URL
    end
    API->>DB: INSERT Listing + ListingImage rows
    DB-->>API: Listing id
    API->>G: Embed "title. description"
    G-->>API: 768-dim vector
    API->>DB: UPDATE embedding = vector
    API-->>FE: Created listing
```

Embedding failures are caught and logged rather than failing the write — the listing still exists, and `POST /listings/backfill` can index anything missing a vector later.

### Search and Discovery

Three different discovery paths share the same vector column.

```mermaid
flowchart TD
    subgraph semantic["Semantic search · GET /listings/recommendations"]
        Q["Query text"] --> QE["Gemini embedding"]
        QE --> VS["ORDER BY embedding &lt;=&gt; query::vector<br/>cosine distance in pgvector"]
        VS --> SR["Ranked listings"]
    end

    subgraph swipe["Swipe feed · GET /listings"]
        SF["Active listings"] --> F1["Exclude my own listings"]
        F1 --> F2["Exclude anything I already swiped"]
        F2 --> Batch["Return a batch of 10 cards"]
        Batch --> Act["POST /listings/:id/swipe<br/>upsert LIKE or SKIP"]
    end

    subgraph recs["Personalized · GET /listings/recommended"]
        Likes["My LIKE interactions"] --> Vecs["Fetch their embeddings"]
        Vecs --> Avg["Average into a taste vector"]
        Avg --> Near["Nearest neighbors, excluding seen items"]
        Near --> Out["Recommended listings"]
    end

    Act -.->|"feeds"| Likes
```

Plain browsing (`GET /listings/all`) stays a straightforward indexed Prisma query, cached in Redis for 60 seconds.

### Real-Time Chat

Messages travel over Socket.io. Each authenticated socket joins a private room named after its Clerk user ID, so the server can push to a specific person across devices.

```mermaid
sequenceDiagram
    participant B as Buyer
    participant GW as ChatGateway
    participant DB as PostgreSQL
    participant G as Gemini
    participant S as Seller

    B->>GW: connect, then emit "authenticate"
    GW->>GW: WsClerkAuthGuard verifies JWT
    GW->>GW: socket.join(clerkUserId)

    B->>GW: emit "send_message" {conversationId, content}
    GW->>DB: Verify membership, insert Message
    DB-->>GW: Saved message
    GW-->>B: emit "receive_message"
    GW-->>S: emit "receive_message"

    par AI meetup detection (non-blocking)
        GW->>GW: Regex prefilter for time and place words
        GW->>G: LangChain structured output (zod schema)
        G-->>GW: {isMeetupProposal, location, time}
        alt Proposal detected
            GW-->>S: emit "ai_meetup_suggestion"
        end
    end

    S->>GW: emit "mark_read"
    GW->>DB: Flag messages as read
    GW-->>B: emit "messages_read"
```

The regex prefilter matters: it keeps the vast majority of chat messages from ever reaching the LLM, so detection costs stay near zero.

### Secure Meetup Verification

For in-person handoffs, the buyer holds a code and the seller enters it. Neither side can confirm alone.

```mermaid
sequenceDiagram
    participant S as Seller
    participant API as TransactionsService
    participant GW as ChatGateway
    participant B as Buyer

    S->>API: POST /transactions/start-meetup
    API->>API: Generate 6-digit code, 24h expiry
    API->>API: orderStatus = MEETING_STARTED
    API-->>GW: sendMeetupCode
    GW-->>B: emit "meetup_code_created"

    Note over S,B: They meet in person on campus

    B->>S: Reads the code aloud
    S->>API: POST /transactions/verify-meetup-code
    alt Code matches and has not expired
        API->>API: orderStatus = MEETUP_CONFIRMED, clear code
        API-->>GW: sendMeetupConfirmed
        GW-->>B: emit "meetup_confirmed"
        GW-->>S: emit "meetup_confirmed"
    else Wrong or expired
        API-->>S: Rejected, attempt counter incremented
    end
```

Meetups can also be scheduled ahead of time — `propose`, `accept`, and `cancel` endpoints drive the `MeetupStatus` field and push `meetup_update` events to the other party.

### Protected Payments

Stripe Connect holds the money between authorization and handoff, so a buyer is not paying a stranger up front.

```mermaid
sequenceDiagram
    participant B as Buyer
    participant FE as Checkout page
    participant API as PaymentsService
    participant St as Stripe
    participant DB as PostgreSQL

    Note over API,St: Seller has already completed Stripe Connect onboarding

    B->>FE: Open checkout
    FE->>API: POST /payments/intent {listingId}
    API->>DB: Validate listing, seller payout account, accepted offer
    API->>St: Create PaymentIntent<br/>capture_method = manual<br/>transfer_data.destination = seller
    St-->>API: clientSecret
    API->>DB: Listing = PENDING_PAYMENT, Transaction = PENDING_PAYMENT
    API-->>FE: clientSecret

    FE->>St: Confirm card payment
    St-->>API: Webhook payment_intent.succeeded
    API->>DB: paymentStatus = PAID_HELD<br/>orderStatus = PAID_PENDING_MEETUP

    Note over B,St: Meetup happens and the code is verified

    API->>St: Capture PaymentIntent
    St-->>API: Captured, funds transfer to seller
    API->>DB: paymentStatus = RELEASED_TO_SELLER<br/>orderStatus = COMPLETED, Listing = SOLD
```

The full order state machine covers both the direct-payment path (cash in person) and the Stripe escrow path:

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT: Stripe checkout started
    [*] --> PENDING_MEETUP: Direct reservation

    PENDING_PAYMENT --> PAID_PENDING_MEETUP: payment_intent.succeeded
    PENDING_PAYMENT --> CANCELLED: payment failed or canceled

    PENDING_MEETUP --> MEETING_STARTED: Seller requests code
    PAID_PENDING_MEETUP --> MEETING_STARTED: Seller requests code

    MEETING_STARTED --> MEETUP_CONFIRMED: Buyer's code verified
    MEETING_STARTED --> EXPIRED: Code expired after 24h

    MEETUP_CONFIRMED --> COMPLETED_BY_SELLER: Seller marks sold
    MEETUP_CONFIRMED --> COMPLETED: Escrow captured

    COMPLETED_BY_SELLER --> COMPLETED
    COMPLETED --> [*]
    CANCELLED --> [*]
    EXPIRED --> [*]

    PAID_PENDING_MEETUP --> REFUNDED: Dispute resolved
    REFUNDED --> [*]
```

---

## How Redis Is Used

One Redis instance backs three separate concerns:

```mermaid
graph LR
    Redis[("Redis")]

    subgraph c1["1 · Response cache"]
        CM["CacheModule + CacheInterceptor<br/>TTL 60s"]
        CM --> Routes["/listings/all<br/>/listings/:id<br/>/listings/hot<br/>/listings/recommendations"]
    end

    subgraph c2["2 · Rate limiting"]
        TH["ThrottlerGuard (global)<br/>ThrottlerStorageRedisService"]
        TH --> Limit["100 requests / 60s per IP<br/>shared across all API instances"]
    end

    subgraph c3["3 · Job queue"]
        BQ["BullMQ"]
        BQ --> W["image-optimization worker<br/>upload-queue"]
    end

    Redis --- CM
    Redis --- TH
    Redis --- BQ
```

Keeping the throttle counter in Redis rather than in memory means the limit stays correct when the API runs as more than one container.

---

## API Reference

All routes are served from the backend root (`http://localhost:3000` in development). Routes marked 🔒 require a Clerk Bearer token from a `.edu` account.

### Users and auth

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users/me` 🔒 | Fetch or create the caller's profile |
| `PATCH` | `/users/me` 🔒 | Update profile, rejects duplicate usernames |
| `GET` | `/users/search?q=` 🔒 | Search students |
| `GET` | `/users/:id` 🔒 | Public profile |
| `GET` | `/users/:id/followers` · `/following` 🔒 | Follow graph |
| `POST` | `/users/:id/follow` 🔒 | Toggle follow |
| `POST` | `/users/verify-edu/send` · `/verify` 🔒 | Email verification codes |
| `POST` | `/webhooks/clerk` | Clerk user sync (svix-signed) |
| `GET` | `/health` | Liveness probe |

### Listings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/listings/all?category=&q=` | Browse listings (cached) |
| `GET` | `/listings/:id` | Listing detail (cached) |
| `GET` | `/listings/recommendations?q=` | Semantic vector search (cached) |
| `GET` | `/listings` 🔒 | Swipe feed |
| `GET` | `/listings/hot` 🔒 | Trending listings (cached) |
| `GET` | `/listings/recommended` 🔒 | Personalized by swipe history |
| `GET` | `/listings/viewed` · `/my-listings` · `/wishlist` · `/wishlist-count` 🔒 | Personal views |
| `POST` | `/listings` 🔒 | Create with up to 6 images |
| `POST` | `/listings/ai-suggest` 🔒 | Draft listing fields from a photo |
| `POST` | `/listings/:id/view` · `/:id/swipe` 🔒 | Record view or LIKE/SKIP |
| `PUT` · `DELETE` | `/listings/:id` 🔒 | Update or remove (owner only) |
| `POST` | `/listings/backfill` | Generate embeddings for unindexed listings |

### Chat and community

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat/conversation/:otherUserId` 🔒 | Open or reuse a conversation |
| `GET` | `/chat/inbox` · `/chat/inbox/:id` 🔒 | Conversation list and history |
| `GET` | `/chat/unread-count` 🔒 | Unread badge |
| `POST` | `/chat/message/:conversationId/images` 🔒 | Send up to 5 images |
| `GET` · `POST` | `/posts` 🔒 | Community feed and posting |
| `POST` | `/posts/:id/like` · `/:id/comment` 🔒 | Engage with a post |
| `GET` | `/notifications` · `/unread-count` 🔒 | Notification feed |
| `PATCH` | `/notifications/read-all` · `/:id/read` 🔒 | Mark as read |
| `POST` | `/reviews` · `GET /reviews/user/:id` 🔒 | Seller ratings |
| `POST` | `/reports` 🔒 | Report a user or listing |

### Commerce

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/offers` 🔒 | Make an offer |
| `GET` | `/offers/me/sent` · `/me/received` 🔒 | Offer inbox |
| `PATCH` | `/offers/:id/accept` · `/:id/reject` 🔒 | Respond to an offer |
| `POST` | `/transactions/direct-reservation` 🔒 | Reserve for cash handoff |
| `POST` | `/transactions/start-meetup` 🔒 | Issue a meetup code |
| `POST` | `/transactions/verify-meetup-code` 🔒 | Confirm the handoff |
| `POST` | `/transactions/:id/meetup/propose` · `/accept` · `/cancel` 🔒 | Schedule a meetup |
| `GET` | `/transactions/active/seller` · `/active/buyer` · `/history` 🔒 | Order views |
| `POST` | `/payments/connect` · `GET /payments/connect/status` 🔒 | Stripe Connect onboarding |
| `POST` | `/payments/intent` 🔒 | Create an escrow PaymentIntent |
| `POST` | `/payments/webhook` | Stripe events (signature-verified) |

### WebSocket events

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `authenticate` | Bearer token; joins a private room |
| Client → Server | `send_message` | `{ conversationId, content, listingId?, replyToId? }` |
| Client → Server | `mark_read` | `{ conversationId }` |
| Server → Client | `receive_message` | The saved message |
| Server → Client | `messages_read` | `{ conversationId }` |
| Server → Client | `ai_meetup_suggestion` | Detected location and time |
| Server → Client | `meetup_code_created` | `{ transactionId, code, expiresAt }` |
| Server → Client | `meetup_confirmed` · `meetup_update` | Transaction state change |

---

## Getting Started

### Prerequisites

- Node.js 18+ (verified on v24)
- Docker, for local Redis and Postgres
- API keys: Clerk, Stripe, Google Gemini, AWS S3, Mapbox

### 1. Clone and start infrastructure

```bash
git clone https://github.com/kiet08hogit/Orbit.git
cd Orbit
docker compose up -d        # Redis on :6379, pgvector Postgres on :5433
```

### 2. Environment variables

Create `backend/.env`:

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5433/Orbit
REDIS_HOST=localhost
REDIS_PORT=6379
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
GEMINI_API_KEY=...
RESEND_API_KEY=...
# Optional: raise the per-IP rate limit for local load testing
# THROTTLE_LIMIT=100000
```

Create `frontend/.env`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_MAPBOX_TOKEN=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

### 3. Backend

```bash
cd backend
npm install --legacy-peer-deps    # required: a transitive peer dep still targets Nest 10
npx prisma generate
npx prisma db push                # only against a local database, never shared RDS
npm run start:dev                 # http://localhost:3000
```

### 4. Frontend

```bash
cd frontend
npm install
PORT=3001 npm run dev             # http://localhost:3001
```

The backend owns port 3000, so pin the frontend to 3001 or Next.js will drift to another port.

### 5. Mobile (optional)

```bash
cd mobile
npm install
npx expo start
```

---

## Load Testing

`load-tests/backend.k6.js` drives the public listings feed with [k6](https://k6.io/): a 20-second ramp to 500 virtual users, a 40-second plateau, then a ramp down.

```bash
brew install k6

# Start the API with the rate limit raised so the run measures handler
# latency rather than 429 responses
cd backend && THROTTLE_LIMIT=100000 npm run start:dev

k6 run load-tests/backend.k6.js
```

Results from a local run against `GET /listings/all`:

| Metric | Value |
|---|---|
| Virtual users | 500 |
| Requests | 27,630 |
| Failed requests | 0.00% |
| Throughput | ~390 req/s average, ~500 req/s at plateau |
| Median latency | 3.5 ms |
| **p95 latency** | **6.4 ms** |
| p99 latency | 8.7 ms |
| Max latency | 30.8 ms |

Read this in context: the run hits `localhost`, so there is no network round trip, and the listings payload is served from the warm Redis cache. The same endpoint takes roughly 900 ms on a cold cache. The script asserts both the status code and the response body size, so cached 200s cannot be confused with fast rejections.

---

## CI/CD

GitHub Actions runs on every push and pull request against `main`:

```mermaid
flowchart LR
    Push["Push or PR to main"]

    subgraph BE["job: backend-test"]
        direction TB
        B1["Spin up Redis service container"] --> B2["npm ci --legacy-peer-deps"]
        B2 --> B3["npx prisma generate"]
        B3 --> B4["npm run build"]
        B4 --> B5["npm run test (Jest)"]
    end

    subgraph FE["job: frontend-build"]
        direction TB
        F1["npm ci"] --> F2["next build"]
    end

    Push --> B1
    Push --> F1
```

The production target is AWS: Amplify for the web client, ECS Fargate or App Runner for the API, RDS for Postgres, ElastiCache for Redis, and S3 for uploads.
