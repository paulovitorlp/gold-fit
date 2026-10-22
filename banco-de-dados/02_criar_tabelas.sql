-- =========================================================
-- BANCO DE DADOS GOLD FIT
-- ARQUIVO: 02_criar_tabelas.sql
-- PostgreSQL
-- =========================================================


-- =========================================================
-- 1. USUÁRIOS DO SISTEMA
-- Admin, gerente e cliente
-- =========================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255),
    perfil VARCHAR(20) NOT NULL DEFAULT 'cliente',
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (perfil IN ('admin', 'gerente', 'cliente'))
);


-- =========================================================
-- 2. CLIENTES
-- Dados dos clientes da loja
-- =========================================================

CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    telefone VARCHAR(30),
    cpf VARCHAR(20),

    cep VARCHAR(10),
    endereco VARCHAR(200),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),

    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 3. PRODUTOS
-- Tipo principal de produto
-- Ex.: Tênis, Camisa Dry Fit, Conjunto Top + Short
-- =========================================================

CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco_base DECIMAL(10,2) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (preco_base >= 0)
);


-- =========================================================
-- 4. MODELOS DOS PRODUTOS
-- Ex.: Nike Revolution 7
-- =========================================================

CREATE TABLE IF NOT EXISTS modelos_produto (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER NOT NULL,

    marca VARCHAR(100),
    modelo VARCHAR(150) NOT NULL,
    estilo VARCHAR(100),

    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 5. VARIAÇÕES DOS PRODUTOS
-- Principalmente cor e SKU
-- =========================================================

CREATE TABLE IF NOT EXISTS variacoes_produto (
    id SERIAL PRIMARY KEY,
    modelo_id INTEGER NOT NULL,

    cor VARCHAR(100) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    preco DECIMAL(10,2),

    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (modelo_id)
        REFERENCES modelos_produto(id)
        ON DELETE CASCADE,

    CHECK (preco IS NULL OR preco >= 0)
);


-- =========================================================
-- 6. TAMANHOS / NUMERAÇÕES
-- Pode armazenar P, M, G, GG ou 36, 37, 38...
-- =========================================================

CREATE TABLE IF NOT EXISTS tamanhos (
    id SERIAL PRIMARY KEY,
    variacao_id INTEGER NOT NULL,

    tamanho VARCHAR(20) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (variacao_id)
        REFERENCES variacoes_produto(id)
        ON DELETE CASCADE,

    UNIQUE (variacao_id, tamanho)
);


-- =========================================================
-- 7. ESTOQUE
-- Quantidade disponível de cada tamanho
-- =========================================================

CREATE TABLE IF NOT EXISTS estoque (
    id SERIAL PRIMARY KEY,
    tamanho_id INTEGER NOT NULL,

    quantidade INTEGER NOT NULL DEFAULT 0,
    local VARCHAR(100) NOT NULL DEFAULT 'Santarém',

    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tamanho_id)
        REFERENCES tamanhos(id)
        ON DELETE CASCADE,

    CHECK (quantidade >= 0),

    UNIQUE (tamanho_id, local)
);


-- =========================================================
-- 8. IMAGENS DOS PRODUTOS
-- Fotos utilizadas no site
-- =========================================================

