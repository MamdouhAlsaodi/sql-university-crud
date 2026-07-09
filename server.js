/**
 * Sistema Universitário — servidor Express (v2, "diferenciado")
 *
 * Features que separam este projeto de um CRUD comum:
 *
 *   1. Dark / Light mode toggle (cookie persistente)
 *   2. Search bar em cada lista (LIKE server-side)
 *   3. Pagination em todas as listagens (10/página)
 *   4. Stats dashboard com mini bar chart (SVG inline, sem libs)
 *   5. CSV export em cada relatório (header Content-Disposition)
 *   6. ER diagram auto-gerado (SVG, baseado no schema real)
 *   7. Audit log — Matricula registra quem criou e o created_at
 *   8. KPI cards no dashboard com classes semânticas
 *   9. Erro visual amigável em vez de stack trace
 *  10. CSS variables + glassmorphism para parecer 2026, não 2006
 *
 * Conexão MySQL via driver mysql2 (string ODBC documentada no README).
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const { query, one, many } = require('./db');

const app = express();
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = parseInt(process.env.PORT || '4000', 10);
const PAGE_SIZE = 10;

/* ============================================================================
 * Helpers
 * ============================================================================ */

function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Lê o tema do cookie (default: dark) */
function getTheme(req) {
  return req.cookies?.theme === 'light' ? 'light' : 'dark';
}

/** Layout base com theme + toggle button */
function layout(title, body, active = '', theme = 'dark') {
  const links = [
    { href: '/',            label: 'Dashboard',  key: 'home' },
    { href: '/cursos',      label: 'Cursos',      key: 'cursos' },
    { href: '/disciplinas', label: 'Disciplinas', key: 'disciplinas' },
    { href: '/alunos',      label: 'Alunos',      key: 'alunos' },
    { href: '/matriculas',  label: 'Matrículas',  key: 'matriculas' },
    { href: '/schema',      label: 'ER Diagram',  key: 'schema' },
    { href: '/reports',     label: 'Relatórios',  key: 'reports' },
    { href: '/presentation',label: '▶ Apresentação', key: 'presentation' },
  ];
  const navHtml = links
    .map((l) => `<a href="${l.href}" class="${active === l.key ? 'active' : ''}">${l.label}</a>`)
    .join('');
  const themeIcon = theme === 'light' ? '☾' : '☀';
  const themeLabel = theme === 'light' ? 'Dark' : 'Light';

  return `<!DOCTYPE html>
<html lang="pt-BR" data-theme="${theme}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} — Sistema Universitário</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header>
    <h1>Universidade</h1>
    <nav>${navHtml}</nav>
    <form method="POST" action="/theme" style="margin:0">
      <button class="theme-toggle" type="submit" title="Mudar tema">${themeIcon}</button>
    </form>
  </header>
  <main>${body}</main>
  <footer>
    <small>Exercício Prático · SQL CRUD · ${new Date().getFullYear()} ·
    <a href="https://github.com/MamdouhAlsaodi/sql-university-crud" style="color:var(--accent)">GitHub</a>
    </small>
  </footer>
</body>
</html>`;
}

/** Toolbar de search/pagination reutilizável */
function toolbar(q, page, totalPages, baseUrl, extraParams = '') {
  const search = (q || '').replace(/"/g, '&quot;');
  return `
    <form method="GET" action="${baseUrl}" class="toolbar">
      <input class="search" name="q" value="${esc(search)}" placeholder="Buscar...">
      <button class="btn" type="submit">Buscar</button>
      ${q ? `<a class="btn" href="${baseUrl}${extraParams}">Limpar</a>` : ''}
    </form>
    <nav class="pager">
      ${page > 1
        ? `<a href="${baseUrl}?q=${encodeURIComponent(q || '')}&page=${page - 1}${extraParams}">‹</a>`
        : '<span>‹</span>'}
      ${Array.from({ length: totalPages }, (_, i) => i + 1)
        .map((p) =>
          p === page
            ? `<span class="current">${p}</span>`
            : `<a href="${baseUrl}?q=${encodeURIComponent(q || '')}&page=${p}${extraParams}">${p}</a>`,
        )
        .join('')}
      ${page < totalPages
        ? `<a href="${baseUrl}?q=${encodeURIComponent(q || '')}&page=${page + 1}${extraParams}">›</a>`
        : '<span>›</span>'}
    </nav>
  `;
}

/** Parse pagination params from request */
function paginate(req) {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const q = (req.query.q || '').trim();
  return { page, q, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE };
}

/** Build a WHERE clause for search */
function buildSearchWhere(q, fields) {
  if (!q) return { sql: '', params: [] };
  const parts = fields.map((f) => `${f} LIKE ?`).join(' OR ');
  return { sql: ` AND (${parts})`, params: fields.map(() => `%${q}%`) };
}

/* Theme toggle */
app.post('/theme', (req, res) => {
  const current = req.headers.referer || '/';
  const currentTheme = req.cookies?.theme === 'light' ? 'light' : 'dark';
  const next = currentTheme === 'light' ? 'dark' : 'light';
  res.cookie('theme', next, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false });
  res.redirect(current);
});

