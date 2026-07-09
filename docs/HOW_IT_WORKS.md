# كيف يعمل النظام — SQL University CRUD

> شرح معمّق لكل طبقة في النظام — من المتصفح إلى قاعدة البيانات.

## 🎯 الهدف من هذه الوثيقة

تشرح **هيكلياً** كيف يعمل `sql-university-crud`: من كتابة URL في المتصفح حتى عرض البيانات في الجدول. مفيدة لمن يريد فهم المشروع قبل تعديله، أو للـ professor الذي يريد رؤية إن المشروع مبني بوعي معماري.

## 🏗️ البنية العامة (Big Picture)

```
┌──────────────────────────────────────────────┐
│           المتصفح (Browser)                  │
│  ┌─────────────────────────────────────────┐ │
│  │ HTML rendered by Express                │ │
│  │ CSS variables (dark/light)              │ │
│  │ Inline JS (no build step)               │ │
│  └─────────────────────────────────────────┘ │
└──────────────────┬───────────────────────────┘
                   │ HTTP (curl / fetch)
                   ▼
┌──────────────────────────────────────────────┐
│     خادم Node.js (Express 4)                 │
│  ┌─────────────────────────────────────────┐ │
│  │ middleware:                              │ │
│  │   • cookie-parser (theme persistence)   │ │
│  │   • urlencoded (form posts)             │ │
│  │   • static (CSS files)                  │ │
│  ├─────────────────────────────────────────┤ │
│  │ routes (13 total):                       │ │
│  │   GET  /              Dashboard         │ │
│  │   GET  /cursos        List + form       │ │
│  │   GET  /schema        ER Diagram SVG    │ │
│  │   GET  /reports       8 SQL reports     │ │
│  │   POST /theme         Toggle dark/light │ │
│  │   ...                                   │ │
│  ├─────────────────────────────────────────┤ │
│  │ helpers:                                 │ │
│  │   • layout()   — base HTML template     │ │
│  │   • toolbar()  — search + pagination   │ │
│  │   • buildSearchWhere() — LIKE builder   │ │
│  └─────────────────────────────────────────┘ │
└──────────────────┬───────────────────────────┘
                   │ TCP port 3307 (MariaDB) / 3306 (MySQL)
                   ▼
┌──────────────────────────────────────────────┐
│       MariaDB / MySQL Server                 │
│  ┌─────────────────────────────────────────┐ │
│  │ Database: `university`                  │ │
│  │ Tables:                                  │ │
│  │   • Curso      (3 rows)                 │ │
│  │   • Disciplina (9 rows, FK→Curso)      │ │
│  │   • Aluno      (10 rows, FK→Curso)     │ │
│  │   • Matricula  (20 rows, FK→both)      │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## 🔄 تدفق طلب نموذجي (Request Lifecycle)

### مثال: `GET /alunos?q=ana`

```
1. المتصفح → GET /alunos?q=ana
                │
                ▼
2. Express يستقبل الـ request
   - cookie-parser يحل الـ cookie "theme=dark"
   - urlencoded يحل q=ana
                │
                ▼
3. الـ route handler يبنّي الـ SQL:
   SELECT * FROM Aluno WHERE nome LIKE '%ana%' LIMIT 10 OFFSET 0
                │
                ▼
4. mysql2 pool ينفّذ الـ query
   - Pool size = 10
   - Connection من pool → query → release
                │
                ▼
5. النتيجة تُعرض كـ HTML table
   <tr><td>Ana Silva</td><td>ana.silva@uni.edu</td></tr>
                │
                ▼
6. الـ HTML يُرسل للمتصفح
   status 200 + Content-Type: text/html
```

### مثال: `POST /matriculas`

```
1. المتصفح يرسل form مع aluno_id, disciplina_id, nota, status
                │
                ▼
2. urlencoded يحل الـ body
                │
                ▼
3. الـ INSERT ينفّذ:
   INSERT INTO Matricula (aluno_id, disciplina_id, nota, status)
   VALUES (?, ?, ?, ?)
                │
                ▼
4. MySQL ينفّذ الـ INSERT
   - UNIQUE constraint يتحقق (aluno, disciplina) — يرفض التكرار
   - FK constraints تتحقق — يرفض aluno_id غير موجود
   - CHECK constraint يتحقق — nota BETWEEN 0 AND 10
                │
                ▼
5. إما:
   a. INSERT ناجح → redirect إلى /matriculas
   b. خطأ → 400 + رسالة خطأ واضحة
