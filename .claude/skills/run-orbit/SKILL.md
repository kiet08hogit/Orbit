---
name: run-orbit
description: Run, start, launch, smoke-test, or screenshot the Orbit dev stack — Redis, NestJS backend on :3000, Next.js frontend on :3001. Use when an agent needs to bring the app up locally or verify it's working.
---

Orbit is a two-service app: a NestJS backend (`backend/`, port 3000) and a Next.js 16 frontend (`frontend/`, port 3001), backed by a remote Amazon RDS Postgres and a local Redis. The agent path is `.claude/skills/run-orbit/smoke.sh` — it pings Redis, hits the backend and frontend over `curl`, and screenshots the home page through headless Chrome. All paths below are relative to the repo root.

## Prerequisites (macOS, verified)

```bash
# Node 18+. Verified on v24.13.0 via nvm.
node -v

# Redis as a Homebrew service (the dev stack expects localhost:6379)
brew install redis
brew services start redis
/opt/homebrew/opt/redis/bin/redis-cli ping   # → PONG
```

Postgres is **not** local — `backend/.env` points `DATABASE_URL` at the team's Amazon RDS cluster. Do not run `prisma db push` against it; the schema is shared.

## Env files

Both must exist before you launch. They are gitignored; copy from a teammate.

- `backend/.env` — `DATABASE_URL`, `REDIS_HOST=localhost`, `REDIS_PORT=6379`, Clerk (`CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`), AWS (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`), Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`), `GEMINI_API_KEY`, `NODE_TLS_REJECT_UNAUTHORIZED`.
- `frontend/.env` — `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

`backend/.env.example` is empty (0 bytes) — don't trust it as a template.

## Install

```bash
# Backend — MUST use --legacy-peer-deps (see Gotchas)
cd backend && npm install --legacy-peer-deps

# Frontend
cd ../frontend && npm install

# Generate Prisma client. Do NOT db push — RDS is shared.
cd ../backend && npx prisma generate
```

## Run (agent path)

Launch both servers in the background, then drive with `smoke.sh`.

```bash
# Backend (port 3000)
cd backend && nohup npm run start:dev >/tmp/orbit-backend.log 2>&1 &
# Wait until Nest is ready
until grep -q "Nest application successfully started" /tmp/orbit-backend.log; do sleep 1; done

# Frontend (port 3001 — backend already holds :3000, so set PORT explicitly)
cd ../frontend && PORT=3001 nohup npm run dev >/tmp/orbit-frontend.log 2>&1 &
until grep -q "Ready in" /tmp/orbit-frontend.log; do sleep 1; done

# Smoke
cd .. && .claude/skills/run-orbit/smoke.sh
```

`smoke.sh` exits 0 when all checks pass and writes a home-page screenshot to `/tmp/orbit-smoke/home.png` (override with `ORBIT_SMOKE_OUT=...`). Look at the screenshot — it should show the landing page (a React dev-warning overlay is expected; see Gotchas).

To stop:

```bash
# Backend: nest --watch spawns a child that holds :3000 after the watcher dies,
# so kill by port too. Frontend's next dev exits cleanly with pkill.
pkill -f "nest start --watch"
lsof -ti :3000 | xargs -r kill
pkill -f "next dev"
# Redis can stay running; if you want it gone: brew services stop redis
```

## Run (human path)

```bash
(cd backend && npm run start:dev)        # Terminal 1, port 3000
(cd frontend && PORT=3001 npm run dev)   # Terminal 2, port 3001
open http://localhost:3001/              # in macOS Chrome
```

Frontend's `next dev` will auto-pick another port if 3001 is taken — pin it with `PORT=3001` so the smoke script finds it.

## Gotchas

- **`npm install` in `backend/` fails without `--legacy-peer-deps`.** `nestjs-throttler-storage-redis@0.5.1` declares a peer of `@nestjs/common@^7-10`, but the project is on `@nestjs/common@11`. ERESOLVE. The project has no `.npmrc`, so the flag has to be passed on the command line. Frontend installs cleanly.
- **`npx prisma generate` fails the first time with `Cannot find module 'dotenv/config'`** if you ran it before `npm install` (it falls back to `npx prisma@7.8.0` which doesn't have the project's deps). Always install first, then `npx prisma generate` — it'll pick up the local Prisma and load `prisma.config.ts`.
- **Frontend default port (3000) collides with the backend.** Always start the frontend with `PORT=3001`. Without it, Next.js silently picks 3002+ and `smoke.sh` misses it.
- **Headless screenshot captures a Next.js dev-error overlay** showing `React does not recognize the 'asChild' prop` at `frontend/app/page.tsx:36`. This is a real React warning in dev mode — the page underneath does load (curl returns 200) but the overlay is what renders in the screenshot. The smoke script does not consider this a failure. Either fix the prop spelling or build in production mode (`next build && next start`) to verify the actual landing UI.
- **`.env` contains real RDS + Clerk + Stripe + AWS credentials.** All `.env` files are gitignored (backend's `.gitignore:.env*`, frontend's `.gitignore:.env*`), but be careful not to `cat` them in shared sessions — the RDS password is in plaintext in `DATABASE_URL`.
- **Do not run `prisma db push` or any migration command.** `DATABASE_URL` points at a shared Amazon RDS cluster used by the team. The README mentions `db push`; ignore that — `prisma generate` is all that's needed locally.

## Troubleshooting

- `npm error code ERESOLVE` in `backend/` → re-run with `--legacy-peer-deps`.
- `Cannot find module 'dotenv/config'` from `prisma generate` → run `npm install --legacy-peer-deps` in `backend/` first.
- `EADDRINUSE :::3000` → an existing backend is still running. `pkill -f "nest start --watch"`.
- Smoke step "backend → no response" → backend didn't reach the "Nest application successfully started" line. `tail -100 /tmp/orbit-backend.log` for the actual error (most likely Prisma / RDS connectivity if VPN-gated).
- Smoke step "frontend → no response" → wrong port. Confirm with `lsof -i :3001`; if Next.js picked another port, restart with `PORT=3001`.