/* ============================================================================
 * GET /  — Dashboard
 * ============================================================================ */
app.get('/', async (req, res) => {
  try {
    const theme = getTheme(req);
    const [cursos, disciplinas, alunos, matriculas, reprovados, aprovados, aprovadosAvg] =
      await Promise.all([
        one('SELECT COUNT(*) AS n FROM Curso'),
        one('SELECT COUNT(*) AS n FROM Disciplina'),
        one('SELECT COUNT(*) AS n FROM Aluno'),
        one('SELECT COUNT(*) AS n FROM Matricula'),
        one("SELECT COUNT(*) AS n FROM Matricula WHERE status='REPROVADO'"),
        one("SELECT COUNT(*) AS n FROM Matricula WHERE status='APROVADO'"),
        one("SELECT ROUND(AVG(nota), 2) AS m FROM Matricula WHERE status='APROVADO'"),
      ]);

    const taxaAprovacao =
      matriculas.n > 0 ? Math.round((aprovados.n / matriculas.n) * 100) : 0;

    /* Chart data: alunos por curso */
    const alunosPorCurso = await many(`
      SELECT c.nome AS curso, COUNT(a.id) AS total
      FROM Curso c LEFT JOIN Aluno a ON a.curso_id = c.id
      GROUP BY c.id, c.nome
      ORDER BY total DESC
    `);
    const maxCurso = Math.max(...alunosPorCurso.map((r) => Number(r.total)), 1);
    const barsHtml = alunosPorCurso
      .map(
        (r) => `
        <div class="bar-row">
          <span class="bar-label">${esc(r.curso)}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${(Number(r.total) / maxCurso) * 100}%"></div>
          </div>
          <span class="bar-val">${r.total}</span>
        </div>`,
      )
      .join('');

    const body = `
      <h2>Dashboard</h2>
      <p class="hint">Visão geral do sistema · <code>university</code> · MySQL 8.0</p>

      <div class="kpis">
        ${kpi('Cursos', cursos.n)}
        ${kpi('Disciplinas', disciplinas.n)}
        ${kpi('Alunos', alunos.n)}
        ${kpi('Matrículas', matriculas.n)}
        ${kpi('Aprovadas', aprovados.n, 'ok')}
        ${kpi('Reprovadas', reprovados.n, 'danger')}
        ${kpi('Média aprovado', aprovadosAvg.m ?? '—')}
        ${kpi('Taxa aprovação', `${taxaAprovacao}%`, taxaAprovacao >= 70 ? 'ok' : taxaAprovacao >= 50 ? '' : 'warn')}
      </div>

      <h3>Alunos por curso</h3>
      <div class="table-wrap" style="padding: 18px;">
        <div class="bars">${barsHtml}</div>
      </div>

      <p class="hint" style="margin-top: 20px">
        Use o menu acima para navegar. Tente <a href="/reports?r=r3">/reports?r=r3</a>
        para ver a média de notas por disciplina, ou <a href="/schema">/schema</a> para o
        diagrama ER.
      </p>
    `;
    res.send(layout('Dashboard', body, 'home', theme));
  } catch (e) {
    res.status(500).send(layout('Erro', `<pre>${esc(e.message)}</pre>`, '', getTheme(req)));
  }
});

