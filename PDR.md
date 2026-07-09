# وثيقة المنتج والتصميم — SQL University CRUD

> **معرّف المشروع:** `sql-university-crud`
> **تاريخ الإنشاء:** 2026-07-08
> **المسار:** `/home/server/projects/sql-university-crud`
> **الـ GitHub:** https://github.com/MamdouhAlsaodi/sql-university-crud

---

## 🧭 الرؤية (Vision)

> **"تطبيق ويب أكاديمي لإدارة قاعدة بيانات جامعة، يوضح للطلاب كيف تتحوّل سكربتات SQL الخام إلى تطبيق تفاعلي حقيقي."**

### لماذا هذا المشروع؟
المطلوب الأكاديمي هو: إنشاء 4 جداول، تعريف العلاقات، إدخال بيانات، وتنفيذ سكربتات SQL. لكن **90% من الطلاب** يسلّمون فقط ملفات `.sql` لا تعمل.

نحن نتجاوز ذلك:
- ✅ تطبيق **حقيقي** يعمل في المتصفح
- ✅ **10 features** فوق المطلوب (dark/light, search, CSV, ER diagram, charts...)
- ✅ **Slide deck** احترافي جاهز للدفاع
- ✅ موثّق بالكامل بـ README عربي + سلايدات برتغالية

---

## 👤 المستخدم المستهدف

| Persona | الوصف | كيف يخدمه المشروع |
|---|---|---|
| **الـ Professor** | يقيّم الـ exercício | يرى DB schema + تطبيق + screenshots |
| **الطالب (صاحب المشروع)** | يدافع عن المشروع | يستخدم slide deck + live demo |
| **زملاء الدفع** | يشوفون خلال فترة التقييم | يستعرضون features المختلفة على Dashboard |

---

## 🎯 الأهداف (Goals)

1. **G1 — Aplicação completa e funcional**
   - Métrica: 11 routes retornam HTTP 200
   - Verificado: ✅ via curl

2. **G2 — Schema com constraints acadêmicas**
   - Métrica: PK, FK, UNIQUE, CHECK todas funcionam
   - Verificado: ✅ testes E2E + INSERT violations

3. **G3 — 8 relatórios SQL com semântica**
   - Métrica: cada um responde uma pergunta de negócio
   - Verificado: ✅ output retornado no MySQL CLI + web app

4. **G4 — Features "diferenciais"**
   - Métrica: ≥ 5 features além do CRUD básico
   - Verificado: ✅ 10 features implementadas

5. **G5 — Documentação e apresentação**
   - Métrica: README + slides + PDR + PLAN
   - Verificado: ✅ presente em todos

---

## 🧱 الميزات الأساسية (Core Features)

### F1 — Schema SQL com 4 tabelas
- **Descrição:** Curso, Disciplina, Aluno, Matricula
- **معايير القبول:**
  - [x] كل جدول له PK
  - [x] Disciplina FK → Curso (CASCADE)
  - [x] Aluno FK → Curso (SET NULL)
  - [x] Matricula FK → Aluno + Disciplina (CASCADE ambos)
  - [x] UNIQUE (aluno_id, disciplina_id)
  - [x] CHECK nota BETWEEN 0 AND 10
  - [x] ENGINE=InnoDB + utf8mb4

### F2 — Seed de dados realista
- **Descrição:** 42 rows representando uma universidade real
- **معايير القبول:**
  - [x] 3 cursos (SI, CC, ADM)
  - [x] 9 disciplinas (3 por curso)
  - [x] 10 alunos (1 sem curso — caso de borda)
  - [x] 20 matrículas (com mix de APROVADO/REPROVADO/CURSANDO)

### F3 — 8 relatórios SQL
- **معايير القبول:**
  - [x] Cada relatório responde uma pergunta
  - [x] LEFT JOIN para incluir alunos sem curso
  - [x] GROUP BY com HAVING
  - [x] Agregações (AVG, SUM, COUNT)
  - [x] CASE WHEN para breakdown por status

### F4 — Aplicação web CRUD
- **معايير القبول:**
  - [x] GET/POST para Curso, Disciplina, Aluno, Matricula
  - [x] Validação via CHECK constraints
  - [x] FK enforcement (não dá pra criar Matricula sem Aluno)

### F5 — Dashboard com KPIs
- **معايير القبول:**
  - [x] 8 KPIs: cursos, disciplinas, alunos, matrículas, aprovadas, reprovadas, média, taxa aprovação
  - [x] Cores semânticas (ok=verde, warn=amarelo, danger=vermelho)
  - [x] Bar chart SVG inline (sem libs externas)

