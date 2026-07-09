#!/usr/bin/env bash
# Insert seed data (3 cursos, 9 disciplinas, 10 alunos, 20 matrículas).
# Assumes the schema has already been applied via db-create.sh.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "❌ .env file not found."
  exit 1
fi
set -a; source .env; set +a

echo "🌱 Seeding data..."
mysql -h "${MYSQL_HOST:-127.0.0.1}" -P "${MYSQL_PORT:-3306}" \
  -u "${MYSQL_USER}" -p"${MYSQL_PASSWORD}" "${MYSQL_DATABASE}" \
  < sql/02_seed_data.sql

echo "✅ Seed complete. Sanity check:"
mysql -h "${MYSQL_HOST:-127.0.0.1}" -P "${MYSQL_PORT:-3306}" \
  -u "${MYSQL_USER}" -p"${MYSQL_PASSWORD}" "${MYSQL_DATABASE}" \
  -e "SELECT (SELECT COUNT(*) FROM Curso) AS cursos,
             (SELECT COUNT(*) FROM Disciplina) AS disciplinas,
             (SELECT COUNT(*) FROM Aluno) AS alunos,
             (SELECT COUNT(*) FROM Matricula) AS matriculas;"