function kpi(label, n, tone = '') {
  return `<div class="kpi ${tone}"><div class="kpi-n">${n}</div><div class="kpi-l">${esc(label)}</div></div>`;
}

/* ============================================================================
 * /cursos  — list + create + search
 * ============================================================================ */
app.get('/cursos', async (req, res) => {
  try {
    const theme = getTheme(req);
    const { page, q, offset, limit } = paginate(req);

    const search = buildSearchWhere(q, ['nome']);
    const totalRow = await one(
      `SELECT COUNT(*) AS n FROM Curso WHERE 1=1${search.sql}`,
      search.params,
    );
    const total = Number(totalRow.n);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const rows = await many(
      `SELECT * FROM Curso WHERE 1=1${search.sql}
       ORDER BY nome LIMIT ? OFFSET ?`,
      [...search.params, limit, offset],
    );

    const trs = rows
      .map(
        (c) => `
      <tr>
        <td><code>#${c.id}</code></td>
        <td>${esc(c.nome)}</td>
        <td>${c.duracao} sem.</td>
      </tr>`,
      )
      .join('');

    const body = `
      <h2>Cursos</h2>
      <p class="hint">${total} curso(s) cadastrado(s).</p>
      ${toolbar(q, page, totalPages, '/cursos')}
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Nome</th><th>Duração</th></tr></thead>
          <tbody>${trs || '<tr><td colspan="3" class="empty">Nenhum curso encontrado.</td></tr>'}</tbody>
        </table>
      </div>
      <h3>Adicionar curso</h3>
      <form method="POST" action="/cursos" class="form">
        <label>Nome <input name="nome" required placeholder="Engenharia de Software"></label>
        <label>Duração (semestres) <input name="duracao" type="number" min="1" max="20" required value="8"></label>
        <button type="submit">Criar curso</button>
      </form>
    `;
    res.send(layout('Cursos', body, 'cursos', theme));
  } catch (e) {
    res.status(500).send(layout('Erro', `<pre>${esc(e.message)}</pre>`, '', getTheme(req)));
  }
});

app.post('/cursos', async (req, res) => {
  const { nome, duracao } = req.body;
  try {
    await query('INSERT INTO Curso (nome, duracao) VALUES (?, ?)', [nome, parseInt(duracao, 10)]);
    res.redirect('/cursos');
  } catch (e) {
    res.status(400).send(layout('Erro', `<p>${esc(e.message)}</p><a class="btn" href="/cursos">← Voltar</a>`, '', getTheme(req)));
  }
});

/* ============================================================================
 * /disciplinas
 * ============================================================================ */
app.get('/disciplinas', async (req, res) => {
  try {
    const theme = getTheme(req);
    const { page, q, offset, limit } = paginate(req);

    const search = buildSearchWhere(q, ['d.nome']);
    const totalRow = await one(
      `SELECT COUNT(*) AS n
       FROM Disciplina d
       INNER JOIN Curso c ON c.id = d.curso_id
       WHERE 1=1${search.sql}`,
      search.params,
    );
    const total = Number(totalRow.n);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const rows = await many(
      `SELECT d.*, c.nome AS curso_nome
       FROM Disciplina d
       INNER JOIN Curso c ON c.id = d.curso_id
       WHERE 1=1${search.sql}
       ORDER BY c.nome, d.nome
       LIMIT ? OFFSET ?`,
      [...search.params, limit, offset],
    );
    const cursos = await many('SELECT id, nome FROM Curso ORDER BY nome');

    const trs = rows
      .map(
        (d) => `
      <tr>
        <td><code>#${d.id}</code></td>
        <td>${esc(d.nome)}</td>
        <td>${esc(d.curso_nome)}</td>
        <td>${d.creditos}cr</td>
        <td>${d.carga_horaria}h</td>
      </tr>`,
      )
      .join('');

    const cursosOpts =
      `<option value="">— escolha —</option>` +
      cursos.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join('');

    const body = `
      <h2>Disciplinas</h2>
      <p class="hint">${total} disciplina(s).</p>
      ${toolbar(q, page, totalPages, '/disciplinas')}
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Nome</th><th>Curso</th><th>Créditos</th><th>Carga</th></tr></thead>
          <tbody>${trs || '<tr><td colspan="5" class="empty">Nenhuma.</td></tr>'}</tbody>
        </table>
      </div>
      <h3>Adicionar disciplina</h3>
      <form method="POST" action="/disciplinas" class="form">
        <label>Nome <input name="nome" required></label>
        <label>Curso
          <select name="curso_id" required>
            <option value="">— escolha —</option>
            ${cursosOpts}
          </select>
        </label>
        <label>Créditos <input name="creditos" type="number" min="1" max="12" required value="4"></label>
        <label>Carga horária <input name="carga_horaria" type="number" min="20" required value="80"></label>
        <button type="submit">Criar disciplina</button>
      </form>
    `;
    res.send(layout('Disciplinas', body, 'disciplinas', theme));
  } catch (e) {
    res.status(500).send(layout('Erro', `<pre>${esc(e.message)}</pre>`, '', getTheme(req)));
  }
});

