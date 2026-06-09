#!/usr/bin/env bash
# dev-stop.sh — Stop all services started by dev-local.sh
#
# Stops: Stripe webhook listener, Supabase containers

set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

log_step() { echo -e "\n${BOLD}${BLUE}==> $1${RESET}"; }
log_ok()   { echo -e "  ${GREEN}✓${RESET}  $1"; }
log_warn() { echo -e "  ${YELLOW}⚠${RESET}  $1"; }

# ---------------------------------------------------------------------------
# 1. Stop Stripe listener
# ---------------------------------------------------------------------------
log_step "Stopping Stripe listener"

if pkill -f "stripe listen" 2>/dev/null; then
  log_ok "Stripe listener stopped"
else
  log_warn "No Stripe listener process found"
fi

# ---------------------------------------------------------------------------
# 2. Stop Supabase
# ---------------------------------------------------------------------------
log_step "Stopping Supabase"

cd "$PROJECT_ROOT"

if supabase status 2>/dev/null | grep -q "54321"; then
  supabase stop
  log_ok "Supabase stopped"
else
  log_warn "Supabase was not running"
fi

echo ""
echo -e "${BOLD}${GREEN}All services stopped${RESET}"
echo ""
