# Exercício Prático — Sistema Universitário (SQL CRUD)

> Trabalho acadêmico. Cria 4 tabelas relacionadas, popula com dados
> de exemplo, e expõe uma aplicação web que faz CRUD + relatórios
> via conexão direta com Postgres (driver `pg`).

## 1. Visão geral

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
- **PostgreSQL** 13+ (testado em 16)
- **psql** CLI (vem com Postgres)
- npm (ou pnpm/yarn)

## 3. Instalação

```bash
cd /home/server/projects/sql-university-crud
npm install
cp .env.example .env        # edite se necessário
```

### Configurar o banco

```bash
# 1. Criar usuário + banco (uma vez, como superuser)
sudo -u postgres psql <<SQL
  CREATE USER university_user WITH PASSWORD 'university_pass';
  CREATE DATABASE university OWNER university_user;
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

A aplicação tem 6 telas:
- `/` — Dashboard com KPIs
- `/cursos` — Lista + form de criar
- `/disciplinas` — Lista + form
- `/alunos` — Lista + form
- `/matriculas` — Lista (com JOIN) + form
- `/reports` — 8 relatórios SQL prontos

## 5. Estrutura dos arquivos

```
sql-university-crud/
├── sql/
│   ├── 01_create_schema.sql    CREATE TABLE + FK + UNIQUE
│   ├── 02_seed_data.sql       INSERT (3 cursos, 9 disciplinas, 10 alunos, 20 matrículas)
│   └── 03_query_reports.sql   8 consultas de relatório
├── public/
│   └── style.css
├── db.js                       Pool Postgres (conexão ODBC-style via driver pg)
├── server.js                   Express + rotas
├── package.json
├── .env.example
└── README.md
```

## 6. Variáveis de ambiente (`.env`)

```bash
# Conexão com o banco (mesmo padrão de psql/ODBC)
PGHOST=localhost
PGPORT=5432
PGUSER=university_user
PGPASSWORD=university_pass
PGDATABASE=university

# Porta da aplicação web
PORT=4000
```

A string de conexão equivalente via ODBC:
```
Driver={PostgreSQL Unicode};
Server=localhost;
Port=5432;
Database=university;
Uid=university_user;
Pwd=university_pass;
```

## 7. Resultados esperados (sanity check)

Após `npm run db:create && npm run db:seed`:

```
SELECT (SELECT COUNT(*) FROM "Curso")      AS cursos,
       (SELECT COUNT(*) FROM "Disciplina") AS disciplinas,
       (SELECT COUNT(*) FROM "Aluno")      AS alunos,
       (SELECT COUNT(*) FROM "Matricula")  AS matriculas;
 cursos | disciplinas | alunos | matriculas
-------+-------------+--------+------------
     3 |           9 |     10 |         20
```

## 8. Decisões de modelagem

- **IDs `TEXT` em vez de `SERIAL`** — flexibilidade para slugs como `curso-si` em vez de inteiros sequenciais. Universitários em produção geralmente usam SERIAL; aqui a escolha é didática.
- **`ON DELETE CASCADE` em FKs de conteúdo** — apagar um Curso remove suas Disciplinas (e subsequentemente Matrículas). `SET NULL` na FK de Aluno→Curso permite "desvincular" um aluno sem deletá-lo.
- **`CHECK` em `nota BETWEEN 0 AND 10`** — garante integridade dos dados no nível do banco, não só na aplicação.
- **`UNIQUE (aluno_id, disciplina_id)`** — regra de negócio crítica: um aluno não pode ser matriculado duas vezes na mesma disciplina.
- **Timestamps `created_at` / `updated_at`** em todas as tabelas para auditoria.

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

**Tecnologias**: Node.js · Express · PostgreSQL · pg driver · sem ORM (SQL puro, conforme requisito).

**Autor**: [Seu nome aqui]  
**Disciplina**: [Nome da disciplina]  
**Instituição**: [Sua instituição]