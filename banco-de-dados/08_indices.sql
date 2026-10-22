-- =========================================================
-- BANCO DE DADOS GOLD FIT
-- ARQUIVO: 08_indices.sql
-- ÍNDICES PARA OTIMIZAÇÃO
-- =========================================================


-- =========================================================
-- PRODUTOS
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_produtos_nome
ON produtos(nome);

CREATE INDEX IF NOT EXISTS idx_produtos_categoria
ON produtos(categoria);

CREATE INDEX IF NOT EXISTS idx_produtos_ativo
ON produtos(ativo);


-- =========================================================
-- MODELOS
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_modelos_produto_id
ON modelos_produto(produto_id);

CREATE INDEX IF NOT EXISTS idx_modelos_marca
ON modelos_produto(marca);

CREATE INDEX IF NOT EXISTS idx_modelos_modelo
ON modelos_produto(modelo);


-- =========================================================
-- VARIAÇÕES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_variacoes_modelo_id
ON variacoes_produto(modelo_id);

CREATE INDEX IF NOT EXISTS idx_variacoes_cor
ON variacoes_produto(cor);

CREATE INDEX IF NOT EXISTS idx_variacoes_sku
ON variacoes_produto(sku);


-- =========================================================
-- TAMANHOS
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_tamanhos_variacao_id
ON tamanhos(variacao_id);

CREATE INDEX IF NOT EXISTS idx_tamanhos_tamanho
ON tamanhos(tamanho);


-- =========================================================
-- ESTOQUE
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_estoque_tamanho_id
ON estoque(tamanho_id);

CREATE INDEX IF NOT EXISTS idx_estoque_local
ON estoque(local);

CREATE INDEX IF NOT EXISTS idx_estoque_quantidade
ON estoque(quantidade);


-- =========================================================
-- CLIENTES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_clientes_email
ON clientes(email);

CREATE INDEX IF NOT EXISTS idx_clientes_telefone
ON clientes(telefone);

CREATE INDEX IF NOT EXISTS idx_clientes_cpf
ON clientes(cpf);


-- =========================================================
-- PEDIDOS
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id
ON pedidos(cliente_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_status
ON pedidos(status);

CREATE INDEX IF NOT EXISTS idx_pedidos_data
ON pedidos(data_pedido);

CREATE INDEX IF NOT EXISTS idx_pedidos_canal
ON pedidos(canal_venda);


-- =========================================================
-- ITENS DO PEDIDO
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_itens_pedido_id
ON itens_pedido(pedido_id);

CREATE INDEX IF NOT EXISTS idx_itens_tamanho_id
ON itens_pedido(tamanho_id);


-- =========================================================
-- PAGAMENTOS
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_pagamentos_pedido_id
ON pagamentos(pedido_id);

CREATE INDEX IF NOT EXISTS idx_pagamentos_status
ON pagamentos(status);

CREATE INDEX IF NOT EXISTS idx_pagamentos_transacao
ON pagamentos(codigo_transacao);


-- =========================================================
-- MOVIMENTAÇÕES DE ESTOQUE
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_movimentacoes_tamanho_id
ON movimentacoes_estoque(tamanho_id);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_pedido_id
ON movimentacoes_estoque(pedido_id);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo
ON movimentacoes_estoque(tipo);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_data
ON movimentacoes_estoque(data_movimentacao);


-- =========================================================
-- WHATSAPP
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_atendimentos_telefone
ON atendimentos_whatsapp(telefone);

CREATE INDEX IF NOT EXISTS idx_atendimentos_status
ON atendimentos_whatsapp(status);

CREATE INDEX IF NOT EXISTS idx_mensagens_atendimento_id
ON mensagens_whatsapp(atendimento_id);

CREATE INDEX IF NOT EXISTS idx_mensagens_data
ON mensagens_whatsapp(data_mensagem);