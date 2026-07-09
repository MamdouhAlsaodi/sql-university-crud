# خطة التنفيذ — SQL University CRUD

> **معرّف المشروع:** `sql-university-crud`
> **المسار:** `/home/server/projects/sql-university-crud`
> **الحالة:** منجزة ✅
> **تاريخ التسليم:** 2026-07-08
> **الـ GitHub:** https://github.com/MamdouhAlsaodi/sql-university-crud

---

## 🎯 الهدف العام

تنفيذ **Exercício Prático — Criação e Manipulação de Tabelas SQL** المطلوب في مادة Banco de Dados I. المطلوب: تصميم 4 جداول مترابطة، تعريف علاقات (PK/FK)، إدخال بيانات، وتنفيذ سكربتات SQL — مع تطبيق ويب يتصل بقاعدة البيانات عبر ODBC/port/login/password.

ما يميّز هذا المشروع عن CRUD عادي:
- 🌗 Dark / Light mode (نادر في تمارين SQL)
- 🔍 Search server-side في كل قائمة
- 📄 Pagination في كل list
- 📊 Mini bar chart في Dashboard
- ⬇️ CSV download لكل تقرير
- 🗺️ ER Diagram auto-gerado
- 📅 Audit log (created_at visible)
- 🎨 Glassmorphism dark theme

---

## 📐 النطاق (In Scope)

- ✅ 4 جداول: Curso, Disciplina, Aluno, Matricula
- ✅ PK, FK مع ON DELETE CASCADE/SET NULL, UNIQUE composta, CHECK
- ✅ Seed: 3 cursos + 9 disciplinas + 10 alunos + 20 matrículas
- ✅ 8 تقارير SQL (LEFT JOIN, GROUP BY, HAVING, agregações)
- ✅ تطبيق Express + EJS-style rendering
- ✅ Dark/Light mode toggle مع cookie persistence
- ✅ Search LIKE parametrizado في كل lista
- ✅ Pagination 10/pg مع prev/next
- ✅ CSV download عبر Content-Disposition
- ✅ ER Diagram SVG auto-gerado من `information_schema`
- ✅ Mini bar chart SVG inline (sem libs externas)
- ✅ npm scripts: db:create / db:seed / db:reports / db:reset
- ✅ Helmet-style .env.example sem secrets
- ✅ Documentação completa em PT-BR

---

## 🚫 خارج النطاق (Out of Scope)

- ❌ **Stripe Connect payouts** — professora pediu apenas SQL CRUD
- ❌ **WebSocket real-time** — REST polling a cada 30s é suficiente para exercício
- ❌ **Multi-tenancy** — projeto single-tenant (single DB)
- ❌ **OAuth / SAML** — autenticação simples com email+password (não requerida)
- ❌ **TailwindCSS** — CSS variables puro (mais didático para o professor)
- ❌ **i18n** — interface em PT-BR apenas

---

## 🛠️ التقنيات

| Camada | Tecnologia | Por que |
|---|---|---|
| **Runtime** | Node.js 18+ | Padrão acadêmico |
| **HTTP** | Express 4 | Simples, didático |
| **Database** | MySQL 8 / MariaDB 10+ | Pedido pela professora |
| **Driver** | `mysql2` (libmysqlclient nativo) | Equivalente a ODBC, mais simples no Node |
| **Config** | `dotenv` | Lê `.env` automaticamente |
| **Theme persistence** | `cookie-parser` | Para lembrar do dark/light |
| **CSS** | Variables + glassmorphism | Sem Tailwind, didático |
| **Slides** | HTML + CSS + JS puros | Sem framework, funciona offline |

---

## 🗺️ المراحل

- [x] **المرحلة 0 — Setup** (30 min) ✅
  - Init project, `package.json`, `.gitignore`, dependencies
  - Clonar projeto no Arch (100.98.208.99)

- [x] **المرحلة 1 — Schema SQL** (45 min) ✅
  - 4 tabelas: Curso, Disciplina, Aluno, Matricula
  - Constraints: PK, FK (CASCADE/SET NULL), UNIQUE, CHECK
  - `ENGINE=InnoDB`, `utf8mb4`

