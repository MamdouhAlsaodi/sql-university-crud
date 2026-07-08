-- ============================================================================
-- Script 02: Inserção de dados (INSERT)
-- ============================================================================
-- Ordem: respeitar dependências (Curso → Disciplina → Aluno → Matricula).
-- IDs fixos (TEXT) para que possamos referenciar diretamente.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3 Cursos
-- ----------------------------------------------------------------------------
INSERT INTO "Curso" (id, nome, duracao) VALUES
    ('curso-si',  'Sistemas de Informação', 8),
    ('curso-cc',  'Ciência da Computação', 8),
    ('curso-adm', 'Administração',          8);

-- ----------------------------------------------------------------------------
-- 9 Disciplinas (3 por curso)
-- ----------------------------------------------------------------------------
INSERT INTO "Disciplina" (id, curso_id, nome, creditos, carga_horaria) VALUES
    -- SI
    ('disc-si-1', 'curso-si', 'Algoritmos e Estruturas de Dados', 4, 80),
    ('disc-si-2', 'curso-si', 'Banco de Dados',                   4, 80),
    ('disc-si-3', 'curso-si', 'Programação Web',                   4, 80),
    -- CC
    ('disc-cc-1', 'curso-cc', 'Algoritmos e Estruturas de Dados', 4, 80),
    ('disc-cc-2', 'curso-cc', 'Cálculo I',                         4, 80),
    ('disc-cc-3', 'curso-cc', 'Inteligência Artificial',           4, 80),
    -- ADM
    ('disc-adm-1', 'curso-adm', 'Contabilidade Geral',            4, 80),
    ('disc-adm-2', 'curso-adm', 'Administração Financeira',       4, 80),
    ('disc-adm-3', 'curso-adm', 'Marketing',                       4, 80);

-- ----------------------------------------------------------------------------
-- 10 Alunos (distribuídos entre os cursos, 1 sem curso)
-- ----------------------------------------------------------------------------
INSERT INTO "Aluno" (id, nome, email, matricula, curso_id) VALUES
    ('aluno-001', 'Ana Silva',     'ana.silva@uni.edu',     '2024001', 'curso-si'),
    ('aluno-002', 'Bruno Costa',   'bruno.costa@uni.edu',   '2024002', 'curso-si'),
    ('aluno-003', 'Carla Souza',   'carla.souza@uni.edu',   '2024003', 'curso-si'),
    ('aluno-004', 'Diego Lima',    'diego.lima@uni.edu',    '2024004', 'curso-si'),
    ('aluno-005', 'Eduarda Alves', 'eduarda.alves@uni.edu', '2024005', 'curso-cc'),
    ('aluno-006', 'Felipe Rocha',  'felipe.rocha@uni.edu',  '2024006', 'curso-cc'),
    ('aluno-007', 'Gabriela Melo', 'gabriela.melo@uni.edu', '2024007', 'curso-cc'),
    ('aluno-008', 'Hugo Barros',   'hugo.barros@uni.edu',   '2024008', 'curso-adm'),
    ('aluno-009', 'Isabela Reis',  'isabela.reis@uni.edu',  '2024009', 'curso-adm'),
    ('aluno-010', 'João Pereira',  'joao.pereira@uni.edu',  '2024010', NULL);

-- ----------------------------------------------------------------------------
-- Matrículas (cada aluno em 2-3 disciplinas com notas variadas)
-- ----------------------------------------------------------------------------
INSERT INTO "Matricula" (id, aluno_id, disciplina_id, nota, status) VALUES
    -- Ana (SI) — APROVADA em tudo
    ('mat-001', 'aluno-001', 'disc-si-1', 8.50, 'APROVADO'),
    ('mat-002', 'aluno-001', 'disc-si-2', 9.00, 'APROVADO'),
    ('mat-003', 'aluno-001', 'disc-si-3', 7.50, 'APROVADO'),
    -- Bruno (SI) — mista
    ('mat-004', 'aluno-002', 'disc-si-1', 5.50, 'APROVADO'),
    ('mat-005', 'aluno-002', 'disc-si-2', 4.00, 'REPROVADO'),
    ('mat-006', 'aluno-002', 'disc-si-3', NULL, 'CURSANDO'),
    -- Carla (SI)
    ('mat-007', 'aluno-003', 'disc-si-1', 9.75, 'APROVADO'),
    ('mat-008', 'aluno-003', 'disc-si-2', 8.00, 'APROVADO'),
    -- Diego (SI) — sem matrículas (caso edge)
    -- Eduardo (CC)
    ('mat-009', 'aluno-005', 'disc-cc-1', 7.00, 'APROVADO'),
    ('mat-010', 'aluno-005', 'disc-cc-2', 6.50, 'APROVADO'),
    ('mat-011', 'aluno-005', 'disc-cc-3', 8.25, 'APROVADO'),
    -- Felipe (CC)
    ('mat-012', 'aluno-006', 'disc-cc-1', 3.00, 'REPROVADO'),
    ('mat-013', 'aluno-006', 'disc-cc-2', 7.50, 'APROVADO'),
    -- Gabriela (CC)
    ('mat-014', 'aluno-007', 'disc-cc-2', 9.50, 'APROVADO'),
    ('mat-015', 'aluno-007', 'disc-cc-3', NULL, 'CURSANDO'),
    -- Hugo (ADM)
    ('mat-016', 'aluno-008', 'disc-adm-1', 6.00, 'APROVADO'),
    ('mat-017', 'aluno-008', 'disc-adm-2', 7.00, 'APROVADO'),
    -- Isabela (ADM)
    ('mat-018', 'aluno-009', 'disc-adm-1', 8.00, 'APROVADO'),
    ('mat-019', 'aluno-009', 'disc-adm-3', 9.00, 'APROVADO'),
    ('mat-020', 'aluno-009', 'disc-adm-2', NULL, 'CANCELADO');