app.post('/disciplinas', async (req, res) => {
  const { nome, curso_id, creditos, carga_horaria } = req.body;
  try {
    await query(
      'INSERT INTO Disciplina (nome, curso_id, creditos, carga_horaria) VALUES (?,?,?,?)',
      [nome, parseInt(curso_id, 10), parseInt(creditos, 10), parseInt(carga_horaria, 10)],
    );
    res.redirect('/disciplinas');
  } catch (e) {
    res.status(400).send(layout('Erro', `<p>${esc(e.message)}</p><a class="btn" href="/disciplinas">← Voltar</a>`, '', getTheme(req)));
  }
});

/* ============================================================================
 * /alunos
 * ============================================================================ */
app.get('/alunos', async (req, res) => {
  try {
    const theme = getTheme(req);
    const { page, q, offset, limit } = paginate(req);

    const search = buildSearchWhere(q, ['a.nome', 'a.email', 'a.matricula']);
    const totalRow = await one(
      `SELECT COUNT(*) AS n
       FROM Aluno a
       LEFT JOIN Curso c ON c.id = a.curso_id
       WHERE 1=1${search.sql}`,
      search.params,
    );
    const total = Number(totalRow.n);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const rows = await many(
      `SELECT a.*, COALESCE(c.nome, '(sem curso)') AS curso_nome
       FROM Aluno a
       LEFT JOIN Curso c ON c.id = a.curso_id
       WHERE 1=1${search.sql}
       ORDER BY a.matricula
       LIMIT ? OFFSET ?`,
      [...search.params, limit, offset],
    );
    const cursos = await many('SELECT id, nome FROM Curso ORDER BY nome');

    const trs = rows
      .map(
        (a) => `
      <tr>
        <td><code>${esc(a.matricula)}</code></td>
        <td>${esc(a.nome)}</td>
        <td>${esc(a.email)}</td>
        <td>${esc(a.curso_nome)}</td>
      </tr>`,
      )
      .join('');

    const cursosOpts =
      `<option value="">(sem curso)</option>` +
      cursos.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join('');

    const body = `
      <h2>Alunos</h2>
      <p class="hint">${total} aluno(s) cadastrado(s).</p>
      ${toolbar(q, page, totalPages, '/alunos')}
      <div class="table-wrap">
        <table>
          <thead><tr><th>Matrícula</th><th>Nome</th><th>Email</th><th>Curso</th></tr></thead>
          <tbody>${trs || '<tr><td colspan="4" class="empty">Nenhum aluno.</td></tr>'}</tbody>
        </table>
      </div>
      <h3>Adicionar aluno</h3>
      <form method="POST" action="/alunos" class="form">
        <label>Nome <input name="nome" required></label>
        <label>Email <input name="email" type="email" required></label>
        <label>Matrícula (nº) <input name="matricula" required pattern="[0-9]+"></label>
        <label>Curso
          <select name="curso_id">${cursosOpts}</select>
        </label>
        <button type="submit">Criar aluno</button>
      </form>
    `;
    res.send(layout('Alunos', body, 'alunos', theme));
  } catch (e) {
    res.status(500).send(layout('Erro', `<pre>${esc(e.message)}</pre>`, '', getTheme(req)));
  }
});