CREATE TABLE IF NOT EXISTS imagens_produto (
    id SERIAL PRIMARY KEY,

    produto_id INTEGER,
    modelo_id INTEGER,
    variacao_id INTEGER,

    url_imagem TEXT NOT NULL,
    principal BOOLEAN DEFAULT FALSE,

    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE CASCADE,

    FOREIGN KEY (modelo_id)
        REFERENCES modelos_produto(id)
        ON DELETE CASCADE,

    FOREIGN KEY (variacao_id)
        REFERENCES variacoes_produto(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 9. PEDIDOS
-- Vendas realizadas pelo site, WhatsApp ou loja
-- =========================================================

CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,

    cliente_id INTEGER,

    canal_venda VARCHAR(30) NOT NULL DEFAULT 'site',

    status VARCHAR(30) NOT NULL DEFAULT 'pendente',

    valor_produtos DECIMAL(10,2) NOT NULL DEFAULT 0,
    valor_frete DECIMAL(10,2) NOT NULL DEFAULT 0,
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,

    cep_entrega VARCHAR(10),
    endereco_entrega VARCHAR(200),
    numero_entrega VARCHAR(20),
    complemento_entrega VARCHAR(100),
    bairro_entrega VARCHAR(100),
    cidade_entrega VARCHAR(100),
    estado_entrega VARCHAR(2),

    codigo_rastreio VARCHAR(100),

    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cliente_id)
        REFERENCES clientes(id),

    CHECK (
        canal_venda IN (
            'site',
            'whatsapp',
            'loja_fisica'
        )
    ),

    CHECK (
        status IN (
            'pendente',
            'aguardando_pagamento',
            'pago',
            'separando',
            'enviado',
            'entregue',
            'cancelado'
        )
    ),

    CHECK (valor_produtos >= 0),
    CHECK (valor_frete >= 0),
    CHECK (valor_total >= 0)
);


-- =========================================================
-- 10. ITENS DO PEDIDO
-- Produtos específicos vendidos
-- =========================================================

CREATE TABLE IF NOT EXISTS itens_pedido (
    id SERIAL PRIMARY KEY,

    pedido_id INTEGER NOT NULL,
    tamanho_id INTEGER NOT NULL,

    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE,

    FOREIGN KEY (tamanho_id)
        REFERENCES tamanhos(id),

    CHECK (quantidade > 0),
    CHECK (preco_unitario >= 0)
);


-- =========================================================
-- 11. PAGAMENTOS
-- Informações dos pagamentos
-- =========================================================

CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,

    pedido_id INTEGER NOT NULL,

    forma_pagamento VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pendente',

    valor DECIMAL(10,2) NOT NULL,

    codigo_transacao VARCHAR(150),

    data_pagamento TIMESTAMP,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE,

    CHECK (
        forma_pagamento IN (
            'pix',
            'cartao',
            'dinheiro',
            'outro'
        )
    ),

    CHECK (
        status IN (
            'pendente',
            'aprovado',
            'recusado',
            'cancelado',
            'estornado'
        )
    ),

    CHECK (valor >= 0)
);


-- =========================================================
-- 12. MOVIMENTAÇÕES DE ESTOQUE
-- Histórico de entradas e saídas
-- =========================================================

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id SERIAL PRIMARY KEY,

    tamanho_id INTEGER NOT NULL,
    usuario_id INTEGER,
    pedido_id INTEGER,

    tipo VARCHAR(20) NOT NULL,
    quantidade INTEGER NOT NULL,

    observacao TEXT,

    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tamanho_id)
        REFERENCES tamanhos(id),

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id),

    CHECK (
        tipo IN (
            'entrada',
            'saida',
            'venda',
            'ajuste',
            'devolucao'
        )
    ),

    CHECK (quantidade > 0)
);


-- =========================================================
-- 13. ATENDIMENTOS PELO WHATSAPP
-- Conversas do cliente com o agente de IA
-- =========================================================

CREATE TABLE IF NOT EXISTS atendimentos_whatsapp (
    id SERIAL PRIMARY KEY,

    cliente_id INTEGER,

    telefone VARCHAR(30) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'aberto',

    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_finalizacao TIMESTAMP,

    FOREIGN KEY (cliente_id)
        REFERENCES clientes(id),

    CHECK (
        status IN (
            'aberto',
            'atendimento_ia',
            'atendimento_humano',
            'finalizado'
        )
    )
);


-- =========================================================
-- 14. MENSAGENS DO WHATSAPP
-- Histórico das mensagens
-- =========================================================

CREATE TABLE IF NOT EXISTS mensagens_whatsapp (
    id SERIAL PRIMARY KEY,

    atendimento_id INTEGER NOT NULL,

    origem VARCHAR(20) NOT NULL,

    mensagem TEXT NOT NULL,

    data_mensagem TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (atendimento_id)
        REFERENCES atendimentos_whatsapp(id)
        ON DELETE CASCADE,

    CHECK (
        origem IN (
            'cliente',
            'ia',
            'atendente'
        )
    )
);