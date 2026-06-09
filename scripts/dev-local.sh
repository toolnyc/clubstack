#!/usr/bin/env bash
# dev-local.sh — Start local services and sync env vars
#
# Starts: Supabase (Docker), Stripe webhook listener
# Writes: NEXT_PUBLIC_SUPABASE_*, SUPABASE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
#         NEXT_PUBLIC_APP_URL → apps/web/.env.local (+ root .env.local)
#
# Usage:
#   bash scripts/dev-local.sh            # localhost URLs (web dev)
#   bash scripts/dev-local.sh --mobile   # LAN IP URLs (QA on physical device)
#   bash scripts/dev-local.sh --help

set -uo pipefail

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_ENV="$PROJECT_ROOT/.env.local"
WEB_ENV="$PROJECT_ROOT/apps/web/.env.local"
MOBILE_ENV="$PROJECT_ROOT/apps/mobile/.env.local"
STRIPE_LOG=$(mktemp)

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------
STRIPE_PID=""
MOBILE=false

# ---------------------------------------------------------------------------
# Args
# ---------------------------------------------------------------------------
for arg in "$@"; do
  case $arg in
    --mobile) MOBILE=true ;;
    --help|-h)
      echo "Usage: bash scripts/dev-local.sh [--mobile]"
      echo ""
      echo "  (no flag)  Use localhost/127.0.0.1 URLs — standard web dev"
      echo "  --mobile   Use LAN IP for Supabase + API — QA on physical device"
      echo ""
      echo "Writes these vars to apps/web/.env.local and .env.local:"
      echo "  NEXT_PUBLIC_SUPABASE_URL"
      echo "  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      echo "  SUPABASE_SECRET_KEY"
      echo "  STRIPE_WEBHOOK_SECRET"
      echo "  NEXT_PUBLIC_APP_URL"
      echo ""
      echo "With --mobile, also writes to apps/mobile/.env.local:"
      echo "  EXPO_PUBLIC_SUPABASE_URL"
      echo "  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      echo "  EXPO_PUBLIC_API_URL"
      exit 0
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
cleanup() {
  echo ""
  if [ -n "$STRIPE_PID" ] && kill -0 "$STRIPE_PID" 2>/dev/null; then
    echo -e "${YELLOW}Stopping Stripe listener (PID $STRIPE_PID)...${RESET}"
    kill "$STRIPE_PID" 2>/dev/null || true
  fi
  rm -f "$STRIPE_LOG"
  echo -e "${YELLOW}Stopped. Supabase containers are still running — use: pnpm db:stop${RESET}"
}
trap cleanup EXIT INT TERM

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log_step() { echo -e "\n${BOLD}${BLUE}==> $1${RESET}"; }
log_ok()   { echo -e "  ${GREEN}✓${RESET}  $1"; }
log_warn() { echo -e "  ${YELLOW}⚠${RESET}  $1"; }
log_err()  { echo -e "  ${RED}✗${RESET}  $1" >&2; }

# Upsert KEY=VALUE in an env file. Creates file if missing.
# If key already exists (including commented out), replaces that line.
upsert_env() {
  local key="$1"
  local value="$2"
  local file="$3"

  [ -f "$file" ] || touch "$file"

  if grep -q "^#*\s*${key}=" "$file" 2>/dev/null; then
    sed -i '' "s|^#*[[:space:]]*${key}=.*|${key}=${value}|" "$file"
  else
    # Add a newline before if file doesn't end with one
    [[ -s "$file" ]] && [[ "$(tail -c1 "$file" | wc -l)" -eq 0 ]] && echo "" >> "$file"
    echo "${key}=${value}" >> "$file"
  fi
}

write_vars_to_file() {
  local file="$1"
  local label="$2"

  upsert_env "NEXT_PUBLIC_SUPABASE_URL"            "$SUPABASE_URL"       "$file"
  upsert_env "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" "$ANON_KEY"          "$file"
  upsert_env "SUPABASE_SECRET_KEY"                  "$SERVICE_ROLE_KEY"  "$file"
  upsert_env "NEXT_PUBLIC_APP_URL"                  "$APP_URL"           "$file"

  if [ -n "$STRIPE_SECRET" ]; then
    upsert_env "STRIPE_WEBHOOK_SECRET" "$STRIPE_SECRET" "$file"
  fi

  log_ok "$label"
}

