-- ============================================================================
-- Script 01: Criação do schema (MySQL 8.0+)
-- ============================================================================
-- Domínio: Sistema Universitário
-- Tabelas: 4
--   - Curso
--   - Disciplina (FK → Curso)
--   - Aluno
--   - Matricula (FK → Aluno + Disciplina, N:N via tabela ponte)
--
-- Decisões MySQL-específicas:
--   - AUTO_INCREMENT em vez de cuid() — padrão acadêmico MySQL.
--   - ENGINE=InnoDB (transações + FK enforcement).
--   - CHARSET=utf8mb4 para suporte completo a Unicode (incl. emoji).
--   - CHECK constraints (MySQL 8.0.16+ enforça-as; versões anteriores
--     as ignoram silenciosamente).
--   - ON DELETE CASCADE em todas as FKs de conteúdo.
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Matricula;
DROP TABLE IF EXISTS Aluno;
DROP TABLE IF EXISTS Disciplina;
DROP TABLE IF EXISTS Curso;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. Curso
-- ----------------------------------------------------------------------------
CREATE TABLE Curso (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(120) NOT NULL,
    duracao     INT NOT NULL,
    created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT Curso_duracao_chk CHECK (duracao > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Disciplina (1 Curso → N Disciplinas)
-- ----------------------------------------------------------------------------
CREATE TABLE Disciplina (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    curso_id      INT NOT NULL,
    nome          VARCHAR(120) NOT NULL,
    creditos      INT NOT NULL,
    carga_horaria INT NOT NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT Disciplina_curso_id_fkey
        FOREIGN KEY (curso_id) REFERENCES Curso(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT Disciplina_creditos_chk CHECK (creditos BETWEEN 1 AND 12),
    CONSTRAINT Disciplina_carga_horaria_chk CHECK (carga_horaria > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX Disciplina_curso_id_idx ON Disciplina(curso_id);

-- ----------------------------------------------------------------------------
-- 3. Aluno
-- ----------------------------------------------------------------------------
CREATE TABLE Aluno (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(120) NOT NULL,
    email       VARCHAR(180) NOT NULL,
    matricula   VARCHAR(20)  NOT NULL,
    curso_id    INT,
    created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT Aluno_email_uq     UNIQUE (email),
    CONSTRAINT Aluno_matricula_uq UNIQUE (matricula),
    CONSTRAINT Aluno_curso_id_fkey
        FOREIGN KEY (curso_id) REFERENCES Curso(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX Aluno_curso_id_idx ON Aluno(curso_id);
CREATE INDEX Aluno_email_idx    ON Aluno(email);

-- ----------------------------------------------------------------------------
-- 4. Matricula (N:N entre Aluno e Disciplina)
-- ----------------------------------------------------------------------------
CREATE TABLE Matricula (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id      INT NOT NULL,
    disciplina_id INT NOT NULL,
    nota          DECIMAL(4, 2),
    status        ENUM('CURSANDO','APROVADO','REPROVADO','CANCELADO') NOT NULL DEFAULT 'CURSANDO',
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT Matricula_aluno_id_fkey
        FOREIGN KEY (aluno_id) REFERENCES Aluno(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT Matricula_disciplina_id_fkey
        FOREIGN KEY (disciplina_id) REFERENCES Disciplina(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT Matricula_aluno_disciplina_uq UNIQUE (aluno_id, disciplina_id),
    CONSTRAINT Matricula_nota_chk CHECK (nota IS NULL OR (nota >= 0 AND nota <= 10))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX Matricula_aluno_id_idx      ON Matricula(aluno_id);
CREATE INDEX Matricula_disciplina_id_idx ON Matricula(disciplina_id);
CREATE INDEX Matricula_status_idx        ON Matricula(status);

-- Verificação rápida após execução:
-- SELECT (SELECT COUNT(*) FROM Curso)      AS cursos,
--        (SELECT COUNT(*) FROM Disciplina) AS disciplinas,
--        (SELECT COUNT(*) FROM Aluno)      AS alunos,
--        (SELECT COUNT(*) FROM Matricula)  AS matriculas;