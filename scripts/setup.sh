#!/usr/bin/env bash
set -e

echo "==> Checking Node.js..."
node --version || { echo "Node.js not found. Install from https://nodejs.org"; exit 1; }

echo "==> Installing dependencies..."
if command -v pnpm &>/dev/null; then
  pnpm install
else
  npm install --legacy-peer-deps
fi

echo "==> Checking .env..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  Created .env from .env.example — update the values before running."
else
  echo "  .env already exists."
fi

echo "==> Checking .env.local..."
if [ ! -f .env.local ]; then
  echo "DATABASE_URL=postgres://expenses:changeme@localhost:5432/expenses" > .env.local
  echo "  Created .env.local — update DATABASE_URL if needed."
else
  echo "  .env.local already exists."
fi

# Run DB migration if DATABASE_URL is set
if grep -q 'DATABASE_URL=.\+' .env.local 2>/dev/null; then
  echo "==> Running database migration..."
  export $(grep -v '^#' .env.local | xargs)
  psql "$DATABASE_URL" -f scripts/001_create_expenses_table.sql
  echo "  Migration complete."
else
  echo "  Skipping DB migration — DATABASE_URL not set in .env.local."
fi

echo ""
echo "Setup complete. Start the dev server with:"
echo "  npm run dev"
echo ""
echo "Or with Docker:"
echo "  make up"
echo ""
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -n "$SERVER_IP" ]; then
  echo "App will be available at:"
  echo "  Local:   http://localhost:3000"
  echo "  Network: http://$SERVER_IP:3000"
fi
