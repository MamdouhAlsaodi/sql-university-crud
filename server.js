/**
 * Servidor Express para o exercício prático.
 *
 * Rotas:
 *   GET  /                    Dashboard com KPIs
 *   GET  /cursos              Lista de cursos + form de adicionar
 *   POST /cursos              Cria um curso (form action)
 *   GET  /disciplinas         Lista de disciplinas + form
 *   POST /disciplinas         Cria uma disciplina
 *   GET  /alunos              Lista de alunos + form
 *   POST /alunos              Cria um aluno
 *   GET  /matriculas          Lista com JOIN (relatório principal)
 *   POST /matriculas          Cria matrícula
 *   GET  /reports             Lista de relatórios SQL prontos
 *
 * Renderização: server-side via template strings — sem dependência de
 * template engine (a exercício pede simplicidade).
 */
const express = require('express');
const path = require('path');
const { query, one, many } = require('./db');

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* Pequena "navbar" inline — DRY em todas as páginas */
function layout(title, body, active = '') {
  const links = [
    { href: '/',           label: 'Dashboard',  key: 'home' },
    { href: '/cursos',     label: 'Cursos',      key: 'cursos' },
    { href: '/disciplinas',label: 'Disciplinas', key: 'disciplinas' },
    { href: '/alunos',     label: 'Alunos',      key: 'alunos' },
    { href: '/matriculas', label: 'Matrículas',  key: 'matriculas' },
    { href: '/reports',    label: 'Relatórios',  key: 'reports' },
  ];
  const navHtml = links
    .map((l) =>
      `<a href="${l.href}" class="${active === l.key ? 'active' : ''}">${l.label}</a>`,
    )
    .join('');
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${title} — Sistema Universitário</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header>
    <h1>Sistema Universitário</h1>
    <nav>${navHtml}</nav>
  </header>
  <main>${body}</main>
  <footer><small>Exercício Prático · SQL CRUD · ${new Date().getFullYear()}</small></footer>
</body>
</html>`;
}

/* Helper de escape — básico mas suficiente para evitar injeção HTML
 * em formulários que renderizam valores do banco. */
function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================================================
 * GET /  — Dashboard
 * ============================================================================ */
app.get('/', async (req, res) => {
  try {
    const [cursos, disciplinas, alunos, matriculas, reprovados, aprovados] =
      await Promise.all([
        one('SELECT COUNT(*)::int AS n FROM "Curso"'),
        one('SELECT COUNT(*)::int AS n FROM "Disciplina"'),
        one('SELECT COUNT(*)::int AS n FROM "Aluno"'),
        one('SELECT COUNT(*)::int AS n FROM "Matricula"'),
        one("SELECT COUNT(*)::int AS n FROM \"Matricula\" WHERE status='REPROVADO'"),
        one("SELECT COUNT(*)::int AS n FROM \"Matricula\" WHERE status='APROVADO'"),
      ]);

    const body = `
      <h2>Dashboard</h2>
      <div class="kpis">
        ${kpi('Cursos', cursos.n)}
        ${kpi('Disciplinas', disciplinas.n)}
        ${kpi('Alunos', alunos.n)}
        ${kpi('Matrículas', matriculas.n)}
        ${kpi('Aprovadas', aprovados.n, 'ok')}
        ${kpi('Reprovadas', reprovados.n, 'warn')}
      </div>
      <p class="hint">
        Conexão ativa com Postgres. Use o menu acima para navegar pelas
        tabelas ou ver os relatórios SQL prontos em <a href="/reports">/reports</a>.
      </p>
    `;
    res.send(layout('Dashboard', body, 'home'));
  } catch (e) {
    res.status(500).send(layout('Erro', `<pre>${esc(e.message)}\n\n${esc(e.stack)}</pre>`));
  }
});

function kpi(label, n, tone = '') {
  return `<div class="kpi ${tone}"><div class="kpi-n">${n}</div><div class="kpi-l">${label}</div></div>`;
}

/* ============================================================================
 * /cursos
 * ============================================================================ */
app.get('/cursos', async (req, res) => {
  try {
    const cursos = await many('SELECT * FROM "Curso" ORDER BY nome');
    const rows = cursos
      .map(
        (c) => `
      <tr>
        <td><code>${esc(c.id)}</code></td>
        <td>${esc(c.nome)}</td>
        <td>${c.duracao} semestres</td>
        <td>${esc(c.created_at.toISOString().slice(0, 10))}</td>
      </tr>`,
      )
      .join('');
    const body = `
      <h2>Cursos</h2>
      <p class="hint">${cursos.length} curso(s) cadastrado(s).</p>
      <table>
        <thead><tr><th>ID</th><th>Nome</th><th>Duração</th><th>Criado em</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4">Nenhum curso cadastrado.</td></tr>'}</tbody>
      </table>

      <h3>Adicionar curso</h3>
      <form method="POST" action="/cursos" class="form">
        <label>ID <small>(slug, ex: curso-eng)</small>
          <input name="id" required pattern="[a-z0-9-]+" placeholder="curso-eng">
        </label>
        <label>Nome <input name="nome" required placeholder="Engenharia de Software"></label>
        <label>Duração (semestres) <input name="duracao" type="number" min="1" max="20" required value="8"></label>
        <button type="submit">Criar curso</button>
      </form>
    `;
    res.send(layout('Cursos', body, 'cursos'));
  } catch (e) {
    res.status(500).send(layout('Erro', `<pre>${esc(e.message)}</pre>`));
  }
});

app.post('/cursos', async (req, res) => {
  const { id, nome, duracao } = req.body;
  try {
    await query(
      'INSERT INTO "Curso" (id, nome, duracao) VALUES ($1, $2, $3)',
      [id, nome, parseInt(duracao, 10)],
    );
    res.redirect('/cursos');
  } catch (e) {
    res
      .status(400)
      .send(layout('Erro', `<p>Falha ao criar curso: ${esc(e.message)}</p><a href="/cursos">← Voltar</a>`));
  }
});

/* ============================================================================
 * /disciplinas
 * ============================================================================ */
app.get('/disciplinas', async (req, res) => {
  try {
    const rows = await many(`
      SELECT d.*, c.nome AS curso_nome
      FROM "Disciplina" d
      INNER JOIN "Curso" c ON c.id = d.curso_id
      ORDER BY c.nome, d.nome
    `);
    const cursos = await many('SELECT id, nome FROM "Curso" ORDER BY nome');
    const html = rows
      .map(
        (d) => `
      <tr>
        <td><code>${esc(d.id)}</code></td>
        <td>${esc(d.nome)}</td>
        <td>${esc(d.curso_nome)}</td>
        <td>${d.creditos} créd.</td>
        <td>${d.carga_horaria}h</td>
      </tr>`,
      )
      .join('');
    const cursosOptions = cursos
      .map((c) => `<option value="${esc(c.id)}">${esc(c.nome)}</option>`)
      .join('');
    const body = `
      <h2>Disciplinas</h2>
      <p class="hint">${rows.length} disciplina(s).</p>
      <table>
        <thead><tr><th>ID</th><th>Nome</th><th>Curso</th><th>Créditos</th><th>Carga</th></tr></thead>
        <tbody>${html || '<tr><td colspan="5">Nenhuma.</td></tr>'}</tbody>
      </table>

      <h3>Adicionar disciplina</h3>
      <form method="POST" action="/disciplinas" class="form">
        <label>ID <input name="id" required pattern="[a-z0-9-]+" placeholder="disc-eng-1"></label>
        <label>Nome <input name="nome" required></label>
        <label>Curso
          <select name="curso_id" required>
            <option value="">— escolha —</option>
            ${cursosOptions}
          </select>
        </label>
        <label>Créditos <input name="creditos" type="number" min="1" max="12" required value="4"></label>
        <label>Carga horária <input name="carga_horaria" type="number" min="20" required value="80"></label>
        <button type="submit">Criar disciplina</button>
      </form>
    `;
    res.send(layout('Disciplinas', body, 'disciplinas'));
  } catch (e) {
    res.status(500).send(layout('Erro', `<pre>${esc(e.message)}</pre>`));
  }
});

app.post('/disciplinas', async (req, res) => {
  const { id, nome, curso_id, creditos, carga_horaria } = req.body;
  try {
    await query(
      'INSERT INTO "Disciplina" (id, nome, curso_id, creditos, carga_horaria) VALUES ($1,$2,$3,$4,$5)',
      [id, nome, curso_id, parseInt(creditos, 10), parseInt(carga_horaria, 10)],
    );
    res.redirect('/disciplinas');
  } catch (e) {
    res.status(400).send(layout('Erro', `<p>${esc(e.message)}</p><a href="/disciplinas">← Voltar</a>`));
  }
});

/* ============================================================================
 * /alunos
 * ============================================================================ */
app.get('/alunos', async (req, res) => {
  try {
    const rows = await many(`
      SELECT a.*, COALESCE(c.nome, '(sem curso)') AS curso_nome
      FROM "Aluno" a
      LEFT JOIN "Curso" c ON c.id = a.curso_id
      ORDER BY a.matricula
    `);
    const cursos = await many('SELECT id, nome FROM "Curso" ORDER BY nome');
    const html = rows
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
    const cursosOptions =
      `<option value="">(sem curso)</option>` +
      cursos.map((c) => `<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join('');
    const body = `
      <h2>Alunos</h2>
      <p class="hint">${rows.length} aluno(s) matriculado(s).</p>
      <table>
        <thead><tr><th>Matrícula</th><th>Nome</th><th>Email</th><th>Curso</th></tr></thead>
        <tbody>${html}</tbody>
      </table>

      <h3>Adicionar aluno</h3>
      <form method="POST" action="/alunos" class="form">
        <label>ID <input name="id" required pattern="[a-z0-9-]+" placeholder="aluno-011"></label>
        <label>Nome <input name="nome" required></label>
        <label>Email <input name="email" type="email" required></label>
        <label>Matrícula (nº) <input name="matricula" required pattern="[0-9]+" placeholder="2024011"></label>
        <label>Curso
          <select name="curso_id">${cursosOptions}</select>
        </label>
        <button type="submit">Criar aluno</button>
      </form>
    `;
    res.send(layout('Alunos', body, 'alunos'));
  } catch (e) {
    res.status(500).send(layout('Erro', `<pre>${esc(e.message)}</pre>`));
  }
});

