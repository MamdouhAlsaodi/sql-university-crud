/**
 * Conexão com o banco MySQL.
 *
 * Lê credenciais do .env (ou usa defaults que apontam para um MySQL
 * local na porta 3306). Pool de até 10 conexões — mais que suficiente
 * para um exercício acadêmico.
 *
 * Why mysql2 (e não mysql ou ODBC):
 *   - mysql2 é o driver Node mais usado para MySQL — performático,
 *     suporta prepared statements, transactions, parameter binding.
 *   - ODBC no Node exigiria o pacote `odbc` + unixODBC + driver
 *     nativo (libmysqlclient). Em ambiente Linux, mysql2 via TCP
 *     direto na 3306 é mais simples e suficiente.
 *   - A string de conexão ODBC equivalente está documentada no README.
 */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'university_user',
  password: process.env.MYSQL_PASSWORD || 'university_pass',
  database: process.env.MYSQL_DATABASE || 'university',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // DATETIME → string (mais simples que Date objects)
  decimalNumbers: true, // DECIMAL → number
});

pool.getConnection()
  .then((conn) => {
    console.log('✓ MySQL pool conectado');
    conn.release();
  })
  .catch((err) => {
    console.error('✗ MySQL pool erro:', err.message);
  });

module.exports = {
  pool,
  query: async (text, params) => {
    const [rows] = await pool.query(text, params);
    return { rows };
  },
  one: async (text, params) => {
    const [rows] = await pool.query(text, params);
    return rows[0] ?? null;
  },
  many: async (text, params) => {
    const [rows] = await pool.query(text, params);
    return rows;
  },
};