-- ============================================================================
-- Script 02: Inserção de dados (MySQL 8.0+)
-- ============================================================================
-- Ordem: respeitar dependências (Curso → Disciplina → Aluno → Matricula).
-- Em MySQL usamos AUTO_INCREMENT, então os IDs são gerados
-- automaticamente. Para referenciar nas tabelas filhas usamos
-- subqueries: (SELECT id FROM Curso WHERE nome = '...')
-- Isso mantém o script idempotente e legível.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3 Cursos
-- ----------------------------------------------------------------------------
INSERT INTO Curso (nome, duracao) VALUES
    ('Sistemas de Informação',     8),
    ('Ciência da Computação',      8),
    ('Administração',              8);

-- ----------------------------------------------------------------------------
-- 9 Disciplinas (3 por curso)
-- ----------------------------------------------------------------------------
INSERT INTO Disciplina (curso_id, nome, creditos, carga_horaria) VALUES
    -- SI
    ((SELECT id FROM Curso WHERE nome='Sistemas de Informação'),
     'Algoritmos e Estruturas de Dados', 4, 80),
    ((SELECT id FROM Curso WHERE nome='Sistemas de Informação'),
     'Banco de Dados',                   4, 80),
    ((SELECT id FROM Curso WHERE nome='Sistemas de Informação'),
     'Programação Web',                   4, 80),
    -- CC
    ((SELECT id FROM Curso WHERE nome='Ciência da Computação'),
     'Algoritmos e Estruturas de Dados', 4, 80),
    ((SELECT id FROM Curso WHERE nome='Ciência da Computação'),
     'Cálculo I',                         4, 80),
    ((SELECT id FROM Curso WHERE nome='Ciência da Computação'),
     'Inteligência Artificial',           4, 80),
    -- ADM
    ((SELECT id FROM Curso WHERE nome='Administração'),
     'Contabilidade Geral',               4, 80),
    ((SELECT id FROM Curso WHERE nome='Administração'),
     'Administração Financeira',          4, 80),
    ((SELECT id FROM Curso WHERE nome='Administração'),
     'Marketing',                         4, 80);

-- ----------------------------------------------------------------------------
-- 10 Alunos (distribuídos entre os cursos, 1 sem curso)
-- ----------------------------------------------------------------------------
INSERT INTO Aluno (nome, email, matricula, curso_id) VALUES
    ('Ana Silva',     'ana.silva@uni.edu',     '2024001',
     (SELECT id FROM Curso WHERE nome='Sistemas de Informação')),
    ('Bruno Costa',   'bruno.costa@uni.edu',   '2024002',
     (SELECT id FROM Curso WHERE nome='Sistemas de Informação')),
    ('Carla Souza',   'carla.souza@uni.edu',   '2024003',
     (SELECT id FROM Curso WHERE nome='Sistemas de Informação')),
    ('Diego Lima',    'diego.lima@uni.edu',    '2024004',
     (SELECT id FROM Curso WHERE nome='Sistemas de Informação')),
    ('Eduarda Alves', 'eduarda.alves@uni.edu', '2024005',
     (SELECT id FROM Curso WHERE nome='Ciência da Computação')),
    ('Felipe Rocha',  'felipe.rocha@uni.edu',  '2024006',
     (SELECT id FROM Curso WHERE nome='Ciência da Computação')),
    ('Gabriela Melo', 'gabriela.melo@uni.edu', '2024007',
     (SELECT id FROM Curso WHERE nome='Ciência da Computação')),
    ('Hugo Barros',   'hugo.barros@uni.edu',   '2024008',
     (SELECT id FROM Curso WHERE nome='Administração')),
    ('Isabela Reis',  'isabela.reis@uni.edu',  '2024009',
     (SELECT id FROM Curso WHERE nome='Administração')),
    ('João Pereira',  'joao.pereira@uni.edu',  '2024010', NULL);