# ---------------------------------------------------------------------------
# 1. Dependency checks
# ---------------------------------------------------------------------------
log_step "Checking dependencies"

if ! command -v supabase &>/dev/null; then
  log_err "supabase CLI not found — install: brew install supabase/tap/supabase"
  exit 1
fi
log_ok "supabase $(supabase --version 2>/dev/null | head -1)"

if ! command -v stripe &>/dev/null; then
  log_err "stripe CLI not found — install: brew install stripe/stripe-cli/stripe"
  exit 1
fi
log_ok "$(stripe --version 2>/dev/null)"

if ! docker info &>/dev/null 2>&1; then
  log_err "Docker is not running — start Docker Desktop and retry"
  exit 1
fi
log_ok "Docker is running"

# ---------------------------------------------------------------------------
# 2. Ensure root .env.local exists (as a base for non-local vars)
# ---------------------------------------------------------------------------
if [ ! -f "$ROOT_ENV" ]; then
  if [ -f "$PROJECT_ROOT/.env.local.example" ]; then
    cp "$PROJECT_ROOT/.env.local.example" "$ROOT_ENV"
    log_warn "Created .env.local from .env.local.example — fill in Stripe, Knock, etc."
  else
    touch "$ROOT_ENV"
  fi
fi

# ---------------------------------------------------------------------------
# 3. Determine URL scheme (localhost vs LAN IP)
# ---------------------------------------------------------------------------
if $MOBILE; then
  log_step "Detecting LAN IP for mobile mode"
  LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null \
    || ipconfig getifaddr en1 2>/dev/null \
    || echo "")
  if [ -z "$LOCAL_IP" ]; then
    log_err "Could not detect LAN IP — are you connected to WiFi?"
    exit 1
  fi
  SUPABASE_HOST="$LOCAL_IP"
  APP_HOST="$LOCAL_IP"
  log_ok "LAN IP: $LOCAL_IP"
else
  SUPABASE_HOST="127.0.0.1"
  APP_HOST="localhost"
fi

SUPABASE_URL="http://${SUPABASE_HOST}:54321"
APP_URL="http://${APP_HOST}:3000"

# ---------------------------------------------------------------------------
# 3b. Export env vars needed by supabase/config.toml env() substitution
# ---------------------------------------------------------------------------
export SUPABASE_SITE_URL="$APP_URL"

# ---------------------------------------------------------------------------
# 4. Start Supabase
# ---------------------------------------------------------------------------
log_step "Starting Supabase"

cd "$PROJECT_ROOT"

# Check if already running — match port 54321 which appears in both old and new output formats
SUPABASE_ALREADY_RUNNING=false
if supabase status 2>/dev/null | grep -q "54321"; then
  SUPABASE_ALREADY_RUNNING=true
  log_ok "Supabase already running"
  log_warn "Supabase auth config may be stale (site_url / SMTP) until restart"
  log_warn "Run: pnpm db:stop && bash scripts/dev-local.sh"
  if $MOBILE; then
    log_warn "Supabase already running — site_url won't change to LAN IP without a restart"
    log_warn "Run: pnpm db:stop && bash scripts/dev-local.sh --mobile"
  fi
else
  echo "  Starting containers (may take 30-60s on first run)..."
  if ! supabase start 2>&1; then
    log_err "supabase start failed — check Docker and run: pnpm db:start"
    exit 1
  fi
fi

SUPABASE_STATUS=$(supabase status 2>/dev/null)

# New CLI format (v2.x): keys have sb_publishable_ / sb_secret_ prefixes
ANON_KEY=$(echo "$SUPABASE_STATUS" | grep -o 'sb_publishable_[A-Za-z0-9_-]*' | head -1)
SERVICE_ROLE_KEY=$(echo "$SUPABASE_STATUS" | grep -o 'sb_secret_[A-Za-z0-9_-]*' | head -1)

# Legacy CLI format: JWT tokens labelled "anon key:" / "service_role key:"
if [ -z "$ANON_KEY" ]; then
  ANON_KEY=$(echo "$SUPABASE_STATUS" | grep "anon key:" | awk '{print $NF}' | tr -d '[:space:]')
