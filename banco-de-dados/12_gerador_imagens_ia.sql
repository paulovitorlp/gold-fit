
-- =====================================================
-- GOLD FIT - MODULO DE GERACAO DE IMAGENS COM IA
-- Versao inicial: modelos femininos
-- PostgreSQL 16
-- =====================================================

BEGIN;

-- =====================================================
-- 1. MODELOS VIRTUAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.modelos_virtuais (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    codigo VARCHAR(10) NOT NULL UNIQUE,
    nome VARCHAR(80) NOT NULL,

    genero VARCHAR(15) NOT NULL DEFAULT 'feminino'
        CHECK (genero IN ('feminino', 'masculino')),

    descricao TEXT,

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_modelo_nome
        CHECK (LENGTH(TRIM(nome)) > 0)
);

-- =====================================================
-- 2. FOTOGRAFIAS DAS MODELOS
-- =====================================================

CREATE TABLE IF NOT EXISTS
public.referencias_modelos_virtuais (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    modelo_virtual_id BIGINT NOT NULL
        REFERENCES public.modelos_virtuais(id)
        ON DELETE CASCADE,

    tipo VARCHAR(25) NOT NULL
        CHECK (
            tipo IN (
                'principal',
                'rosto',
                'frente',
                'costas',
                'lateral',
                'corpo_inteiro'
            )
        ),

    caminho_arquivo TEXT NOT NULL,

    principal BOOLEAN NOT NULL DEFAULT FALSE,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_referencia_caminho
        CHECK (LENGTH(TRIM(caminho_arquivo)) > 0)
);

-- Cada modelo pode ter apenas uma foto principal.

CREATE UNIQUE INDEX IF NOT EXISTS
idx_modelo_foto_principal
ON public.referencias_modelos_virtuais
(modelo_virtual_id)
WHERE principal = TRUE;

CREATE INDEX IF NOT EXISTS
idx_referencias_modelo_id
ON public.referencias_modelos_virtuais
(modelo_virtual_id);

-- =====================================================
-- 3. SOLICITACOES DE GERACAO
-- Cada registro representa uma cor e um angulo.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.geracoes_imagens_ia (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    produto_id INTEGER
        REFERENCES public.produtos(id)
        ON DELETE SET NULL,

    nome_produto VARCHAR(150) NOT NULL,

    categoria VARCHAR(100),
    tecido VARCHAR(100),

    modelo_virtual_id BIGINT NOT NULL
        REFERENCES public.modelos_virtuais(id),

    cor_nome VARCHAR(60) NOT NULL,

    cor_hex VARCHAR(7) NOT NULL
        CHECK (cor_hex ~ '^#[0-9A-Fa-f]{6}$'),

    angulo VARCHAR(20) NOT NULL
        CHECK (
            angulo IN (
                'frente',
                'costas',
                'lado',
                'detalhes'
            )
        ),

    detalhes_produto TEXT,

    referencias JSONB NOT NULL DEFAULT '{}'::JSONB,

    prompt TEXT,
    versao_prompt VARCHAR(50)
        NOT NULL DEFAULT 'GOLD-FIT-IMAGE-V1',

    status VARCHAR(20) NOT NULL DEFAULT 'rascunho'
        CHECK (
            status IN (
                'rascunho',
                'fila',
                'processando',
                'concluida',
                'erro'
            )
        ),

    mensagem_erro TEXT,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS
idx_geracoes_modelo
ON public.geracoes_imagens_ia(modelo_virtual_id);

CREATE INDEX IF NOT EXISTS
idx_geracoes_status
ON public.geracoes_imagens_ia(status);

-- =====================================================
-- 4. RESULTADOS GERADOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.imagens_geradas_ia (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    geracao_id BIGINT NOT NULL
        REFERENCES public.geracoes_imagens_ia(id)
        ON DELETE CASCADE,

    caminho_arquivo TEXT NOT NULL,

    status_revisao VARCHAR(20)
        NOT NULL DEFAULT 'pendente'
        CHECK (
            status_revisao IN (
                'pendente',
                'aprovada',
                'rejeitada'
            )
        ),

    observacao_revisao TEXT,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revisado_em TIMESTAMPTZ,

    CONSTRAINT ck_imagem_gerada_caminho
        CHECK (LENGTH(TRIM(caminho_arquivo)) > 0)
);

CREATE INDEX IF NOT EXISTS
idx_imagens_geracao
ON public.imagens_geradas_ia(geracao_id);

-- =====================================================
-- 5. CADASTRAR AS CINCO MODELOS FEMININAS
-- Nomes iniciais, editaveis futuramente.
-- =====================================================

INSERT INTO public.modelos_virtuais
    (codigo, nome, genero)
VALUES
    ('F01', 'Helena', 'feminino'),
    ('F02', 'Camila', 'feminino'),
    ('F03', 'Beatriz', 'feminino'),
    ('F04', 'Rafaela', 'feminino'),
    ('F05', 'Isabela', 'feminino')
ON CONFLICT (codigo) DO NOTHING;

COMMIT;

-- =====================================================
-- 6. CONFERIR OS MODELOS CADASTRADOS
-- =====================================================

SELECT
    m.id,
    m.codigo,
    m.nome,
    m.genero,
    m.ativo,
    r.caminho_arquivo AS foto_principal
FROM public.modelos_virtuais AS m
LEFT JOIN public.referencias_modelos_virtuais AS r
    ON r.modelo_virtual_id = m.id
    AND r.principal = TRUE
WHERE m.genero = 'feminino'
ORDER BY m.codigo;