- [x] **المرحلة 2 — Seed Data** (20 min) ✅
  - 3 cursos, 9 disciplinas, 10 alunos, 20 matrículas
  - Subqueries para resolver FKs (idempotente)

- [x] **المرحلة 3 — Query Reports** (30 min) ✅
  - R1: Alunos + curso (LEFT JOIN)
  - R2: Contagem por curso (GROUP BY)
  - R3: Média de notas por disciplina (CASE WHEN)
  - R4: Top performers (HAVING)
  - R5: Reprovados
  - R6: Carga horária total (SUM)
  - R7: Disciplinas sem matrículas (LEFT JOIN WHERE NULL)
  - R8: Resumo por status

- [x] **المرحلة 4 — Web App (CRUD básico)** (45 min) ✅
  - `server.js` com Express
  - 6 rotas: GET/POST para cada tabela
  - `db.js` com mysql2 pool
  - `.env.example`

- [x] **المرحلة 5 — UI Differentials** (60 min) ✅
  - Dark/light mode com cookie
  - Search LIKE parametrizado
  - Pagination 10/pg
  - 8 KPIs semânticas com classes CSS
  - Mini bar chart SVG inline

- [x] **المرحلة 6 — Reports + CSV + ER Diagram** (45 min) ✅
  - `/reports.csv?r=R3` download
  - `/schema` ER Diagram auto-gerado
  - SQL extraction from `03_query_reports.sql`

- [x] **المرحلة 7 — Slide Deck** (30 min) ✅
  - `presentation/SLIDES.md` (13 slides)
  - `presentation/auto-slides.html.template` (interactive viewer)
  - `/presentation` route in app

- [x] **المرحلة 8 — Deploy + GitHub** (30 min) ✅
  - Push para `MamdouhAlsaodi/sql-university-crud`
  - 5 commits limpos
  - README + .env.example
  - Scripts helper em `scripts/`

---

## 🐛 Bug encontrado e corrigido (2026-07-08)

**Sintoma:** `npm run db:create` falhava em DB vazio com `Table 'university.Curso' doesn't exist`.

**Causa raiz:** `01_create_schema.sql` usava `TRUNCATE TABLE Matricula` no início. TRUNCATE abortava todo o script porque a tabela não existia ainda.

**Fix:** Substituir `TRUNCATE` por `DROP TABLE IF EXISTS` (idempotente).

**Commit:** `59dbc86`

---

## 📊 Métricas finais

| Métrica | Valor |
|---|---|
| Commits | 5 |
| Linhas de SQL | ~290 |
| Linhas de JS | ~840 |
| Linhas de CSS | ~580 |
| Tabelas | 4 |
| Registros seed | 42 |
| Reports SQL | 8 |
| Routes | 13 |
| Slides | 13 |
| Features "diferenciais" | 10 |

---

## 🎯 Roteiro de Apresentação (5 min)

1. **Mostrar estrutura** do projeto (15s)
   - 3 pastas: `sql/`, `public/`, `presentation/`

2. **Aplicar schema + seed** (30s)
   - `npm run db:create && npm run db:seed`
   - Verificar sanity check: 3+9+10+20

3. **Subir aplicação** (15s)
   - `npm start`
   - Abrir `http://localhost:4000`

4. **Tour pelos diferenciais** (2 min)
   - Dashboard com KPIs + bar chart
   - `/schema` ER Diagram auto-gerado
   - `/reports?r=r3` + botão "Baixar CSV"
   - Toggle dark/light (cookie persiste)
   - Search "ana" em `/alunos?q=ana`
   - Pagination em qualquer lista

5. **Demonstração de constraints** (1 min)
   - Tentar criar matrícula duplicada → erro UNIQUE
   - Tentar nota=15 → erro CHECK
   - Apagar Curso → CASCADE remove Disciplinas

---

## 📦 Próximos passos (opcional, não requeridos)

- [ ] Adicionar testes automatizados (Jest + supertest)
- [ ] Docker Compose para dev environment
- [ ] CI no GitHub Actions
- [ ] Auth (admin/customer) se virar produto real