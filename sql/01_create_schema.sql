-- ============================================================================
-- Script 01: Criação do schema (CREATE TABLE)
-- ============================================================================
-- Domínio: Sistema Universitário
-- Tabelas: 4
--   - Curso
--   - Disciplina (FK → Curso)
--   - Aluno
--   - Matricula (FK → Aluno + Disciplina, N:N via tabela ponte)
--
-- Decisões:
--   - UUIDs (cuid()) para PK — prática universitária padrão seria INT
--     auto_increment, mas cuid() evita expor o volume de registros.
--   - Timestamps created_at / updated_at em todas as tabelas.
--   - ON DELETE CASCADE em todas as FKs — quando o pai some, o filho some.
--   - UNIQUE constraints onde a regra de negócio exige (ex: email único).
-- ============================================================================

DROP TABLE IF EXISTS "Matricula" CASCADE;
DROP TABLE IF EXISTS "Aluno" CASCADE;
DROP TABLE IF EXISTS "Disciplina" CASCADE;
DROP TABLE IF EXISTS "Curso" CASCADE;

-- ----------------------------------------------------------------------------
-- 1. Curso
-- ----------------------------------------------------------------------------
CREATE TABLE "Curso" (
    id          TEXT PRIMARY KEY,
    nome        TEXT NOT NULL,
    duracao     INTEGER NOT NULL CHECK (duracao > 0),   -- semestres
    created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. Disciplina (1 Curso → N Disciplinas)
-- ----------------------------------------------------------------------------
CREATE TABLE "Disciplina" (
    id          TEXT PRIMARY KEY,
    curso_id    TEXT NOT NULL,
    nome        TEXT NOT NULL,
    creditos    INTEGER NOT NULL CHECK (creditos BETWEEN 1 AND 12),
    carga_horaria INTEGER NOT NULL CHECK (carga_horaria > 0),
    created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Disciplina_curso_id_fkey"
        FOREIGN KEY ("curso_id") REFERENCES "Curso"(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX "Disciplina_curso_id_idx" ON "Disciplina"("curso_id");

-- ----------------------------------------------------------------------------
-- 3. Aluno
-- ----------------------------------------------------------------------------
CREATE TABLE "Aluno" (
    id          TEXT PRIMARY KEY,
    nome        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    matricula  TEXT NOT NULL UNIQUE,                    -- número de matrícula (ex: 2024001)
    curso_id    TEXT,                                    -- pode ser NULL (aluno ainda não escolheu)
    created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Aluno_curso_id_fkey"
        FOREIGN KEY ("curso_id") REFERENCES "Curso"(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX "Aluno_curso_id_idx" ON "Aluno"("curso_id");
CREATE INDEX "Aluno_email_idx" ON "Aluno"("email");

-- ----------------------------------------------------------------------------
-- 4. Matricula (N:N entre Aluno e Disciplina)
-- ----------------------------------------------------------------------------
CREATE TABLE "Matricula" (
    id            TEXT PRIMARY KEY,
    aluno_id      TEXT NOT NULL,
    disciplina_id TEXT NOT NULL,
    nota          DECIMAL(4, 2) CHECK (nota IS NULL OR (nota >= 0 AND nota <= 10)),
    status        TEXT NOT NULL DEFAULT 'CURSANDO'
                  CHECK (status IN ('CURSANDO', 'APROVADO', 'REPROVADO', 'CANCELADO')),
    created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Matricula_aluno_id_fkey"
        FOREIGN KEY ("aluno_id") REFERENCES "Aluno"(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "Matricula_disciplina_id_fkey"
        FOREIGN KEY ("disciplina_id") REFERENCES "Disciplina"(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    -- Um aluno não pode se matricular duas vezes na mesma disciplina
    CONSTRAINT "Matricula_unique" UNIQUE ("aluno_id", "disciplina_id")
);

CREATE INDEX "Matricula_aluno_id_idx" ON "Matricula"("aluno_id");
CREATE INDEX "Matricula_disciplina_id_idx" ON "Matricula"("disciplina_id");
CREATE INDEX "Matricula_status_idx" ON "Matricula"("status");