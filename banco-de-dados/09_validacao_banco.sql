-- =========================================================
-- BANCO DE DADOS GOLD FIT
-- ARQUIVO: 09_validacao_banco.sql
-- VALIDAÇÃO FINAL DO BANCO
-- =========================================================


-- =========================================================
-- 1. VERIFICAR AS TABELAS
-- Esperado: 14 tabelas
-- =========================================================

SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;


-- =========================================================
-- 2. VERIFICAR AS VIEWS
-- Esperado: 6 views
-- =========================================================

SELECT
    table_name AS view
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;


-- =========================================================
-- 3. VERIFICAR AS FUNÇÕES
-- Esperado: 2 funções
-- =========================================================

SELECT
    proname AS funcao
FROM pg_proc
WHERE proname IN (
    'atualizar_data_estoque',
    'processar_pagamento_aprovado'
)
ORDER BY proname;


-- =========================================================
-- 4. VERIFICAR OS TRIGGERS
-- Esperado: 2 triggers ativos
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
AND NOT tgisinternal
ORDER BY tgname;


-- =========================================================
-- 5. VERIFICAR O CATÁLOGO
-- Esperado atualmente: 8 registros
-- =========================================================

SELECT
    produto,
    marca,
    modelo,
    cor,
    tamanho,
    preco,
    quantidade,
    disponibilidade
FROM vw_catalogo_ia
ORDER BY cor, tamanho;


-- =========================================================
-- 6. VERIFICAR ÍNDICES CRIADOS
-- =========================================================

SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;



-- =========================================================
-- 7. TESTE CONTROLADO DE VENDA
--
-- IMPORTANTE:
-- Tudo abaixo acontece dentro de uma transação.
-- Ao final usamos ROLLBACK.
--
-- Portanto:
-- - cliente de teste não permanece
-- - pedido de teste não permanece
-- - pagamento de teste não permanece
-- - movimentação não permanece
-- - estoque volta ao valor anterior
-- =========================================================

BEGIN;


-- =========================================================
-- 7.1 TABELA TEMPORÁRIA PARA GUARDAR IDS DO TESTE
-- =========================================================

CREATE TEMP TABLE tmp_validacao_goldfit (
    cliente_id INTEGER,
    pedido_id INTEGER,
    pagamento_id INTEGER,
    tamanho_id INTEGER
);


-- =========================================================
-- 7.2 LOCALIZAR:
-- Conjunto Top e Short Canelado
-- Terracota
-- Tamanho G
-- =========================================================

INSERT INTO tmp_validacao_goldfit (tamanho_id)

SELECT
    t.id

FROM produtos p

JOIN modelos_produto mp
    ON mp.produto_id = p.id

JOIN variacoes_produto vp
    ON vp.modelo_id = mp.id

JOIN tamanhos t
    ON t.variacao_id = vp.id

WHERE p.nome = 'Conjunto Top e Short Canelado'
  AND vp.cor = 'Terracota'
  AND t.tamanho = 'G'

LIMIT 1;


-- =========================================================
-- 7.3 COLOCAR 2 UNIDADES APENAS DURANTE O TESTE
-- =========================================================

UPDATE estoque

SET quantidade = 2

WHERE tamanho_id = (
    SELECT tamanho_id
    FROM tmp_validacao_goldfit
)
AND local = 'Santarém';


-- Conferir:
-- esperado = 2
SELECT
    vp.cor,
    t.tamanho,
    e.quantidade

FROM estoque e

JOIN tamanhos t
    ON t.id = e.tamanho_id

JOIN variacoes_produto vp
    ON vp.id = t.variacao_id

WHERE t.id = (
    SELECT tamanho_id
    FROM tmp_validacao_goldfit
);



-- =========================================================
-- 7.4 CRIAR CLIENTE DE TESTE
-- =========================================================

WITH novo_cliente AS (

    INSERT INTO clientes
    (
        nome,
        email,
        telefone
    )

    VALUES
    (
        'Cliente Teste Validação',
        'validacao@goldfit.local',
        '00000000000'
    )

    RETURNING id
)

UPDATE tmp_validacao_goldfit

SET cliente_id = (
    SELECT id
    FROM novo_cliente
);



-- =========================================================
-- 7.5 CRIAR PEDIDO DE TESTE
-- =========================================================

