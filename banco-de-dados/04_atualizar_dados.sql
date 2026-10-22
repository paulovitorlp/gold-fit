-- =========================================================
-- ATUALIZAÇÃO DO PRODUTO
-- Conjunto Top + Short
-- para
-- Conjunto Top e Short Canelado
-- =========================================================


BEGIN;


-- 1. ATUALIZA O NOME E A DESCRIÇÃO DO PRODUTO

UPDATE produtos
SET
    nome = 'Conjunto Top e Short Canelado',
    descricao = 'Conjunto feminino canelado composto por top e short.'
WHERE nome = 'Conjunto Top + Short';


-- 2. CONFERE O PRODUTO ATUALIZADO

SELECT
    id,
    nome,
    categoria,
    descricao,
    preco_base,
    ativo
FROM produtos
WHERE nome = 'Conjunto Top e Short Canelado';


-- 3. CONFERE O MODELO VINCULADO

SELECT
    mp.id,
    p.nome AS produto,
    mp.marca,
    mp.modelo,
    mp.estilo,
    mp.ativo
FROM modelos_produto mp
JOIN produtos p
    ON p.id = mp.produto_id
WHERE p.nome = 'Conjunto Top e Short Canelado';


-- 4. CONFERE AS CORES / VARIAÇÕES

SELECT
    p.nome AS produto,
    mp.marca,
    mp.modelo,
    vp.cor,
    vp.sku,
    vp.preco
FROM variacoes_produto vp
JOIN modelos_produto mp
    ON mp.id = vp.modelo_id
JOIN produtos p
    ON p.id = mp.produto_id
WHERE p.nome = 'Conjunto Top e Short Canelado';


-- 5. CONFERE TAMANHOS E ESTOQUE

SELECT
    p.nome AS produto,
    mp.marca,
    mp.modelo,
    vp.cor,
    t.tamanho,
    e.quantidade,
    e.local
FROM estoque e
JOIN tamanhos t
    ON t.id = e.tamanho_id
JOIN variacoes_produto vp
    ON vp.id = t.variacao_id
JOIN modelos_produto mp
    ON mp.id = vp.modelo_id
JOIN produtos p
    ON p.id = mp.produto_id
WHERE p.nome = 'Conjunto Top e Short Canelado'
ORDER BY
    vp.cor,
    t.tamanho;


COMMIT;