fi
if [ -z "$SERVICE_ROLE_KEY" ]; then
  SERVICE_ROLE_KEY=$(echo "$SUPABASE_STATUS" | grep "service_role key:" | awk '{print $NF}' | tr -d '[:space:]')
fi

if [ -z "$ANON_KEY" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
  log_err "Could not extract Supabase keys — raw status output:"
  echo "$SUPABASE_STATUS"
  exit 1
fi

log_ok "API:       $SUPABASE_URL"
log_ok "Studio:    http://127.0.0.1:54323"
log_ok "Email:     Mailpit (fake inbox) → http://127.0.0.1:54324"

# ---------------------------------------------------------------------------
# 5. Start Stripe webhook listener
# ---------------------------------------------------------------------------
log_step "Starting Stripe webhook listener"

stripe listen \
  --forward-to "localhost:3000/api/stripe/webhook" \
  > "$STRIPE_LOG" 2>&1 &
STRIPE_PID=$!

# Poll for webhook secret (up to 15s)
STRIPE_SECRET=""
for i in $(seq 1 30); do
  STRIPE_SECRET=$(grep -o "whsec_[a-zA-Z0-9]*" "$STRIPE_LOG" 2>/dev/null | head -1 || true)
  [ -n "$STRIPE_SECRET" ] && break
  sleep 0.5
done

if [ -z "$STRIPE_SECRET" ]; then
  log_warn "No webhook secret captured — are you logged in? Run: stripe login"
  log_warn "STRIPE_WEBHOOK_SECRET will not be updated; Stripe forwarding may not work"
  kill "$STRIPE_PID" 2>/dev/null || true
  STRIPE_PID=""
else
  log_ok "Forwarding → localhost:3000/api/stripe/webhook"
  log_ok "Secret: $STRIPE_SECRET"
fi

# ---------------------------------------------------------------------------
# 6. Write env vars
# ---------------------------------------------------------------------------
log_step "Writing env vars"

# apps/web/.env.local — Next.js reads from here (app root = apps/web/)
write_vars_to_file "$WEB_ENV" "apps/web/.env.local"

# root .env.local — keep in sync for tooling that reads from project root
write_vars_to_file "$ROOT_ENV" ".env.local (root)"

# apps/mobile/.env.local — Expo EXPO_PUBLIC_* vars (only with --mobile)
if $MOBILE; then
  [ -f "$MOBILE_ENV" ] || touch "$MOBILE_ENV"
  upsert_env "EXPO_PUBLIC_SUPABASE_URL"             "$SUPABASE_URL" "$MOBILE_ENV"
  upsert_env "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY" "$ANON_KEY"     "$MOBILE_ENV"
  upsert_env "EXPO_PUBLIC_API_URL"                  "$APP_URL"      "$MOBILE_ENV"
  log_ok "apps/mobile/.env.local (EXPO_PUBLIC_* with LAN IP)"
fi

# ---------------------------------------------------------------------------
# 7. Summary
# ---------------------------------------------------------------------------
echo ""
echo -e "${BOLD}${GREEN}All services ready${RESET}"
echo ""
echo -e "  ${CYAN}Supabase API${RESET}      $SUPABASE_URL"
echo -e "  ${CYAN}Supabase Studio${RESET}   http://127.0.0.1:54323"
echo -e "  ${CYAN}Auth email${RESET}        Mailpit fake inbox → http://127.0.0.1:54324"
if [ -n "$STRIPE_PID" ]; then
  echo -e "  ${CYAN}Stripe listener${RESET}   → localhost:3000/api/stripe/webhook  (PID $STRIPE_PID)"
fi
echo ""
echo -e "  Next steps:"
echo -e "    ${BOLD}pnpm dev${RESET}          start web dev server"
if $MOBILE; then
  echo -e "    ${BOLD}pnpm dev:mobile${RESET}   start Expo (in a new terminal)"
  echo -e ""
  echo -e "  ${YELLOW}Phone must be on the same WiFi as this machine ($APP_HOST)${RESET}"
fi
echo ""
if [ -n "$STRIPE_PID" ]; then
  echo -e "  ${YELLOW}Stripe listener is running — keep this terminal open${RESET}"
  echo -e "  ${YELLOW}Ctrl+C to stop (Supabase containers keep running)${RESET}"
  echo ""
  # Hold process open so the Stripe listener stays alive
  wait "$STRIPE_PID" 2>/dev/null || true
fi
