#!/usr/bin/env bash
# Orbit dev-stack smoke test.
# Assumes Redis is running and the backend (:3000) + frontend (:3001)
# dev servers were started per SKILL.md. Hits each, screenshots the
# frontend home page through headless Chrome, reports pass/fail.
#
# Usage from repo root: .claude/skills/run-orbit/smoke.sh
set -uo pipefail

OUT_DIR="${ORBIT_SMOKE_OUT:-/tmp/orbit-smoke}"
mkdir -p "$OUT_DIR"
SHOT="$OUT_DIR/home.png"
fail=0

step() { printf "\n\033[1m== %s ==\033[0m\n" "$*"; }
ok()   { printf "  \033[32mok\033[0m   %s\n" "$*"; }
bad()  { printf "  \033[31mFAIL\033[0m %s\n" "$*"; fail=1; }

step "Redis (localhost:6379)"
if /opt/homebrew/opt/redis/bin/redis-cli -p 6379 ping 2>/dev/null | grep -q PONG; then
  ok "PONG"
else
  bad "redis-cli ping failed — run: brew services start redis"
fi

step "Backend (http://localhost:3000)"
# Public route doesn't exist; expect 404 for / (proves Nest is serving)
root=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000/ || echo "000")
case "$root" in
  404) ok "GET / → 404 (Nest is up, no root handler)";;
  000) bad "GET / → no response (backend not started?)";;
  *)   ok "GET / → $root";;
esac
# Auth-protected route should 401 without a Clerk token
hot=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000/listings/hot || echo "000")
case "$hot" in
  401) ok "GET /listings/hot → 401 (Clerk guard wired)";;
  000) bad "GET /listings/hot → no response";;
  *)   bad "GET /listings/hot → $hot (expected 401)";;
esac

step "Frontend (http://localhost:3001)"
home=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 http://localhost:3001/ || echo "000")
case "$home" in
  200) ok "GET / → 200";;
  000) bad "GET / → no response (frontend not started?)";;
  *)   bad "GET / → $home (expected 200)";;
esac

step "Screenshot frontend home"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ -x "$CHROME" ]; then
  rm -f "$SHOT"
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --window-size=1280,800 --screenshot="$SHOT" \
    --virtual-time-budget=4000 http://localhost:3001/ >/dev/null 2>&1
  if [ -s "$SHOT" ]; then
    ok "wrote $SHOT — open it and look: dev-mode React-warning overlay is expected (see SKILL.md gotchas)"
  else
    bad "screenshot file empty or missing"
  fi
else
  bad "Google Chrome not found at $CHROME"
fi

echo
if [ "$fail" -eq 0 ]; then
  printf "\033[32mAll smoke checks passed.\033[0m  Screenshot: %s\n" "$SHOT"
  exit 0
else
  printf "\033[31mSmoke checks failed — see above.\033[0m\n"
  exit 1
fi
