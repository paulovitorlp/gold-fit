-- =========================================================
-- BANCO DE DADOS GOLD FIT
-- ARQUIVO: 07_views.sql
-- VIEWS DO SISTEMA
-- =========================================================


-- =========================================================
-- 1. CATÁLOGO COMPLETO
-- Produto → modelo → cor → tamanho → estoque
-- =========================================================

CREATE OR REPLACE VIEW vw_catalogo_completo AS

SELECT
    p.id AS produto_id,
    p.nome AS produto,
    p.categoria,
    p.descricao,

    mp.id AS modelo_id,
    mp.marca,
    mp.modelo,
    mp.estilo,

    vp.id AS variacao_id,
    vp.cor,
    vp.sku,

    COALESCE(vp.preco, p.preco_base) AS preco,

    t.id AS tamanho_id,
    t.tamanho,

    COALESCE(e.quantidade, 0) AS quantidade,

    COALESCE(e.local, 'Santarém') AS local,

    CASE
        WHEN COALESCE(e.quantidade, 0) > 0
            THEN 'Disponível'
        ELSE
            'Indisponível'
    END AS disponibilidade

FROM produtos p

JOIN modelos_produto mp
    ON mp.produto_id = p.id

JOIN variacoes_produto vp
    ON vp.modelo_id = mp.id

JOIN tamanhos t
    ON t.variacao_id = vp.id

LEFT JOIN estoque e
    ON e.tamanho_id = t.id

WHERE
    p.ativo = TRUE
    AND mp.ativo = TRUE
    AND vp.ativo = TRUE
    AND t.ativo = TRUE;



-- =========================================================
-- 2. PRODUTOS DISPONÍVEIS
-- Mostra somente itens que possuem estoque
-- =========================================================

CREATE OR REPLACE VIEW vw_produtos_disponiveis AS

SELECT
    produto_id,
    produto,
    categoria,
    marca,
    modelo,
    estilo,
    cor,
    sku,
    preco,
    tamanho_id,
    tamanho,
    quantidade,
    local

FROM vw_catalogo_completo

WHERE quantidade > 0;



-- =========================================================
-- 3. CATÁLOGO PARA O AGENTE DE IA
--
-- Essa view será útil futuramente para perguntas como:
-- "Tem conjunto terracota tamanho G?"
-- =========================================================

CREATE OR REPLACE VIEW vw_catalogo_ia AS

SELECT
    produto,
    categoria,
    marca,
    modelo,
    estilo,
    cor,
    tamanho,
    preco,
    quantidade,
    local,
    disponibilidade,
    sku

FROM vw_catalogo_completo;



-- =========================================================
-- 4. RESUMO DOS PEDIDOS
-- =========================================================

CREATE OR REPLACE VIEW vw_resumo_pedidos AS

SELECT
    ped.id AS pedido_id,

    ped.data_pedido,

    c.id AS cliente_id,
    c.nome AS cliente,
    c.telefone,

    ped.canal_venda,
    ped.status AS status_pedido,

    COUNT(ip.id) AS tipos_itens,

    COALESCE(
        SUM(ip.quantidade),
        0
    ) AS quantidade_total_itens,

    ped.valor_produtos,
    ped.valor_frete,
    ped.valor_total,

    (
        SELECT pg.status
        FROM pagamentos pg
        WHERE pg.pedido_id = ped.id
        ORDER BY pg.id DESC
        LIMIT 1
    ) AS status_pagamento,

    (
        SELECT pg.forma_pagamento
        FROM pagamentos pg
        WHERE pg.pedido_id = ped.id
        ORDER BY pg.id DESC
        LIMIT 1
    ) AS forma_pagamento

FROM pedidos ped

LEFT JOIN clientes c
    ON c.id = ped.cliente_id

LEFT JOIN itens_pedido ip
    ON ip.pedido_id = ped.id

GROUP BY
    ped.id,
    ped.data_pedido,
    c.id,
    c.nome,
    c.telefone,
    ped.canal_venda,
    ped.status,
    ped.valor_produtos,
    ped.valor_frete,
    ped.valor_total;



-- =========================================================
-- 5. HISTÓRICO DE MOVIMENTAÇÕES DO ESTOQUE
-- =========================================================

CREATE OR REPLACE VIEW vw_historico_estoque AS

SELECT
    me.id AS movimentacao_id,

    me.data_movimentacao,

    p.nome AS produto,
    mp.marca,
    mp.modelo,
    vp.cor,
    t.tamanho,

    me.tipo,
    me.quantidade,

    me.pedido_id,

    u.nome AS usuario,

    me.observacao

FROM movimentacoes_estoque me

JOIN tamanhos t
    ON t.id = me.tamanho_id

JOIN variacoes_produto vp
    ON vp.id = t.variacao_id

JOIN modelos_produto mp
    ON mp.id = vp.modelo_id

JOIN produtos p
    ON p.id = mp.produto_id

LEFT JOIN usuarios u
    ON u.id = me.usuario_id;



-- =========================================================
-- 6. ESTOQUE ATUAL
-- =========================================================

CREATE OR REPLACE VIEW vw_estoque_atual AS

SELECT
    p.nome AS produto,
    mp.marca,
    mp.modelo,
    vp.cor,
    vp.sku,
    t.tamanho,
    e.quantidade,
    e.local,
    e.data_atualizacao

FROM estoque e

JOIN tamanhos t
    ON t.id = e.tamanho_id

JOIN variacoes_produto vp
    ON vp.id = t.variacao_id

JOIN modelos_produto mp
    ON mp.id = vp.modelo_id

JOIN produtos p
    ON p.id = mp.produto_id;