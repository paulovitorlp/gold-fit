-- =========================================================
-- CONSULTA COMPLETA DO PRODUTO
-- =========================================================

SELECT
    p.nome AS produto,
    mp.marca,
    mp.modelo,
    vp.cor,
    vp.sku,
    t.tamanho,
    e.quantidade,
    e.local
FROM produtos p
JOIN modelos_produto mp
    ON mp.produto_id = p.id
JOIN variacoes_produto vp
    ON vp.modelo_id = mp.id
JOIN tamanhos t
    ON t.variacao_id = vp.id
LEFT JOIN estoque e
    ON e.tamanho_id = t.id
WHERE p.nome = 'Conjunto Top e Short Canelado'
ORDER BY
    vp.cor,
    t.tamanho;

    -- =========================================================
-- VERIFICAR FUNÇÕES
-- =========================================================

SELECT
    proname AS funcao
FROM pg_proc
WHERE proname IN (
    'atualizar_data_estoque',
    'processar_pagamento_aprovado'
);


-- =========================================================
-- VERIFICAR TRIGGERS
-- =========================================================

SELECT
    tgname AS trigger,
    tgrelid::regclass AS tabela,
    tgenabled AS ativo
FROM pg_trigger
WHERE tgname IN (
    'trg_atualizar_data_estoque',
    'trg_processar_pagamento_aprovado'
)
AND NOT tgisinternal;

SELECT
    table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT *
FROM vw_catalogo_ia;