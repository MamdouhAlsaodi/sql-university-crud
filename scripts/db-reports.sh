#!/usr/bin/env bash
# Run the 8 reports from sql/03_query_reports.sql and print results.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "❌ .env file not found."
  exit 1
fi
set -a; source .env; set +a

mysql -h "${MYSQL_HOST:-127.0.0.1}" -P "${MYSQL_PORT:-3306}" \
  -u "${MYSQL_USER}" -p"${MYSQL_PASSWORD}" "${MYSQL_DATABASE}" \
  < sql/03_query_reports.sql