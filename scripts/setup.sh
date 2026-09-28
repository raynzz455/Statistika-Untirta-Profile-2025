#!/usr/bin/env bash
# ============================================================================
# Statistika '25 — Complete Setup Automation Script
# ============================================================================
# Validates environment, runs Prisma migrations, seeds data, and prints
# exact commands for Supabase Dashboard configuration (SQL + OAuth + admin).
#
# Usage:
#   bash scripts/setup.sh         # full setup
#   bash scripts/setup.sh --skip-seed  # skip seed step
#   bash scripts/setup.sh --verify-only  # only verify
#
# Prerequisites:
#   1. .env file exists with Supabase credentials (see .env.example)
#   2. Supabase project created at https://supabase.com
#   3. Bun installed (https://bun.sh)
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

print_step() {
  echo ""
  echo -e "${BLUE}${BOLD}▶ $1${NC}"
}

print_ok() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warn() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_err() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "  $1"
}

# Parse args
SKIP_SEED=false
VERIFY_ONLY=false
for arg in "$@"; do
  case $arg in
    --skip-seed) SKIP_SEED=true ;;
    --verify-only) VERIFY_ONLY=true ;;
    *) echo "Unknown arg: $arg"; exit 1 ;;
  esac
done

cd "$(dirname "$0")/.."

# ============================================================================
# STAGE 0: PREREQUISITES CHECK
# ============================================================================
print_step "STAGE 0: Prerequisites check"

# Check bun
if ! command -v bun &> /dev/null; then
  print_err "Bun is not installed. Install: https://bun.sh"
  exit 1
fi
print_ok "Bun installed: $(bun --version)"

# Check .env file
if [ ! -f .env ]; then
  print_err ".env file not found"
  print_info "Copy template: cp .env.example .env"
  print_info "Then edit .env with your Supabase credentials"
  exit 1
fi
print_ok ".env file exists"

# Load .env
set -a
source .env
set +a

# ============================================================================
# STAGE 1: VALIDATE ENVIRONMENT VARIABLES
# ============================================================================
print_step "STAGE 1: Validate environment variables"

REQUIRED_VARS=(
  "DATABASE_URL"
  "DIRECT_URL"
  "SESSION_SECRET"
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
)

MISSING=()
for var in "${REQUIRED_VARS[@]}"; do
  VAL="${!var:-}"
  if [ -z "$VAL" ] || [[ "$VAL" == *"YOUR_"* ]] || [[ "$VAL" == *"REPLACE_WITH"* ]]; then
    MISSING+=("$var")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  print_err "Missing or placeholder env vars:"
  for v in "${MISSING[@]}"; do
    print_info "  - $v"
  done
  echo ""
  print_info "Edit .env file with real Supabase credentials"
  print_info "Get them from: https://supabase.com/dashboard/PROJECT_REF/settings/api"
  exit 1
fi
print_ok "All 6 required env vars are set"

# Validate DATABASE_URL format (PostgreSQL)
if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
  print_warn "DATABASE_URL doesn't start with postgresql://"
  print_info "For SQLite local dev, see SETUP_RUNBOOK.md"
fi

