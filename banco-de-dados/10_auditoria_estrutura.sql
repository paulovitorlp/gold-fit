-- =========================================================
-- 1. CHAVES PRIMÁRIAS
-- Todas as 14 tabelas devem possuir PRIMARY KEY
-- =========================================================

SELECT
    tc.table_name AS tabela,
    kcu.column_name AS coluna_pk,
    tc.constraint_name AS nome_constraint
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

SELECT
    table_name AS tabela
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;