-- ----------------------------------------------------------------------------
-- Matrículas — 20 inserts
-- (Os IDs de aluno e disciplina são resolvidos por subquery.
--  Mais verboso que hard-coding de IDs, mas mais robusto a re-runs.)
-- ----------------------------------------------------------------------------
INSERT INTO Matricula (aluno_id, disciplina_id, nota, status) VALUES
    -- Ana (SI) — APROVADA em tudo
    ((SELECT id FROM Aluno WHERE matricula='2024001'),
     (SELECT id FROM Disciplina WHERE nome='Algoritmos e Estruturas de Dados' AND curso_id=(SELECT id FROM Curso WHERE nome='Sistemas de Informação')),
     8.50, 'APROVADO'),
    ((SELECT id FROM Aluno WHERE matricula='2024001'),
     (SELECT id FROM Disciplina WHERE nome='Banco de Dados'),
     9.00, 'APROVADO'),
    ((SELECT id FROM Aluno WHERE matricula='2024001'),
     (SELECT id FROM Disciplina WHERE nome='Programação Web'),
     7.50, 'APROVADO'),
    -- Bruno (SI) — mista
    ((SELECT id FROM Aluno WHERE matricula='2024002'),
     (SELECT id FROM Disciplina WHERE nome='Algoritmos e Estruturas de Dados' AND curso_id=(SELECT id FROM Curso WHERE nome='Sistemas de Informação')),
     5.50, 'APROVADO'),
    ((SELECT id FROM Aluno WHERE matricula='2024002'),
     (SELECT id FROM Disciplina WHERE nome='Banco de Dados'),
     4.00, 'REPROVADO'),
    ((SELECT id FROM Aluno WHERE matricula='2024002'),
     (SELECT id FROM Disciplina WHERE nome='Programação Web'),
     NULL, 'CURSANDO'),
    -- Carla (SI)
    ((SELECT id FROM Aluno WHERE matricula='2024003'),
     (SELECT id FROM Disciplina WHERE nome='Algoritmos e Estruturas de Dados' AND curso_id=(SELECT id FROM Curso WHERE nome='Sistemas de Informação')),
     9.75, 'APROVADO'),
    ((SELECT id FROM Aluno WHERE matricula='2024003'),
     (SELECT id FROM Disciplina WHERE nome='Banco de Dados'),
     8.00, 'APROVADO'),
    -- Diego (SI) — sem matrículas
    -- Eduarda (CC)
    ((SELECT id FROM Aluno WHERE matricula='2024005'),
     (SELECT id FROM Disciplina WHERE nome='Algoritmos e Estruturas de Dados' AND curso_id=(SELECT id FROM Curso WHERE nome='Ciência da Computação')),
     7.00, 'APROVADO'),
    ((SELECT id FROM Aluno WHERE matricula='2024005'),
     (SELECT id FROM Disciplina WHERE nome='Cálculo I'),
     6.50, 'APROVADO'),
    ((SELECT id FROM Aluno WHERE matricula='2024005'),
     (SELECT id FROM Disciplina WHERE nome='Inteligência Artificial'),
     8.25, 'APROVADO'),
    -- Felipe (CC)
    ((SELECT id FROM Aluno WHERE matricula='2024006'),
     (SELECT id FROM Disciplina WHERE nome='Algoritmos e Estruturas de Dados' AND curso_id=(SELECT id FROM Curso WHERE nome='Ciência da Computação')),
     3.00, 'REPROVADO'),
    ((SELECT id FROM Aluno WHERE matricula='2024006'),
     (SELECT id FROM Disciplina WHERE nome='Cálculo I'),
     7.50, 'APROVADO'),
    -- Gabriela (CC)
    ((SELECT id FROM Aluno WHERE matricula='2024007'),
     (SELECT id FROM Disciplina WHERE nome='Cálculo I'),
     9.50, 'APROVADO'),
    ((SELECT id FROM Aluno WHERE matricula='2024007'),
     (SELECT id FROM Disciplina WHERE nome='Inteligência Artificial'),
     NULL, 'CURSANDO'),
    -- Hugo (ADM)
    ((SELECT id FROM Aluno WHERE matricula='2024008'),
     (SELECT id FROM Disciplina WHERE nome='Contabilidade Geral'),
     6.00, 'APROVADO'),
    ((SELECT id FROM Aluno WHERE matricula='2024008'),
     (SELECT id FROM Disciplina WHERE nome='Administração Financeira'),
     7.00, 'APROVADO'),
    -- Isabela (ADM)
    ((SELECT id FROM Aluno WHERE matricula='2024009'),
     (SELECT id FROM Disciplina WHERE nome='Contabilidade Geral'),
     8.00, 'APROVADO'),
    ((SELECT id FROM Aluno WHERE matricula='2024009'),
     (SELECT id FROM Disciplina WHERE nome='Marketing'),
     9.00, 'APROVADO'),
    ((SELECT id FROM Aluno WHERE matricula='2024009'),
     (SELECT id FROM Disciplina WHERE nome='Administração Financeira'),
     NULL, 'CANCELADO');

-- ----------------------------------------------------------------------------
-- Sanity check final
-- ----------------------------------------------------------------------------
SELECT
    (SELECT COUNT(*) FROM Curso)      AS cursos,
    (SELECT COUNT(*) FROM Disciplina) AS disciplinas,
    (SELECT COUNT(*) FROM Aluno)      AS alunos,
    (SELECT COUNT(*) FROM Matricula)  AS matriculas;