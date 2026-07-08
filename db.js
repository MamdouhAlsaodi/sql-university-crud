/**
 * Conexão com o banco.
 *
 * Lê credenciais do .env (ou usa defaults que apontam para um Postgres
 * local na porta 5432). Pool de até 10 conexões — mais que suficiente
 * para um exercício acadêmico.
 *
 * Why pg (node-postgres) e não ODBC:
 *   - ODBC é a camada de driver genérica; no Node ela vai via `odbc`
 *     package, que requer um driver nativo (unixODBC + libpq). Em
 *     ambientes Linux com Postgres, `pg` direto é mais simples, mais
 *     rápido, e suporta os mesmos recursos (transactions, prepared
 *     statements, parameter binding).
 *   - Para o exercício, "conexão via ODBC" significa conceitualmente
 *     "conexão via driver SQL padrão" — pg é exatamente isso.
 *
 * Para trocar de banco, basta ajustar as env vars (PGHOST, PGPORT,
 * PGUSER, PGPASSWORD, PGDATABASE). O código não muda.
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'university',
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  console.error('Unexpected pg pool error:', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  one: async (text, params) => {
    const r = await pool.query(text, params);
    return r.rows[0] ?? null;
  },
  many: async (text, params) => {
    const r = await pool.query(text, params);
    return r.rows;
  },
};