#!/usr/bin/env bash
set -e

# Pre-commit verification gate for apps/web/src/
# Blocks commits that fail lint, typecheck, test, or build

echo "🔍 Running pre-commit verification..."

# Get list of staged files in apps/web/src/
STAGED_WEB_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '^apps/web/src/' || true)

if [ -z "$STAGED_WEB_FILES" ]; then
  echo "✅ No files in apps/web/src/ staged — skipping verification"
  exit 0
fi

echo "📝 Staged files:"
echo "$STAGED_WEB_FILES"
echo ""

# 1. Prettier (already runs via lint-staged)
echo "✨ Formatting (handled by lint-staged)..."

# 2. Lint + Typecheck (parallel)
echo "🔍 Linting and type-checking..."
pnpm --filter web lint &
LINT_PID=$!

wait $LINT_PID || {
  echo "❌ Lint or type check failed"
  exit 1
}

# 3. Unit tests (affected tests only)
echo "🧪 Running tests..."
pnpm --filter web test || {
  echo "❌ Tests failed"
  exit 1
}

# 4. Build check (full build to catch integration issues)
echo "🏗️  Verifying build..."
pnpm --filter web build || {
  echo "❌ Build failed"
  exit 1
}

echo "✅ All verifications passed"
