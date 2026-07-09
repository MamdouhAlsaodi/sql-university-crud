#!/usr/bin/env bash
# Apply the schema (creates tables).
# Assumes the database already exists (created manually once).
# Idempotent: drops tables first, then recreates.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "❌ .env file not found. Copy .env.example to .env and edit credentials."
  exit 1
fi
set -a; source .env; set +a

# Detect mysql vs mariadb binary
DB_CLIENT="${DB_CLIENT:-mariadb}"
if ! command -v mariadb >/dev/null 2>&1; then
  DB_CLIENT="mysql"
fi

echo "📐 Applying schema to \`${MYSQL_DATABASE}\` on ${MYSQL_HOST}:${MYSQL_PORT}..."
$DB_CLIENT -h "${MYSQL_HOST:-127.0.0.1}" -P "${MYSQL_PORT:-3306}" \
  -u "${MYSQL_USER}" -p"${MYSQL_PASSWORD}" "${MYSQL_DATABASE}" \
  < sql/01_create_schema.sql

echo "✅ Schema applied."