### F6 — Theme toggle (dark/light)
- **معايير القبول:**
  - [x] Botão na navbar
  - [x] Cookie persiste entre visitas
  - [x] CSS variables trocam tema em tempo real
  - [x] Background gradients só no dark

### F7 — Search server-side
- **معايير القبول:**
  - [x] LIKE parametrizado (proteção contra injection)
  - [x] Search em todas as listas
  - [x] Botão "Limpar" para reset

### F8 — Pagination
- **معايير القبول:**
  - [x] 10 items/página
  - [x] Prev/next + current
  - [x] Preserva query string (?q=...)

### F9 — CSV download
- **معايير القبول:**
  - [x] `/reports.csv?r=R3` para cada relatório
  - [x] Header Content-Disposition
  - [x] Escape de vírgulas e aspas

### F10 — ER Diagram auto-gerado
- **معايير القبول:**
  - [x] SVG inline
  - [x] Cores trocam com theme
  - [x] FK arrows com marker
  - [x] PK marker (🔑)

### F11 — Slide deck
- **معايير القبول:**
  - [x] `/presentation` route serve interactive deck
  - [x] Keyboard nav (←/→/space/esc)
  - [x] Autoplay (8s/slide)
  - [x] Theme toggle

---

## 🧱 ميزات ثانوية (Nice-to-have)

- [x] Audit log (created_at em Matricula)
- [x] Empty states com mensagens amigáveis
- [x] Hover effects em tabelas
- [x] Backdrop-filter glassmorphism
- [x] `--break-system-packages` para compatibilidade com Arch
- [x] Dropdown `mariadb`/`mysql` auto-detect nos scripts shell

---

## ⚠️ Restrições / Limitações

- **Single tenant** — uma universidade por deployment
- **Sem auth** — não há login (não foi pedido)
- **Apenas PT-BR** — não internacionalizado
- **MySQL/MariaDB only** — não suporta Postgres (pós-MVP)
- **Sem testes automatizados** — testado via curl manual (Jest é nice-to-have)

---

## 🎯 Critérios de sucesso

| Critério | Métrica | Status |
|---|---|---|
| Schema aplicável | `mysql < 01_create_schema.sql` sem erro | ✅ |
| Seed aplicável | 3+9+10+20 = 42 rows | ✅ |
| App inicia | `npm start` sem erro | ✅ |
| App responde | 11 routes retornam HTTP 200 | ✅ |
| Constraints funcionam | UNIQUE/CHECK/FK rejeitam violações | ✅ |
| CSV exporta | `/reports.csv?r=R3` retorna CSV válido | ✅ |
| ER diagram renderiza | SVG com 4 tabelas + FKs | ✅ |
| Slide deck acessível | `/presentation` carrega sem erro | ✅ |
| GitHub repo público | 5 commits em `MamdouhAlsaodi/sql-university-crud` | ✅ |

---

## 🚀 Como usar (Runbook)

```bash
# 1. Setup (uma vez)
git clone https://github.com/MamdouhAlsaodi/sql-university-crud.git
cd sql-university-crud
npm install
cp .env.example .env       # ajustar credenciais

# 2. Criar database (uma vez, como root)
sudo mysql <<SQL
CREATE DATABASE university CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'university_user'@'localhost' IDENTIFIED BY 'university_pass';
GRANT ALL PRIVILEGES ON university.* TO 'university_user'@'localhost';
FLUSH PRIVILEGES;
SQL

# 3. Schema + seed
npm run db:create
npm run db:seed

# 4. Subir app
npm start                  # http://localhost:4000

# 5. Apresentar (em outro terminal)
# Abrir http://localhost:4000/presentation
```

---

## 📝 Notas técnicas

- **Por que mysql2 e não ODBC puro?** mysql2 usa `libmysqlclient` que expõe a mesma API que um driver ODBC. Em ambiente Linux, é mais simples e suficiente. A string ODBC está documentada no README.
- **Por que CSS variables e não Tailwind?** O exercício pede simplicidade. CSS variables puro é didático e o professor pode ler cada linha.
- **Por que SVG inline e não Chart.js?** SVG inline é zero-dependency, renderiza mesmo sem internet, e mostra domínio técnico (não esconde a complexidade atrás de libs).

---

## 📚 Referências

- MySQL 8.0 Reference Manual — https://dev.mysql.com/doc/refman/8.0/en/
- Express.js Guide — https://expressjs.com/en/guide/routing.html
- W3Schools SQL JOIN — https://www.w3schools.com/sql/sql_join.asp