app.post('/alunos', async (req, res) => {
  const { id, nome, email, matricula, curso_id } = req.body;
  try {
    await query(
      'INSERT INTO "Aluno" (id, nome, email, matricula, curso_id) VALUES ($1,$2,$3,$4,$5)',
      [id, nome, email, matricula, curso_id || null],
    );
    res.redirect('/alunos');
  } catch (e) {
    res.status(400).send(layout('Erro', `<p>${esc(e.message)}</p><a href="/alunos">← Voltar</a>`));
  }
});

/* ============================================================================
 * /matriculas — list com JOIN + form
 * ============================================================================ */
app.get('/matriculas', async (req, res) => {
  try {
    const rows = await many(`
      SELECT
        m.id, m.nota, m.status,
        a.nome AS aluno_nome, a.matricula AS aluno_matricula,
        d.nome AS disciplina_nome,
        c.nome AS curso_nome
      FROM "Matricula" m
      INNER JOIN "Aluno"      a ON a.id = m.aluno_id
      INNER JOIN "Disciplina" d ON d.id = m.disciplina_id
      INNER JOIN "Curso"      c ON c.id = d.curso_id
      ORDER BY a.nome, d.nome
    `);
    const alunos = await many('SELECT id, nome, matricula FROM "Aluno" ORDER BY nome');
    const disciplinas = await many(`
      SELECT d.id, d.nome, c.nome AS curso_nome
      FROM "Disciplina" d
      INNER JOIN "Curso" c ON c.id = d.curso_id
      ORDER BY c.nome, d.nome
    `);
    const html = rows
      .map(
        (m) => `
      <tr>
        <td><code>${esc(m.aluno_matricula)}</code> ${esc(m.aluno_nome)}</td>
        <td>${esc(m.disciplina_nome)} <small>(${esc(m.curso_nome)})</small></td>
        <td>${m.nota == null ? '—' : Number(m.nota).toFixed(2)}</td>
        <td><span class="badge ${esc(m.status.toLowerCase())}">${esc(m.status)}</span></td>
      </tr>`,
      )
      .join('');
    const alunosOptions =
      `<option value="">— escolha —</option>` +
      alunos
        .map((a) => `<option value="${esc(a.id)}">${esc(a.matricula)} · ${esc(a.nome)}</option>`)
        .join('');
    const discOptions =
      `<option value="">— escolha —</option>` +
      disciplinas
        .map((d) => `<option value="${esc(d.id)}">${esc(d.nome)} (${esc(d.curso_nome)})</option>`)
        .join('');
    const body = `
      <h2>Matrículas</h2>
      <p class="hint">${rows.length} matrícula(s).</p>
      <table>
        <thead><tr><th>Aluno</th><th>Disciplina</th><th>Nota</th><th>Status</th></tr></thead>
        <tbody>${html || '<tr><td colspan="4">Nenhuma.</td></tr>'}</tbody>
      </table>

      <h3>Matricular aluno</h3>
      <form method="POST" action="/matriculas" class="form">
        <label>Aluno
          <select name="aluno_id" required>${alunosOptions}</select>
        </label>
        <label>Disciplina
          <select name="disciplina_id" required>${discOptions}</select>
        </label>
        <label>Nota <small>(opcional)</small>
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
    res.send(layout('Matrículas', body, 'matriculas'));
  } catch (e) {
    res.status(500).send(layout('Erro', `<pre>${esc(e.message)}</pre>`));
  }
});

app.post('/matriculas', async (req, res) => {
  const { aluno_id, disciplina_id, nota, status } = req.body;
  try {
    const id = `mat-${Date.now().toString(36)}`;
    const notaVal = nota === '' || nota == null ? null : parseFloat(nota);
    await query(
      'INSERT INTO "Matricula" (id, aluno_id, disciplina_id, nota, status) VALUES ($1,$2,$3,$4,$5)',
      [id, aluno_id, disciplina_id, notaVal, status || 'CURSANDO'],
    );
    res.redirect('/matriculas');
  } catch (e) {
    res.status(400).send(layout('Erro', `<p>${esc(e.message)}</p><a href="/matriculas">← Voltar</a>`));
  }
});

/* ============================================================================
 * /reports — executa as queries do script 03
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

app.get('/reports', async (req, res) => {
  const selected = req.query.r;
  if (!selected) {
    const cards = REPORTS
      .map(
        (r) =>
          `<a class="card" href="/reports?r=${r.key}"><strong>R${r.key.toUpperCase()}</strong><span>${esc(r.title)}</span></a>`,
      )
      .join('');
    const body = `<h2>Relatórios SQL</h2><p class="hint">${REPORTS.length} consultas prontas (script 03).</p><div class="grid">${cards}</div>`;
    return res.send(layout('Relatórios', body, 'reports'));
  }
  const report = REPORTS.find((r) => r.key === selected);
  if (!report) return res.status(404).send(layout('404', '<p>Relatório não encontrado.</p>'));

  try {
    const sql = require('fs').readFileSync(
      path.join(__dirname, 'sql/03_query_reports.sql'),
      'utf-8',
    );
    /* Extrai o bloco do relatório entre `-- R{n}:` e o próximo `--` */
    const regex = new RegExp(`--\\s*${report.file}:[\\s\\S]*?(?=\\n--|\\Z)`);
    const match = sql.match(regex);
    const querySql = match ? match[0].split('\n').slice(1).join('\n').trim() : '-- not found';

    const t0 = Date.now();
    const rows = await many(querySql);
    const ms = Date.now() - t0;

    const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
    const thead = cols.map((c) => `<th>${esc(c)}</th>`).join('');
    const tbody = rows
      .map(
        (r) =>
          `<tr>${cols
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
        <a href="/reports">← Todos os relatórios</a>
        · ${rows.length} linha(s)
        · ${ms}ms
      </p>
      <details open><summary>SQL executado</summary>
        <pre class="sql">${esc(querySql)}</pre>
      </details>
      <table>
        <thead><tr>${thead}</tr></thead>
        <tbody>${tbody || '<tr><td colspan="0">Sem resultados.</td></tr>'}</tbody>
      </table>
    `;
    res.send(layout('Relatório', body, 'reports'));
  } catch (e) {
    res.status(500).send(layout('Erro', `<pre>${esc(e.message)}</pre>`));
  }
});

/* ============================================================================
 * Start
 * ============================================================================ */
app.listen(PORT, () => {
  console.log(`✓ Server listening on http://localhost:${PORT}`);
});