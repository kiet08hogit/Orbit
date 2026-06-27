# Orbit Mobile

The React Native companion to the Orbit campus marketplace web app (`/frontend`).
Same design language (warm-cream-on-dark, single Cursor-Orange accent, JetBrains Mono for data),
same backend (NestJS at `:3000`), same Clerk auth, same Socket.IO chat.

## Stack

- **Expo SDK 51** + **Expo Router** (file-based routing)
- **TypeScript** strict
- **Clerk Expo** for auth, **Stripe React Native** for protected payments
- **Reanimated** for the orbital hero + swipe gestures
- **Inter** (open-source CursorGothic substitute) + **JetBrains Mono** via `@expo-google-fonts`
- **Lucide React Native** for icons (no emoji as icons)
- **Axios** + **Socket.IO** sharing the same backend as the web client

## Run

```bash
cd mobile
npm install
cp .env.example .env   # set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY and EXPO_PUBLIC_API_URL

# Make sure the backend + Redis stack is up — see the root /run-orbit skill.
npm run ios            # or: npm run android, npm run web
```

If `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing, the app falls back to **demo mode**:
all screens render with mock data and a "Continue to app" stub replaces the Clerk sign-in form.
This is intentional — you can preview the UI without provisioning Clerk first.

## Project layout

```
mobile/
├─ app/                 # expo-router file-based routes
│  ├─ _layout.tsx       # root: fonts, Clerk, status bar, socket bridge
│  ├─ index.tsx         # landing — orbital hero, how-it-works, CTA, footer
│  ├─ sign-in.tsx       # Clerk sign-in (or demo continue)
│  ├─ (tabs)/           # bottom tab nav (browse · discover · chat · saved · you)
│  │  ├─ listings.tsx   # marketplace grid + category rail + search
│  │  ├─ swipe.tsx      # tinder-style discovery deck (gesture + spring)
│  │  ├─ chat.tsx       # conversations inbox
│  │  ├─ wishlist.tsx   # saved listings
│  │  └─ profile.tsx    # current user — stats, payouts, listings, settings
│  ├─ listings/[id].tsx # detail — gallery, specs, trust, sticky CTA bar
│  ├─ add-product.tsx   # new listing flow with image picker
│  ├─ chat/[conversationId].tsx  # thread with Socket.IO live updates
│  ├─ profile/[id].tsx  # public profile + their listings
│  ├─ checkout/[id].tsx # Stripe payment sheet entry
│  ├─ about.tsx
│  └─ faqs.tsx
├─ components/
│  ├─ ui/               # Button, Input, Card, Pill, Avatar, Divider, Screen, AppHeader, EmptyState
│  ├─ ListingCard.tsx
│  ├─ CategoryRail.tsx
│  ├─ OrbitHero.tsx     # signature: 3 concentric orbital rings, category icons
│  ├─ Meteors.tsx       # ambient background motion
│  └─ ShinyText.tsx     # subtle headline shimmer
├─ theme/               # colors, typography, spacing — single source of truth
├─ lib/                 # api (axios + Clerk Bearer), socket, auth, types, format
├─ hooks/               # useListings, useListing, useConversations, useMessages
├─ data/mock.ts         # fallback when backend is offline
└─ assets/images/       # orbit logo + hero
```

## Design tokens

Mirrors `frontend/DESIGN-cursor.md` and `frontend/app/globals.css`:

- **Background:** `#0a0a0a` (dark default — single theme, matches web `:root`)
- **Foreground:** `#f7f7f4` (warm cream)
- **Ink:** `#26251e` (warm near-black, used for second-tile contrast band)
- **Accent:** `#f54e00` Cursor Orange — used scarcely, only on primary CTAs and active states
- **Category tones:** peach / mint / blue / lavender / gold pastels (timeline palette reused as category tags)
- **Type:** Inter at weight 400 for display with negative tracking (magazine voice, never bold);
  JetBrains Mono for prices, timestamps, and small caps labels
- **Depth:** hairline-only — no drop shadows, surfaces separated by `#26251e` / `#3a3833` 1px borders
- **Radii:** 8 (buttons / inputs), 12 (cards), pill (chips & accent-y CTAs)

## Backend integration

Set `EXPO_PUBLIC_API_URL` to your NestJS host. The axios client (`lib/api.ts`) attaches a Clerk
Bearer token via the `registerTokenGetter` bridge in `app/_layout.tsx`. The Socket.IO client
(`lib/socket.ts`) connects with the same token in its `auth` payload and emits `authenticate`
on connect — matching the web client's handshake.

Endpoints used:

| Endpoint | Where |
|---|---|
| `GET /listings/all` | Browse + wishlist + profile |
| `GET /listings/recommendations?q=` | Search |
| `GET /listings/:id` | Detail + checkout |
| `POST /listings` (multipart) | Add product |
| `GET /users/:id` | Public profile |
| `GET /conversations` | Chat inbox |
| `GET /conversations/:id/messages` | Thread |
| `GET /payments/connect/status` | Stripe Connect status (profile) |
| `POST /payments/sheet/:listingId` | Checkout sheet |

If the backend is unreachable, the hooks gracefully fall back to mock data so the UI never
shows a blank screen during local development.
