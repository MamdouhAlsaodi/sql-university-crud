#!/usr/bin/env bash
# Reset the database: drop, recreate, apply schema, and seed.
# Convenience wrapper for development.
set -euo pipefail
cd "$(dirname "$0")/.."

bash scripts/db-create.sh
bash scripts/db-seed.sh
echo ""
echo "🚀 Database reset complete. Run: npm start"