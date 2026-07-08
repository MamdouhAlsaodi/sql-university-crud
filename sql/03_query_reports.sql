-- ============================================================================
-- Script 03: Consultas de relatório (JOIN + aggregate)
-- ============================================================================
-- Cada SELECT resolve uma pergunta de negócio. Comentários mostram o
-- output esperado quando executado contra os dados do script 02.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- R1: Lista de todos os alunos com o nome do curso (LEFT JOIN para
--     incluir alunos sem curso).
-- Output esperado: 10 linhas
-- ----------------------------------------------------------------------------
SELECT
    a.matricula,
    a.nome           AS aluno,
    COALESCE(c.nome, '(sem curso)') AS curso
FROM "Aluno" a
LEFT JOIN "Curso" c ON c.id = a.curso_id
ORDER BY a.matricula;

-- ----------------------------------------------------------------------------
-- R2: Contagem de alunos por curso (GROUP BY + LEFT JOIN).
-- ----------------------------------------------------------------------------
SELECT
    c.nome                                AS curso,
    COUNT(a.id)                           AS total_alunos
FROM "Curso" c
LEFT JOIN "Aluno" a ON a.curso_id = c.id
GROUP BY c.id, c.nome
ORDER BY total_alunos DESC;

-- ----------------------------------------------------------------------------
-- R3: Média de notas por disciplina (com filtro de status).
-- ----------------------------------------------------------------------------
SELECT
    d.nome                AS disciplina,
    c.nome                AS curso,
    COUNT(m.id)           AS total_matriculas,
    ROUND(AVG(m.nota)::numeric, 2) AS media_nota,
    SUM(CASE WHEN m.status = 'APROVADO'  THEN 1 ELSE 0 END) AS aprovados,
    SUM(CASE WHEN m.status = 'REPROVADO' THEN 1 ELSE 0 END) AS reprovados,
    SUM(CASE WHEN m.status = 'CURSANDO'  THEN 1 ELSE 0 END) AS cursando
FROM "Matricula" m
INNER JOIN "Disciplina" d ON d.id = m.disciplina_id
INNER JOIN "Curso"      c ON c.id = d.curso_id
GROUP BY d.id, d.nome, c.nome
ORDER BY media_nota DESC NULLS LAST;

-- ----------------------------------------------------------------------------
-- R4: Alunos com mais matrículas APROVADAS (top performers).
-- ----------------------------------------------------------------------------
SELECT
    a.nome                              AS aluno,
    COUNT(m.id)                         AS total_aprovadas,
    ROUND(AVG(m.nota)::numeric, 2)     AS media_geral
FROM "Aluno" a
INNER JOIN "Matricula" m ON m.aluno_id = a.id
WHERE m.status = 'APROVADO'
GROUP BY a.id, a.nome
HAVING COUNT(m.id) >= 2
ORDER BY media_geral DESC;

-- ----------------------------------------------------------------------------
-- R5: Alunos REPROVADOS — quem e em quê.
-- ----------------------------------------------------------------------------
SELECT
    a.nome                              AS aluno,
    d.nome                              AS disciplina,
    c.nome                              AS curso,
    m.nota                              AS nota_final
FROM "Matricula" m
INNER JOIN "Aluno"      a ON a.id = m.aluno_id
INNER JOIN "Disciplina" d ON d.id = m.disciplina_id
INNER JOIN "Curso"      c ON c.id = d.curso_id
WHERE m.status = 'REPROVADO'
ORDER BY c.nome, a.nome;

-- ----------------------------------------------------------------------------
-- R6: Carga horária total por aluno (soma das disciplinas matriculadas).
-- ----------------------------------------------------------------------------
SELECT
    a.nome                              AS aluno,
    c.nome                              AS curso,
    COUNT(DISTINCT m.disciplina_id)     AS disciplinas_cursadas,
    SUM(d.carga_horaria)                AS carga_horaria_total
FROM "Aluno" a
INNER JOIN "Matricula"  m ON m.aluno_id = a.id
INNER JOIN "Disciplina" d ON d.id = m.disciplina_id
LEFT  JOIN "Curso"      c ON c.id = a.curso_id
WHERE m.status IN ('CURSANDO', 'APROVADO')
GROUP BY a.id, a.nome, c.nome
ORDER BY carga_horaria_total DESC;

-- ----------------------------------------------------------------------------
-- R7: Disciplinas SEM nenhuma matrícula (candidatas a fechar turma).
-- ----------------------------------------------------------------------------
SELECT
    d.nome                              AS disciplina,
    c.nome                              AS curso,
    d.carga_horaria
FROM "Disciplina" d
INNER JOIN "Curso" c ON c.id = d.curso_id
LEFT JOIN "Matricula" m ON m.disciplina_id = d.id
WHERE m.id IS NULL
ORDER BY c.nome, d.nome;

-- ----------------------------------------------------------------------------
-- R8: Resumo por status (uma linha por status) — sanity check.
-- ----------------------------------------------------------------------------
SELECT
    status,
    COUNT(*) AS total
FROM "Matricula"
GROUP BY status
ORDER BY total DESC;