WITH novo_pedido AS (

    INSERT INTO pedidos
    (
        cliente_id,
        canal_venda,
        status,
        valor_produtos,
        valor_frete,
        valor_total
    )

    SELECT
        cliente_id,
        'site',
        'pendente',
        160.00,
        0.00,
        160.00

    FROM tmp_validacao_goldfit

    RETURNING id
)

UPDATE tmp_validacao_goldfit

SET pedido_id = (
    SELECT id
    FROM novo_pedido
);



-- =========================================================
-- 7.6 ADICIONAR PRODUTO AO PEDIDO
-- =========================================================

INSERT INTO itens_pedido
(
    pedido_id,
    tamanho_id,
    quantidade,
    preco_unitario
)

SELECT
    pedido_id,
    tamanho_id,
    1,
    160.00

FROM tmp_validacao_goldfit;



-- =========================================================
-- 7.7 CRIAR PAGAMENTO PENDENTE
-- =========================================================

WITH novo_pagamento AS (

    INSERT INTO pagamentos
    (
        pedido_id,
        forma_pagamento,
        status,
        valor
    )

    SELECT
        pedido_id,
        'pix',
        'pendente',
        160.00

    FROM tmp_validacao_goldfit

    RETURNING id
)

UPDATE tmp_validacao_goldfit

SET pagamento_id = (
    SELECT id
    FROM novo_pagamento
);



-- =========================================================
-- 7.8 VERIFICAR ESTOQUE ANTES DA APROVAÇÃO
--
-- Esperado:
-- quantidade = 2
--
-- O pagamento ainda está pendente.
-- =========================================================

SELECT
    e.quantidade AS estoque_antes_pagamento

FROM estoque e

WHERE e.tamanho_id = (
    SELECT tamanho_id
    FROM tmp_validacao_goldfit
);



-- =========================================================
-- 7.9 APROVAR O PAGAMENTO
--
-- Aqui o trigger deverá:
-- - diminuir o estoque
-- - marcar pedido como pago
-- - registrar movimentação
-- =========================================================

UPDATE pagamentos

SET
    status = 'aprovado',
    data_pagamento = CURRENT_TIMESTAMP

WHERE id = (
    SELECT pagamento_id
    FROM tmp_validacao_goldfit
);



-- =========================================================
-- 7.10 VERIFICAR ESTOQUE APÓS PAGAMENTO
--
-- Esperado:
-- 2 → 1
-- =========================================================

SELECT
    e.quantidade AS estoque_depois_pagamento

FROM estoque e

WHERE e.tamanho_id = (
    SELECT tamanho_id
    FROM tmp_validacao_goldfit
);



-- =========================================================
-- 7.11 VERIFICAR STATUS DO PEDIDO
--
-- Esperado:
-- pago
-- =========================================================

SELECT
    id AS pedido,
    status

FROM pedidos

WHERE id = (
    SELECT pedido_id
    FROM tmp_validacao_goldfit
);



-- =========================================================
-- 7.12 VERIFICAR PAGAMENTO
--
-- Esperado:
-- aprovado
-- =========================================================

SELECT
    id AS pagamento,
    forma_pagamento,
    status,
    valor

FROM pagamentos

WHERE id = (
    SELECT pagamento_id
    FROM tmp_validacao_goldfit
);



-- =========================================================
-- 7.13 VERIFICAR MOVIMENTAÇÃO DO ESTOQUE
--
-- Esperado:
-- tipo = venda
-- quantidade = 1
-- =========================================================

SELECT
    tipo,
    quantidade,
    pedido_id,
    observacao

FROM movimentacoes_estoque

WHERE pedido_id = (
    SELECT pedido_id
    FROM tmp_validacao_goldfit
);



-- =========================================================
-- 7.14 DESFAZER TODO O TESTE
-- =========================================================

ROLLBACK;



-- =========================================================
-- 8. VERIFICAÇÃO FINAL
--
-- Depois do ROLLBACK o estoque deve voltar
-- exatamente ao valor que possuía antes do teste.
-- =========================================================

SELECT
    produto,
    cor,
    tamanho,
    quantidade,
    disponibilidade

FROM vw_catalogo_ia

WHERE produto = 'Conjunto Top e Short Canelado'

ORDER BY cor, tamanho;