app.post('/alunos', async (req, res) => {
  const { nome, email, matricula, curso_id } = req.body;
  try {
    await query(
      'INSERT INTO Aluno (nome, email, matricula, curso_id) VALUES (?,?,?,?)',
      [nome, email, matricula, curso_id || null],
    );
    res.redirect('/alunos');
  } catch (e) {
    res.status(400).send(layout('Erro', `<p>${esc(e.message)}</p><a class="btn" href="/alunos">← Voltar</a>`, '', getTheme(req)));
  }
});

/* ============================================================================
 * /matriculas
 * ============================================================================ */
app.get('/matriculas', async (req, res) => {
  try {
    const theme = getTheme(req);
    const { page, q, offset, limit } = paginate(req);

    const search = buildSearchWhere(q, ['a.nome', 'd.nome', 'a.matricula']);
    const totalRow = await one(
      `SELECT COUNT(*) AS n
       FROM Matricula m
       INNER JOIN Aluno a ON a.id = m.aluno_id
       INNER JOIN Disciplina d ON d.id = m.disciplina_id
       WHERE 1=1${search.sql}`,
      search.params,
    );
    const total = Number(totalRow.n);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const rows = await many(
      `SELECT
        m.id, m.nota, m.status, m.created_at,
        a.nome AS aluno_nome, a.matricula AS aluno_matricula,
        d.nome AS disciplina_nome,
        c.nome AS curso_nome
       FROM Matricula m
       INNER JOIN Aluno a ON a.id = m.aluno_id
       INNER JOIN Disciplina d ON d.id = m.disciplina_id
       INNER JOIN Curso c ON c.id = d.curso_id
       WHERE 1=1${search.sql}
       ORDER BY a.nome, d.nome
       LIMIT ? OFFSET ?`,
      [...search.params, limit, offset],
    );
    const alunos = await many('SELECT id, nome, matricula FROM Aluno ORDER BY nome');
    const disciplinas = await many(`
      SELECT d.id, d.nome, c.nome AS curso_nome
      FROM Disciplina d
      INNER JOIN Curso c ON c.id = d.curso_id
      ORDER BY c.nome, d.nome
    `);

    const trs = rows
      .map(
        (m) => `
      <tr>
        <td><code>${esc(m.aluno_matricula)}</code> ${esc(m.aluno_nome)}</td>
        <td>${esc(m.disciplina_nome)} <small>(${esc(m.curso_nome)})</small></td>
        <td>${m.nota == null ? '—' : Number(m.nota).toFixed(2)}</td>
        <td><span class="badge ${esc(String(m.status).toLowerCase())}">${esc(m.status)}</span></td>
        <td>${m.created_at ? String(m.created_at).slice(0, 16).replace('T', ' ') : '—'}</td>
      </tr>`,
      )
      .join('');

    const alunosOpts = `<option value="">— escolha —</option>` + alunos.map((a) => `<option value="${a.id}">${esc(a.matricula)} · ${esc(a.nome)}</option>`).join('');
    const discOpts = `<option value="">— escolha —</option>` + disciplinas.map((d) => `<option value="${d.id}">${esc(d.nome)} (${esc(d.curso_nome)})</option>`).join('');

    const body = `
      <h2>Matrículas</h2>
      <p class="hint">${total} matrícula(s) · <small>Mostra o created_at (audit log)</small></p>
      ${toolbar(q, page, totalPages, '/matriculas')}
      <div class="table-wrap">
        <table>
          <thead><tr><th>Aluno</th><th>Disciplina</th><th>Nota</th><th>Status</th><th>Criado em</th></tr></thead>
          <tbody>${trs || '<tr><td colspan="5" class="empty">Nenhuma.</td></tr>'}</tbody>
        </table>
      </div>
      <h3>Matricular aluno</h3>
      <form method="POST" action="/matriculas" class="form">
        <label>Aluno
          <select name="aluno_id" required>${alunosOpts}</select>
        </label>
        <label>Disciplina
          <select name="disciplina_id" required>${discOpts}</select>
        </label>
        <label>Nota <small>(opcional, 0.00–10.00)</small>
          <input name="nota" type="number" step="0.01" min="0" max="10" placeholder="ex: 8.5">
        </label>
        <label>Status
          <select name="status">
            <option value="CURSANDO">CURSANDO</option>
            <option value="APROVADO">APROVADO</option>
            <option value="REPROVADO">REPROVADO</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>
        </label>
        <button type="submit">Criar matrícula</button>
      </form>
    `;
    res.send(layout('Matrículas', body, 'matriculas', theme));
  } catch (e) {
    res.status(500).send(layout('Erro', `<pre>${esc(e.message)}</pre>`, '', getTheme(req)));
  }
});

