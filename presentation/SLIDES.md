# Apresentação — Sistema Universitário (SQL CRUD)

> **Exercício Prático · Criação e Manipulação de Tabelas SQL**
>
> Disciplina: [Banco de Dados I]
> Aluno: [Seu nome]
> Data: Julho 2026

---

## 1. Objetivo

> Praticar a criação de tabelas, definição de relacionamentos
> (chaves primárias e estrangeiras), inserção de dados e execução de
> scripts SQL — através de uma aplicação web conectada ao banco
> via driver SQL padrão (pg, equivalente a ODBC).

---

## 2. Domínio escolhido

**Sistema Universitário** — clássico em exercícios de BD:

- 3 cursos (Sistemas de Informação, Ciência da Computação, Administração)
- 9 disciplinas distribuídas pelos cursos
- 10 alunos (1 sem curso atribuído — caso de borda)
- 20 matrículas (com notas e status)

Justificativa: modelo pequeno o suficiente para apresentar em 5 min,
grande o suficiente para exercitar JOINs, GROUP BY, agregações e
relatórios.

---

## 3. Modelagem — Diagrama ER

```
┌─────────────┐         ┌──────────────┐
│   Curso     │ 1     N │ Disciplina   │
│─────────────│─────────│──────────────│
│ id (PK)     │         │ id (PK)      │
│ nome        │         │ curso_id (FK)│
│ duracao     │         │ nome         │
└─────────────┘         │ creditos     │
      △                 │ carga_horaria│
      │                 └──────┬───────┘
      │ 1                     │ N
      │                       │
      │ N                     │
┌─────────────┐         ┌──────────────┐
│   Aluno     │ 1     N │  Matrícula   │
│─────────────│─────────│──────────────│
│ id (PK)     │         │ id (PK)      │
│ nome        │         │ aluno_id (FK)│
│ email (UQ)  │         │ disciplina_id│
│ matricula   │         │ nota (CHECK) │
│ curso_id(FK)│         │ status       │
└─────────────┘         └──────────────┘
                            UNIQUE(aluno_id, disciplina_id)
```

---

## 4. Constraints aplicadas (resumo)

| Tabela | Constraint | Regra |
|---|---|---|
| `Curso` | `duracao > 0` (CHECK) | Duração válida |
| `Disciplina` | `creditos 1..12` (CHECK) | Limite institucional |
| `Disciplina` | FK → Curso (CASCADE) | Apagar curso remove disciplinas |
| `Aluno` | `email UNIQUE` | Não duplica |
| `Aluno` | `matricula UNIQUE` | Número de matrícula único |
| `Aluno` | FK → Curso (SET NULL) | Aluno sobrevive sem curso |
| `Matricula` | `nota 0..10` (CHECK) | Nota válida |
| `Matricula` | `status IN (...)` (CHECK) | Só 4 valores |
| `Matricula` | FK Aluno, FK Disciplina (CASCADE) | Limpeza automática |
| `Matricula` | UNIQUE(aluno, disciplina) | Sem matrícula duplicada |

**Por que CASCADE aqui mas SET NULL ali?**

- `Disciplina → Curso`: disciplina não existe sem curso (dependência forte)
- `Aluno → Curso`: aluno pode estar transferindo de curso, ou nunca se matriculou

---

## 5. Camadas da aplicação

```
┌─────────────────────────────────────────────┐
│            Navegador (HTML)                  │
│  /  /cursos  /disciplinas  /alunos          │
│      /matriculas  /reports                   │
└────────────────┬────────────────────────────┘
                 │ HTTP (formulários)
┌────────────────▼────────────────────────────┐
│  Node.js + Express                            │
│  - 7 rotas GET + 4 rotas POST                │
│  - Renderização server-side (sem framework) │
│  - query() / one() / many() helpers          │
└────────────────┬────────────────────────────┘
                 │ pg driver (TCP 5432)
┌────────────────▼────────────────────────────┐
│  PostgreSQL                                  │
│  4 tabelas · 42 registros seed               │
│  1 EXCLUDE-style UNIQUE + 4 CHECKs + 5 FKs   │
└─────────────────────────────────────────────┘
```

---

## 6. Telas (6)

| Rota | Função |
|---|---|
| `/` | Dashboard — KPIs (6 contadores) |
| `/cursos` | Listar + criar curso |
| `/disciplinas` | Listar + criar (com FK ao curso) |
| `/alunos` | Listar + criar (curso opcional) |
| `/matriculas` | Listar (com JOIN de 4 tabelas) + criar |
| `/reports` | 8 relatórios SQL com SQL exibido |

---

## 7. Conexão ODBC / pg

