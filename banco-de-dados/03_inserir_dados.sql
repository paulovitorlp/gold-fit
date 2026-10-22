-- =========================================================
-- DADOS INICIAIS - GOLD FIT
-- PRODUTO: CONJUNTO TOP E SHORT CANELADO
-- =========================================================


-- 1. PRODUTO
INSERT INTO produtos
(nome, categoria, descricao, preco_base)
SELECT
    'Conjunto Top e Short Canelado',
    'Feminino',
    'Conjunto feminino canelado composto por top e short.',
    160.00
WHERE NOT EXISTS (
    SELECT 1
    FROM produtos
    WHERE nome = 'Conjunto Top e Short Canelado'
);


-- 2. MODELO / MARCA
INSERT INTO modelos_produto
(produto_id, marca, modelo, estilo)
SELECT
    p.id,
    'ALO',
    'Canelado',
    'Fitness'
FROM produtos p
WHERE p.nome = 'Conjunto Top e Short Canelado'
AND NOT EXISTS (
    SELECT 1
    FROM modelos_produto mp
    WHERE mp.produto_id = p.id
      AND mp.marca = 'ALO'
      AND mp.modelo = 'Canelado'
);


-- 3. COR MARROM
INSERT INTO variacoes_produto
(modelo_id, cor, sku, preco)
SELECT
    mp.id,
    'Marrom',
    'CTS-ALO-CAN-MARROM',
    160.00
FROM modelos_produto mp
JOIN produtos p
    ON p.id = mp.produto_id
WHERE p.nome = 'Conjunto Top e Short Canelado'
  AND mp.marca = 'ALO'
  AND mp.modelo = 'Canelado'
AND NOT EXISTS (
    SELECT 1
    FROM variacoes_produto
    WHERE sku = 'CTS-ALO-CAN-MARROM'
);


-- 4. COR TERRACOTA
INSERT INTO variacoes_produto
(modelo_id, cor, sku, preco)
SELECT
    mp.id,
    'Terracota',
    'CTS-ALO-CAN-TERRACOTA',
    160.00
FROM modelos_produto mp
JOIN produtos p
    ON p.id = mp.produto_id
WHERE p.nome = 'Conjunto Top e Short Canelado'
  AND mp.marca = 'ALO'
  AND mp.modelo = 'Canelado'
AND NOT EXISTS (
    SELECT 1
    FROM variacoes_produto
    WHERE sku = 'CTS-ALO-CAN-TERRACOTA'
);


-- 5. TAMANHOS MARROM
INSERT INTO tamanhos
(variacao_id, tamanho)
SELECT
    vp.id,
    t.tamanho
FROM variacoes_produto vp
CROSS JOIN (
    VALUES ('P'), ('M'), ('G'), ('GG')
) AS t(tamanho)
WHERE vp.sku = 'CTS-ALO-CAN-MARROM'
AND NOT EXISTS (
    SELECT 1
    FROM tamanhos ta
    WHERE ta.variacao_id = vp.id
      AND ta.tamanho = t.tamanho
);


-- 6. TAMANHOS TERRACOTA
INSERT INTO tamanhos
(variacao_id, tamanho)
SELECT
    vp.id,
    t.tamanho
FROM variacoes_produto vp
CROSS JOIN (
    VALUES ('P'), ('M'), ('G'), ('GG')
) AS t(tamanho)
WHERE vp.sku = 'CTS-ALO-CAN-TERRACOTA'
AND NOT EXISTS (
    SELECT 1
    FROM tamanhos ta
    WHERE ta.variacao_id = vp.id
      AND ta.tamanho = t.tamanho
);


-- 7. ESTOQUE INICIAL ZERADO
INSERT INTO estoque
(tamanho_id, quantidade, local)
SELECT
    t.id,
    0,
    'Santarém'
FROM tamanhos t
JOIN variacoes_produto vp
    ON vp.id = t.variacao_id
WHERE vp.sku IN (
    'CTS-ALO-CAN-MARROM',
    'CTS-ALO-CAN-TERRACOTA'
)
AND NOT EXISTS (
    SELECT 1
    FROM estoque e
    WHERE e.tamanho_id = t.id
      AND e.local = 'Santarém'
);