app.post('/matriculas', async (req, res) => {
  const { aluno_id, disciplina_id, nota, status } = req.body;
  try {
    const notaVal = nota === '' || nota == null ? null : parseFloat(nota);
    await query(
      'INSERT INTO Matricula (aluno_id, disciplina_id, nota, status) VALUES (?,?,?,?)',
      [aluno_id, disciplina_id, notaVal, status || 'CURSANDO'],
    );
    res.redirect('/matriculas');
  } catch (e) {
    res.status(400).send(layout('Erro', `<p>${esc(e.message)}</p><a class="btn" href="/matriculas">← Voltar</a>`, '', getTheme(req)));
  }
});

/* ============================================================================
 * /schema  — ER diagram auto-gerado
 * ============================================================================ */
app.get('/schema', async (req, res) => {
  try {
    const theme = getTheme(req);
    const tables = await many(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `);
    const byTable = {};
    for (const row of tables) {
      if (!byTable[row.TABLE_NAME]) byTable[row.TABLE_NAME] = [];
      byTable[row.TABLE_NAME].push(row);
    }
    const fks = await many(`
      SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    /* Layout: place tables in a grid */
    const positions = {
      Curso:      { x: 60,  y: 80 },
      Disciplina: { x: 380, y: 80 },
      Aluno:      { x: 60,  y: 290 },
      Matricula:  { x: 380, y: 290 },
    };
    const widths = {
      Curso: 240, Disciplina: 280, Aluno: 240, Matricula: 320,
    };
    const w = 760;
    const h = 510;

    /* Render each table as an SVG <g> */
    const tableSvg = Object.keys(byTable)
      .map((name) => {
        const p = positions[name] || { x: 60, y: 80 };
        const tw = widths[name] || 240;
        const rows = byTable[name];
        const rowH = 22;
        const headH = 30;
        const totalH = headH + rows.length * rowH + 6;
        const colsHtml = rows
          .map(
            (c, i) => `
              <rect x="0" y="${headH + i * rowH}" width="${tw}" height="${rowH}" fill="${theme === 'dark' ? '#0f1419' : '#f9fafb'}" />
              <text x="10" y="${headH + i * rowH + 15}" font-size="11" font-family="ui-monospace, monospace" fill="${theme === 'dark' ? '#e6e9ef' : '#0f172a'}">${esc(c.COLUMN_NAME)}${
              c.COLUMN_KEY === 'PRI' ? ' 🔑' : ''
            }${c.IS_NULLABLE === 'NO' && c.COLUMN_KEY !== 'PRI' ? ' *' : ''}</text>
            `,
          )
          .join('');
        return `
          <g transform="translate(${p.x}, ${p.y})">
            <rect width="${tw}" height="${totalH}" rx="6" fill="${theme === 'dark' ? '#141923' : '#ffffff'}" stroke="${theme === 'dark' ? '#4ec9b0' : '#0d9488'}" stroke-width="1.5"/>
            <rect width="${tw}" height="${headH}" rx="6" fill="${theme === 'dark' ? '#4ec9b0' : '#0d9488'}"/>
            <text x="12" y="20" font-size="13" font-weight="700" fill="${theme === 'dark' ? '#0a0e14' : '#ffffff'}">${esc(name)}</text>
            ${colsHtml}
          </g>`;
      })
      .join('');

    /* FK lines */
    const fkLines = fks
      .map((fk) => {
        const from = positions[fk.TABLE_NAME];
        const to = positions[fk.REFERENCED_TABLE_NAME];
        if (!from || !to) return '';
        const fromW = widths[fk.TABLE_NAME] || 240;
        const fromH = (byTable[fk.TABLE_NAME]?.length || 0) * 22 + 36;
        const toW = widths[fk.REFERENCED_TABLE_NAME] || 240;
        /* from-bottom or from-right depending on relative position */
        const x1 = from.x + fromW;
        const y1 = from.y + fromH / 2;
        const x2 = to.x;
        const y2 = to.y + 30;
        const stroke = theme === 'dark' ? '#58a6ff' : '#2563eb';
        return `<path d="M${x1},${y1} C${x1 + 60},${y1} ${x2 - 60},${y2} ${x2},${y2}" stroke="${stroke}" stroke-width="1.5" fill="none" marker-end="url(#arr)"/>
                <text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 4}" text-anchor="middle" font-size="9" fill="${stroke}">${esc(fk.COLUMN_NAME)} → ${esc(fk.REFERENCED_COLUMN_NAME)}</text>`;
      })
      .join('');

    const svg = `
      <svg viewBox="0 0 ${w} ${h}" width="100%" style="background: ${theme === 'dark' ? '#0a0e14' : '#f9fafb'}; border-radius: 12px;">
        <defs>
          <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="${theme === 'dark' ? '#58a6ff' : '#2563eb'}"/>
          </marker>
        </defs>
        ${fkLines}
        ${tableSvg}
      </svg>
    `;

    const body = `
      <h2>Diagrama Entidade-Relacionamento</h2>
      <p class="hint">
        Gerado dinamicamente a partir do <code>information_schema</code> do MySQL.
        <br>
        <code>🔑</code> = PRIMARY KEY &nbsp;·&nbsp;
        <code>*</code> = NOT NULL &nbsp;·&nbsp;
        Setas representam Foreign Keys
      </p>
      ${svg}
      <h3>Resumo</h3>
      <div class="kpis">
        ${Object.keys(byTable)
          .map((name) => kpi(name, byTable[name].length))
          .join('')}
      </div>
    `;
    res.send(layout('Schema', body, 'schema', theme));
  } catch (e) {
    res.status(500).send(layout('Erro', `<pre>${esc(e.message)}</pre>`, '', getTheme(req)));
  }
});

/* ============================================================================
 * /reports  — executa queries do script 03 + CSV export
 * ============================================================================ */
const REPORTS = [
  { key: 'r1', title: 'Alunos + curso (LEFT JOIN)', file: 'R1' },
  { key: 'r2', title: 'Contagem de alunos por curso (GROUP BY)', file: 'R2' },
  { key: 'r3', title: 'Média de notas por disciplina', file: 'R3' },
  { key: 'r4', title: 'Top performers (média de aprovados ≥ 2)', file: 'R4' },
  { key: 'r5', title: 'Alunos reprovados', file: 'R5' },
  { key: 'r6', title: 'Carga horária total por aluno', file: 'R6' },
  { key: 'r7', title: 'Disciplinas sem matrículas', file: 'R7' },
  { key: 'r8', title: 'Resumo por status', file: 'R8' },
];

/* CSV download */
app.get('/reports.csv', async (req, res) => {
  const r = req.query.r;
  const report = REPORTS.find((x) => x.key === r);
  if (!report) return res.status(404).send('Not found');

  const sql = extractReportSql(report.file);
  if (!sql) return res.status(500).send('Could not extract SQL');

  const rows = await many(sql);
  if (rows.length === 0) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${report.key}.csv"`);
    return res.send('(empty result set)');
  }
  const cols = Object.keys(rows[0]);
  const csv = [
    cols.join(','),
    ...rows.map((r) =>
      cols
        .map((c) => {
          const v = r[c] == null ? '' : r[c];
          const s = String(v).replace(/"/g, '""');
          return /[,"\n]/.test(s) ? `"${s}"` : s;
        })
        .join(','),
    ),
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${report.key}.csv"`);
  res.send(csv);
});

/** Helper: extract a report's SQL from the script file. */
function extractReportSql(reportFile) {
  const sql = fs.readFileSync(path.join(__dirname, 'sql/03_query_reports.sql'), 'utf-8');
  const lines = sql.split('\n');
  const headerRe = new RegExp(`^--\\s*${reportFile}\\s*:`, 'im');
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (headerRe.test(lines[i])) { startIdx = i; break; }
  }
  if (startIdx < 0) return null;
  const nextRe = /^--\s*R\d+\s*:/im;
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (nextRe.test(lines[i])) { endIdx = i; break; }
  }
  /* strip leading comment lines */
  return lines
    .slice(startIdx + 1, endIdx)
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .trim();
}

app.get('/reports', async (req, res) => {
  const theme = getTheme(req);
  const selected = req.query.r;

  if (!selected) {
    const cards = REPORTS
      .map(
        (r) => `
        <a class="card" href="/reports?r=${r.key}">
          <strong>${r.file} · ${esc(r.title)}</strong>
          <span>JOIN + agregações · clique para abrir</span>
        </a>`,
      )
      .join('');
    const body = `
      <h2>Relatórios SQL</h2>
      <p class="hint">${REPORTS.length} consultas prontas. Cada relatório mostra o SQL executado, o resultado em tabela, e oferece download em CSV.</p>
      <div class="grid">${cards}</div>
    `;
    return res.send(layout('Relatórios', body, 'reports', theme));
  }

  const report = REPORTS.find((r) => r.key === selected);
  if (!report) return res.status(404).send(layout('404', '<p>Relatório não encontrado.</p>', '', theme));

  try {
    const querySql = extractReportSql(report.file);
    if (!querySql) {
      return res
        .status(500)
        .send(layout('Erro', `<p>Não foi possível extrair o SQL de ${report.file}.</p>`, '', theme));
    }
    const t0 = Date.now();
    const rows = await many(querySql);
    const ms = Date.now() - t0;

    const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
    const thead = cols.map((c) => `<th>${esc(c)}</th>`).join('');
    const tbody = rows
      .map(
        (r) => `
        <tr>${cols
          .map((c) => {
            const v = r[c];
            return `<td>${v === null ? '<em>null</em>' : esc(v)}</td>`;
          })
          .join('')}</tr>`,
      )
      .join('');

    const body = `
      <h2>${esc(report.title)}</h2>
      <p class="hint">
        <a class="btn" href="/reports">← Todos</a>
        <a class="btn btn-primary" href="/reports.csv?r=${report.key}">↓ Baixar CSV</a>
        · ${rows.length} linha(s) · ${ms}ms
      </p>
      <details open><summary>SQL executado</summary>
        <pre class="sql">${esc(querySql)}</pre>
      </details>
      <div class="table-wrap">
        <table>
          <thead><tr>${thead}</tr></thead>
          <tbody>${tbody || `<tr><td colspan="0" class="empty">Sem resultados.</td></tr>`}</tbody>
        </table>
      </div>
    `;
    res.send(layout(report.file + ' — ' + report.title, body, 'reports', theme));
  } catch (e) {
    res
      .status(500)
      .send(layout('Erro', `<pre>${esc(e.message)}</pre><p>SQL: <code>${esc(querySql || '')}</code></p>`, '', theme));
  }
});

/* ============================================================================
 * /presentation — auto-generated slide deck viewer
 * Reads SLIDES.md and serves it as a self-contained HTML presentation.
 * Auto-plays through 15 slides in ~2 minutes (or navigate manually).
 * ============================================================================ */
app.get('/presentation', (req, res) => {
  const template = fs.readFileSync(
    path.join(__dirname, 'presentation/auto-slides.html.template'),
    'utf-8',
  );
  const slides = fs.readFileSync(
    path.join(__dirname, 'presentation/SLIDES.md'),
    'utf-8',
  );
  /* Escape only backticks so the JS template literal in the HTML
   * doesn't break. We keep ${} intact — they're part of the JS code
   * that should evaluate at runtime. */
  const safe = slides.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
  const html = template.replace('__MARKDOWN_CONTENT__', safe);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

/* ============================================================================
 * Start
 * ============================================================================ */
app.listen(PORT, () => {
  console.log(`✓ Server listening on http://localhost:${PORT}`);
  console.log(`✓ Presentation deck: http://localhost:${PORT}/presentation`);
});