# Exercício Prático — Sistema Universitário (SQL CRUD)

> Trabalho acadêmico. Cria 4 tabelas relacionadas, popula com dados
> de exemplo, e expõe uma aplicação web que faz CRUD + relatórios
> via conexão direta com MySQL (driver `mysql2`, equivalente a ODBC).

## 1. Visão geral

> **Diferenciais deste projeto:**
> - 🌗 **Dark / Light mode** com toggle persistente (cookie)
> - 🔍 **Search** server-side (LIKE) em cada lista
> - 📄 **Pagination** (10/página) em todas as listagens
> - 📊 **Mini bar chart** no dashboard (SVG inline, sem libs externas)
> - ⬇️ **CSV download** em cada relatório
> - 🗺️ **ER Diagram** auto-gerado a partir de `information_schema`
> - 📅 **Audit log** — `created_at` aparece na tabela de matrículas
> - 🎨 **Glassmorphism dark theme** — design 2026, não 2006

| Tabela | Descrição | Registros |
| --- | --- | --- |
| `Curso` | Cursos da universidade | 3 |
| `Disciplina` | Disciplinas de cada curso (FK → Curso) | 9 |
| `Aluno` | Alunos matriculados (FK → Curso, opcional) | 10 |
| `Matricula` | N:N entre Aluno e Disciplina, com nota + status | 20 |

Relacionamentos:
- `Disciplina.curso_id` → `Curso.id` (**ON DELETE CASCADE**)
- `Aluno.curso_id` → `Curso.id` (**ON DELETE SET NULL**)
- `Matricula.aluno_id` → `Aluno.id` (**ON DELETE CASCADE**)
- `Matricula.disciplina_id` → `Disciplina.id` (**ON DELETE CASCADE**)
- `Matricula (aluno_id, disciplina_id)` **UNIQUE** — sem matrícula duplicada

## 2. Pré-requisitos

- **Node.js** 18+ (testado em 20/22)
- **MySQL** 8.0+ (testado em 8.0.46)
- **mysql** CLI (vem com MySQL Server)
- npm (ou pnpm/yarn)

## 3. Instalação

```bash
cd /home/server/projects/sql-university-crud
npm install
cp .env.example .env        # edite se necessário
```

### Configurar o banco

```bash
# 1. Criar database + usuário (uma vez, como root)
sudo mysql <<SQL
  CREATE DATABASE university CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'university_user'@'localhost' IDENTIFIED BY 'university_pass';
  GRANT ALL PRIVILEGES ON university.* TO 'university_user'@'localhost';
  FLUSH PRIVILEGES;
SQL

# 2. Rodar o schema + seed
npm run db:create
npm run db:seed

# 3. (Opcional) Rodar os relatórios no terminal
npm run db:reports
```

## 4. Subir a aplicação

```bash
npm start
# → http://localhost:4000
```

A aplicação tem 8 telas (mais do que um CRUD comum):
- `/` — Dashboard com KPIs + bar chart de alunos por curso
- `/cursos` — Lista + search + pagination + form
- `/disciplinas` — Lista + search + form
- `/alunos` — Lista + search + form
- `/matriculas` — Lista (com JOIN) + search + form
- `/schema` — **ER Diagram** auto-gerado em SVG
- `/reports` — 8 relatórios SQL
- `/reports.csv?r=r3` — **download CSV** de qualquer relatório

## 5. Estrutura dos arquivos

```
sql-university-crud/
├── sql/
│   ├── 01_create_schema.sql    CREATE TABLE + FK + UNIQUE + CHECK (MySQL 8.0+)
│   ├── 02_seed_data.sql       INSERT (3 cursos, 9 disciplinas, 10 alunos, 20 matrículas)
│   └── 03_query_reports.sql   8 consultas de relatório
├── public/
│   └── style.css
├── db.js                       Pool MySQL (driver mysql2)
├── server.js                   Express + rotas
├── package.json
├── .env.example
└── README.md
```

## 6. Variáveis de ambiente (`.env`)

```bash
# Conexão com o banco
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=university_user
MYSQL_PASSWORD=university_pass
MYSQL_DATABASE=university

# Porta da aplicação web
PORT=4000
```

A string de conexão equivalente via ODBC:
```
Driver={MySQL ODBC 8.0 Unicode Driver};
Server=localhost;
Port=3306;
Database=university;
User=university_user;
Password=university_pass;
```

## 7. Resultados esperados (sanity check)

Após `npm run db:create && npm run db:seed`:

```sql
SELECT (SELECT COUNT(*) FROM Curso)      AS cursos,
       (SELECT COUNT(*) FROM Disciplina) AS disciplinas,
       (SELECT COUNT(*) FROM Aluno)      AS alunos,
       (SELECT COUNT(*) FROM Matricula)  AS matriculas;
```
```
 cursos | disciplinas | alunos | matriculas
-------+-------------+--------+------------
     3 |           9 |     10 |         20
```

## 8. Decisões de modelagem (MySQL 8.0+)

- **IDs `INT AUTO_INCREMENT`** — padrão acadêmico MySQL; `AUTO_INCREMENT` em vez de UUIDs.
- **`ENGINE=InnoDB`** — transações + enforcement de FK.
- **`utf8mb4`** — suporte completo a Unicode (incluindo emoji).
- **`ON DELETE CASCADE` em FKs de conteúdo** — apagar um Curso remove suas Disciplinas (e subsequentemente Matrículas). `SET NULL` na FK de Aluno→Curso permite "desvincular" um aluno sem deletá-lo.
- **`CHECK` em `nota BETWEEN 0 AND 10`** — integridade no nível do banco (MySQL 8.0.16+ enforça-as; versões anteriores ignoram silenciosamente).
- **`UNIQUE (aluno_id, disciplina_id)`** — regra de negócio crítica.
- **`ENUM` para `status`** — apenas 4 valores permitidos, validado pelo banco.
- **Timestamps `created_at` / `updated_at`** com `ON UPDATE CURRENT_TIMESTAMP(3)` — auto-update em cada UPDATE.

## 9. Roteiro de apresentação (5 min)

1. `npm run db:create && npm run db:seed` — mostrar que o schema é criado e populado.
2. `npm start` — abrir `http://localhost:4000`.
3. Dashboard — KPIs iniciais.
4. `/reports?r=r3` — relatório de médias por disciplina.
5. `/alunos` → criar um aluno novo pelo form.
6. `/matriculas` → matricular esse aluno em uma disciplina.
7. Mostrar que o `UNIQUE` rejeita matrícula duplicada (tente 2x).
8. Mostrar que o `CHECK` rejeita nota=15.

---

**Tecnologias**: Node.js · Express · MySQL 8.0 · mysql2 driver · sem ORM (SQL puro, conforme requisito).

**Autor**: [Seu nome aqui]  
**Disciplina**: [Nome da disciplina]  
**Instituição**: [Sua instituição]