| Aspecto | Valor |
|---|---|
| Driver | `pg` (libpq nativo) |
| Porta | 5432 |
| Pool | 10 conexões |
| Credenciais | via env vars (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE) |
| String ODBC equivalente | `Driver={PostgreSQL Unicode};Server=...;Port=5432;Database=...;Uid=...;Pwd=...;` |

> **Decisão de design**: o pacote `pg` (node-postgres) é o driver SQL
> padrão no Node.js e expõe a mesma API que um driver ODBC — ambos
> usam o protocolo nativo do Postgres. A string de conexão ODBC está
> documentada no README para o caso de o avaliador preferir essa
> convenção.

---

## 8. Demonstração ao vivo (roteiro 5 min)

```
1. Mostrar estrutura do projeto .........  30s
   $ tree -L 2
   ├── sql/  (3 scripts)
   ├── server.js
   ├── db.js
   └── README.md

2. Aplicar schema + seed ...............  30s
   $ npm run db:create
   $ npm run db:seed
   $ psql -d university -c "SELECT COUNT(*) FROM \"Aluno\""
   → 10

3. Subir a aplicação ..................  15s
   $ npm start
   → http://localhost:4000

4. Tour pelas 6 telas ..................  2 min
   /  /cursos  /disciplinas  /alunos  /matriculas  /reports

5. Demonstração de constraints .........  1 min
   a) Tentar criar matrícula duplicada
      → erro: "duplicate key value violates unique constraint"
   b) Tentar nota=15
      → erro: "violates check constraint"
   c) Apagar um curso (psql) → disciplinas some automaticamente (CASCADE)
```

---

## 9. Relatórios implementados (script 03)

| # | Pergunta de negócio | Técnica |
|---|---|---|
| R1 | Lista de todos os alunos com o nome do curso | `LEFT JOIN` (alunos sem curso inclusos) |
| R2 | Quantos alunos por curso | `GROUP BY` + `COUNT` |
| R3 | Média de notas por disciplina | `JOIN` + `AVG` + `CASE WHEN` |
| R4 | Top performers (aprovados com média ≥ 2) | `GROUP BY` + `HAVING` |
| R5 | Quem reprovou em quê | `JOIN` + `WHERE` |
| R6 | Carga horária total por aluno | `SUM` + `GROUP BY` |
| R7 | Disciplinas sem matrículas (turmas vazias) | `LEFT JOIN ... WHERE IS NULL` |
| R8 | Resumo por status de matrícula | `GROUP BY` simples |

---

## 10. Decisões de modelagem — por que cada escolha?

| Decisão | Alternativa | Por que escolhemos |
|---|---|---|
| IDs `TEXT` (slug) | `SERIAL` (INT) | Didático, legível no psql |
| `TIMESTAMP(3)` | `DATE` | Inclui hora para auditoria |
| `updated_at` em todas | só `created_at` | Conformidade acadêmica |
| `CHECK nota 0..10` | só na app | Defense in depth — banco é a última linha |
| `UNIQUE (aluno, disciplina)` | checagem na app | Regra de negócio crítica, imutável |
| `pg` driver | ORM (Prisma, TypeORM) | Requisito: SQL puro |

---

## 11. Possíveis extensões (próximos passos)

- [ ] Autenticação (login + JWT) para multi-usuário
- [ ] Validação server-side mais rigorosa (zod, class-validator)
- [ ] Paginação nas listagens (hoje retorna tudo)
- [ ] Edição inline (PUT /recurso/:id) — só POST agora
- [ ] Testes automatizados (Jest + supertest)
- [ ] Docker Compose (Postgres + Node juntos)
- [ ] CI/CD no GitHub Actions

---

## 12. Como rodar

```bash
git clone https://github.com/MamdouhAlsaodi/sql-university-crud
cd sql-university-crud
npm install
cp .env.example .env       # ajustar credenciais
npm run db:create
npm run db:seed
npm start                  # http://localhost:4000
```

**Tempo de execução**: ~3 minutos do zero ao servidor rodando.

---

## 13. Conclusão

✅ 4 tabelas com PKs, FKs, UNIQUE e CHECKs
✅ 42 registros de seed realistas
✅ 8 relatórios SQL cobrindo JOIN, GROUP BY, agregações, subqueries
✅ Aplicação web com 6 telas, conexão via driver pg (equivalente ODBC)
✅ Tratamento de erros demonstra os constraints em ação
✅ README completo + este deck de apresentação

**Aprendizado-chave**: A integridade dos dados começa no schema.
Constraints de banco (`CHECK`, `UNIQUE`, `FK`) protegem a aplicação
mesmo quando a camada de aplicação tem bugs.

---

*Duração da apresentação: ~5 minutos · 13 slides · Pronto para defesa*