```

## 📦 الوحدات (Modules) بالتفصيل

### 1. `db.js` — Connection Pool

```js
// ينشئ pool من 10 connections
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});
```

**لماذا pool؟** فتح/إغلاق connection بطيء. Pool يعيد استخدام connections ويوفر أداء أفضل.

### 2. `server.js` — Express + Routes

| Helper | الغرض |
|---|---|
| `layout()` | يبني الـ HTML الكامل (head + nav + body + footer) |
| `toolbar()` | شريط البحث + أزرار الصفحات |
| `paginate()` | يحسب offset/limit من page query |
| `buildSearchWhere()` | يبني `WHERE name LIKE ? OR email LIKE ?` |
| `extractReportSql()` | يستخرج SQL query من `03_query_reports.sql` |

### 3. `public/style.css` — Design System

- **CSS Variables** للـ theme: `:root[data-theme="dark"]` و `:root[data-theme="light"]`
- **Backdrop-filter** للـ glassmorphism
- **No Tailwind** — كتبنا كل CSS يدويًا (380 سطر)
- **Responsive** — `grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))`

### 4. `sql/01_create_schema.sql` — DDL

- 4 جداول مع `INT AUTO_INCREMENT` PK
- `ENGINE=InnoDB` للـ transactions + FK enforcement
- `utf8mb4` للـ Unicode الكامل
- `CHECK` constraints على nota و duracao
- `UNIQUE` composta على (aluno_id, disciplina_id)

### 5. `sql/02_seed_data.sql` — DML

- Subqueries بدلاً من hard-coded IDs
- **Idempotent** — يمكن تشغيله عدة مرات (لكن داخل `npm run db:create` يحذف أولاً)
- 42 row إجمالي: 3 + 9 + 10 + 20

### 6. `sql/03_query_reports.sql` — SELECT

- 8 queries تستخدم JOIN, GROUP BY, HAVING, subqueries, CASE WHEN
- كل query يُفصل بـ `-- Rn:` comment (يستخدمه الـ dashboard لاستخراج الشرائح)

## 🎨 Design Decisions (لماذا اخترنا هذا)

### لماذا `mysql2` بدل `pg`?
المشروع الأصلي كان Postgres. ثم طُلب تحويله لـ MySQL. `mysql2` هو الـ driver الأكثر استخدامًا لـ Node + MySQL، يدعم prepared statements + transactions + pooling.

### لماذا raw SQL بدل ORM?
المتطلب الأكاديمي: "تطبيق ويب يتصل بـ DB عبر ODBC/port/login/password". ORM يخفي SQL. نحن نظهر SQL مباشرة في `/reports` — هذا أفضل تعليميًا.

### لماذا CSS variables بدل Tailwind?
- **أكاديمي**: professor يمكنه قراءة كل سطر
- **صغير**: 580 سطر CSS مقابل 10KB Tailwind CDN
- **مرن**: تبديل theme بكفّة CSS root

### لماذا MariaDB بدل MySQL على Arch?
- Arch Linux يفضّل MariaDB (الـ fork open-source)
- MySQL على Arch يحتاج `mysql` package منفصل
- MariaDB 12.2.2 متوافق 100% مع MySQL 8.0 في الـ SQL الذي نستخدمه

## 🔍 كيف تختبر النظام

```bash
# 1. اعمل قاعدة بيانات
sudo mysql -e "CREATE DATABASE university; CREATE USER 'u'@'localhost' IDENTIFIED BY 'p'; GRANT ALL ON university.* TO 'u'@'localhost';"

# 2. طبّق schema + seed
mysql -u u -pp university < sql/01_create_schema.sql
mysql -u u -pp university < sql/02_seed_data.sql

# 3. تحقق
mysql -u u -pp university -e "SELECT COUNT(*) FROM Aluno;"

# 4. شغّل التطبيق
npm install
node server.js

# 5. اختبر الـ routes
curl http://localhost:4000/                    # 200 (Dashboard)
curl http://localhost:4000/alunos?q=ana        # 200 (search)
curl http://localhost:4000/reports.csv?r=R3    # 200 (CSV download)
```

## 🐛 Pitfalls الشائعة

| المشكلة | السبب | الحل |
|---|---|---|
| `ECONNREFUSED 3306` | MySQL/MariaDB غير مشغّل | `sudo service mysql start` |
| `ER_ACCESS_DENIED` | user/password غلط | تحقق من `.env` |
| `Table 'university.Curso' doesn't exist` | الـ schema لم يُطبّق | شغّل `npm run db:create` |
| `Cannot find module 'mysql2'` | لم يُشغّل `npm install` | `npm install` |
| `EADDRINUSE :::4000` | البورت محجوز | غيّر `PORT` في `.env` |
| slides فارغة | لا SLIDES.md | أنشئ `presentation/SLIDES.md` |

## 📊 مقاييس (Metrics)

| المقياس | القيمة |
|---|---|
| عدد الـ routes | 13 |
| عدد الـ SQL queries | 11 (1 schema + 1 seed + 8 reports + 1 check) |
| عدد الـ tables | 4 |
| عدد الـ rows في seed | 42 |
| عدد الـ features | 13 |
| حجم الـ SQL scripts | ~290 سطر |
| حجم الـ JS | ~840 سطر |
| حجم الـ CSS | ~580 سطر |
| الـ commits على GitHub | 6 |

## 🔮 امتدادات محتملة

- [ ] **WebSocket** للـ real-time updates (بدل polling)
- [ ] **Auth system** مع JWT (للـ admin/teacher roles)
- [ ] **Docker Compose** للـ dev environment
- [ ] **Jest tests** للـ API endpoints
- [ ] **CSV import** لطلاب جدد (bulk upload)
- [ ] **Audit log UI** يعرض كل التغييرات في الجداول

---

**خلاصة**: النظام مبني بأبسط ما يمكن — Express + mysql2 + raw SQL + CSS variables. لا frameworks ثقيلة، لا build step، كل شيء قابل للقراءة والتعديل.