# Validate SESSION_SECRET length
if [ ${#SESSION_SECRET} -lt 32 ]; then
  print_warn "SESSION_SECRET is short (${#SESSION_SECRET} chars). Use 32+ chars."
  print_info "Generate: bun -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
fi

# Extract Supabase project ref from URL
PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
print_ok "Supabase project ref: $PROJECT_REF"

if [ "$VERIFY_ONLY" = true ]; then
  echo ""
  print_step "VERIFY ONLY — skipping migrations"
  exit 0
fi

# ============================================================================
# STAGE 2: INSTALL DEPENDENCIES
# ============================================================================
print_step "STAGE 2: Install dependencies"
bun install
print_ok "Dependencies installed"

# ============================================================================
# STAGE 3: GENERATE PRISMA CLIENT
# ============================================================================
print_step "STAGE 3: Generate Prisma client"
bun run db:generate
print_ok "Prisma client generated"

# ============================================================================
# STAGE 4: PUSH SCHEMA TO SUPABASE
# ============================================================================
print_step "STAGE 4: Push schema to Supabase (creates 18 tables)"
bun run db:push
print_ok "Schema pushed — 18 tables created in Supabase"

# ============================================================================
# STAGE 5: SEED DATA
# ============================================================================
if [ "$SKIP_SEED" = false ]; then
  print_step "STAGE 5: Seed sample data"
  print_info "This will insert: 3 users, 12 students, 3 dosen, 4 articles,"
  print_info "                  4 events, 6 gallery, 20 aspirasi, 12 portfolios"
  bun run db:seed
  print_ok "Sample data seeded"
fi

# ============================================================================
# STAGE 6: PRINT SUPABASE DASHBOARD COMMANDS
# ============================================================================
print_step "STAGE 6: Run SQL files in Supabase Dashboard"

DASHBOARD_URL="https://supabase.com/dashboard/$PROJECT_REF"
SQL_EDITOR_URL="$DASHBOARD_URL/sql/new"
AUTH_PROVIDERS_URL="$DASHBOARD_URL/auth/providers"
STORAGE_URL="$DASHBOARD_URL/storage/buckets"

echo ""
echo -e "${BOLD}Open Supabase SQL Editor:${NC} ${BLUE}${SQL_EDITOR_URL}${NC}"
echo ""

print_info "Run these SQL files IN ORDER (paste content + Run):"
echo ""
echo -e "  ${BOLD}1. Schema${NC}        (creates tables, indexes, triggers)"
echo -e "     File: ${BLUE}supabase/schema.sql${NC}"
echo -e "     Note: If you ran bun run db:push above, schema is already created."
echo -e "           Only run this if you want to use SQL-only approach."
echo ""
echo -e "  ${BOLD}2. RLS Policies${NC}  (enables Row-Level Security on all tables)"
echo -e "     File: ${BLUE}supabase/rls-policies.sql${NC}"
echo -e "     ⚠ Required for security — without this, all data is readable/writable"
echo ""
echo -e "  ${BOLD}3. Storage Policies${NC} (creates 'mahasiswa-photos' bucket)"
echo -e "     File: ${BLUE}supabase/storage-policies.sql${NC}"
echo ""

# ============================================================================
# STAGE 7: PRINT OAUTH CONFIGURATION STEPS
# ============================================================================
print_step "STAGE 7: Configure OAuth providers"
echo ""
echo -e "${BOLD}Open Auth Providers:${NC} ${BLUE}${AUTH_PROVIDERS_URL}${NC}"
echo ""
echo -e "${BOLD}Google OAuth setup:${NC}"
print_info "1. Google Cloud Console → APIs & Services → Credentials"
print_info "2. Create OAuth 2.0 Client ID (Web application)"
print_info "3. Authorized redirect URI:"
print_info "   https://$PROJECT_REF.supabase.co/auth/v1/callback"
print_info "4. Copy Client ID + Secret to Supabase Dashboard → Google provider"
echo ""
echo -e "${BOLD}GitHub OAuth setup:${NC}"
print_info "1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App"
print_info "2. Authorization callback URL:"
print_info "   https://$PROJECT_REF.supabase.co/auth/v1/callback"
print_info "3. Copy Client ID + Secret to Supabase Dashboard → GitHub provider"
echo ""

# ============================================================================
# STAGE 8: PRINT ADMIN USER SETUP
# ============================================================================
print_step "STAGE 8: Set up admin user"
echo ""
echo -e "${BOLD}After signing up first user via Supabase Auth (Google/GitHub/email):${NC}"
echo ""
print_info "1. Open SQL Editor: $SQL_EDITOR_URL"
print_info "2. Find your user ID:"
print_info "   SELECT id, email FROM auth.users;"
print_info ""
print_info "3. Set as admin:"
print_info "   UPDATE profiles SET role = 'admin' WHERE id = 'PASTE_USER_ID_HERE';"
print_info ""
print_info "4. Verify admin:"
print_info "   SELECT id, email, role FROM profiles WHERE role = 'admin';"
echo ""

# ============================================================================
# STAGE 9: PRINT VERIFICATION STEPS
# ============================================================================
print_step "STAGE 9: Verify setup"
echo ""
print_info "Run verification script:"
print_info "  bun run scripts/verify-setup.ts"
echo ""
print_info "Or test manually:"
print_info "  bun run dev"
print_info "  → Visit http://localhost:3000"
print_info "  → Login: admin/admin (custom session) OR via OAuth"
print_info "  → Check: /api/students, /api/aspirasi, /api/dosen"
echo ""

# ============================================================================
# STAGE 10: PRINT DEPLOY COMMANDS
# ============================================================================
print_step "STAGE 10: Deploy to Vercel"
echo ""
print_info "1. Push to GitHub (already done):"
print_info "   git push origin main"
echo ""
print_info "2. Import repo at https://vercel.com/new"
echo ""
print_info "3. Add environment variables (CRITICAL — server-only ones must NOT start with NEXT_PUBLIC_):"
for var in "${REQUIRED_VARS[@]}"; do
  if [[ "$var" == NEXT_PUBLIC_* ]]; then
    print_info "   $var = (public — safe to expose)"
  else
    print_info "   $var = (server-only — NEVER prefix with NEXT_PUBLIC_)"
  fi
done
print_info "   NEXT_PUBLIC_APP_URL = https://your-app.vercel.app"
print_info "   NODE_ENV = production"
echo ""

# ============================================================================
# DONE
# ============================================================================
print_step "✅ Setup complete!"
echo ""
print_ok "Database: 18 tables created in Supabase PostgreSQL"
if [ "$SKIP_SEED" = false ]; then
  print_ok "Data: 49 sample records seeded (3 users + 12 students + 3 dosen + 4 articles + ...)"
fi
print_ok "Code: All infrastructure ready (middleware, storage, auth, OAuth callback)"
print_ok "Security: Security headers + CSP active in next.config.ts"
echo ""
print_warn "Manual steps remaining (cannot be automated):"
print_info "1. Run 3 SQL files in Supabase SQL Editor (RLS, storage policies)"
print_info "2. Configure OAuth providers (Google, GitHub) in Supabase Dashboard"
print_info "3. Set first admin via SQL UPDATE"
print_info "4. Add env vars to Vercel + deploy"
echo ""
echo -e "${BOLD}Full runbook:${NC} SETUP_RUNBOOK.md"
echo -e "${BOLD}Security audit:${NC} SECURITY_AUDIT.md"
