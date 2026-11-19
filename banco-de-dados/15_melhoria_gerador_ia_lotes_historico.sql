
-- ================================================================
-- GOLD FIT PRO | MIGRACAO 15 - LOTES E HISTORICO DO GERADOR IA
-- Banco: PostgreSQL 16
-- Executar DEPOIS dos scripts 12 e 13.
-- Nao apaga modelos, fotografias ou geracoes existentes.
-- ================================================================

BEGIN;

-- 1. METADADOS DAS MODELOS

ALTER TABLE public.modelos_virtuais
    ADD COLUMN IF NOT EXISTS calcado_padrao
        VARCHAR(100) NOT NULL DEFAULT 'tenis branco',
    ADD COLUMN IF NOT EXISTS instrucoes_identidade TEXT;


-- 2. LOTES DE GERACAO
-- Um lote agrupa os angulos de um mesmo produto.

CREATE TABLE IF NOT EXISTS public.lotes_geracao_ia (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    modelo_virtual_id BIGINT NOT NULL
        REFERENCES public.modelos_virtuais(id)
        ON DELETE RESTRICT,

    estilo_id BIGINT
        REFERENCES public.estilos_geracao_ia(id)
        ON DELETE SET NULL,

    nome_produto VARCHAR(150)
        NOT NULL DEFAULT 'Produto enviado',

    categoria VARCHAR(100),
    tecido VARCHAR(100),

    foto_produto_original TEXT,
    detalhes_produto TEXT,

    angulos_solicitados TEXT[]
        NOT NULL DEFAULT ARRAY['frente']::TEXT[],

    status VARCHAR(20)
        NOT NULL DEFAULT 'pendente'
        CHECK (
            status IN (
                'pendente',
                'processando',
                'parcial',
                'concluida',
                'erro'
            )
        ),

    mensagem_erro TEXT,

    criado_em TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    atualizado_em TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_lotes_geracao_angulos
        CHECK (
            CARDINALITY(angulos_solicitados) BETWEEN 1 AND 4
            AND angulos_solicitados <@
                ARRAY[
                    'frente',
                    'costas',
                    'lado',
                    'superior'
                ]::TEXT[]
        ),

    CONSTRAINT ck_lotes_geracao_nome_produto
        CHECK (LENGTH(TRIM(nome_produto)) > 0)
);

CREATE INDEX IF NOT EXISTS
    idx_lotes_geracao_modelo_data
ON public.lotes_geracao_ia (
    modelo_virtual_id,
    criado_em DESC
);

CREATE INDEX IF NOT EXISTS
    idx_lotes_geracao_status
ON public.lotes_geracao_ia (
    status,
    criado_em DESC
);


-- 3. VINCULAR GERACOES EXISTENTES AOS LOTES
-- Registros antigos permanecem preservados.

ALTER TABLE public.geracoes_imagens_ia
    ADD COLUMN IF NOT EXISTS lote_id BIGINT
        REFERENCES public.lotes_geracao_ia(id)
        ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS
    idx_geracoes_imagens_lote
ON public.geracoes_imagens_ia (
    lote_id,
    criado_em DESC
);


-- 4. PERMITIR O ANGULO SUPERIOR
-- Mantem 'detalhes' para compatibilidade antiga.

ALTER TABLE public.geracoes_imagens_ia
    DROP CONSTRAINT IF EXISTS
        geracoes_imagens_ia_angulo_check;

ALTER TABLE public.geracoes_imagens_ia
    DROP CONSTRAINT IF EXISTS
        ck_geracoes_imagens_ia_angulo_v2;

ALTER TABLE public.geracoes_imagens_ia
    ADD CONSTRAINT ck_geracoes_imagens_ia_angulo_v2
    CHECK (
        angulo IN (
            'frente',
            'costas',
            'lado',
            'superior',
            'detalhes'
        )
    );


-- 5. AMPLIAR O HISTORICO DE ARQUIVOS

ALTER TABLE public.imagens_geradas_ia
    ADD COLUMN IF NOT EXISTS angulo VARCHAR(20),
    ADD COLUMN IF NOT EXISTS tamanho_bytes BIGINT,
    ADD COLUMN IF NOT EXISTS largura_px INTEGER,
    ADD COLUMN IF NOT EXISTS altura_px INTEGER;

ALTER TABLE public.imagens_geradas_ia
    DROP CONSTRAINT IF EXISTS
        ck_imagens_geradas_ia_angulo_v2;

ALTER TABLE public.imagens_geradas_ia
    ADD CONSTRAINT ck_imagens_geradas_ia_angulo_v2
    CHECK (
        angulo IS NULL
        OR angulo IN (
            'frente',
            'costas',
            'lado',
            'superior',
            'detalhes'
        )
    );


-- 6. IDENTIFICAR O ANGULO DE ARQUIVOS ANTIGOS

UPDATE public.imagens_geradas_ia AS i
SET angulo = g.angulo
FROM public.geracoes_imagens_ia AS g
WHERE i.geracao_id = g.id
  AND i.angulo IS NULL;

CREATE INDEX IF NOT EXISTS
    idx_imagens_geradas_angulo
ON public.imagens_geradas_ia (
    geracao_id,
    angulo
);


-- 7. VISAO PARA CONFERIR AS FOTOS DAS MODELOS

CREATE OR REPLACE VIEW
public.v_modelos_referencias_ia AS

SELECT
    m.id AS modelo_id,
    m.codigo,
    m.nome,
    m.calcado_padrao,

    COUNT(r.id) AS total_fotos,

    COUNT(r.id)
        FILTER (WHERE r.tipo = 'rosto')
        AS fotos_rosto,

    COUNT(r.id)
        FILTER (WHERE r.tipo = 'frente')
        AS fotos_frente,

    COUNT(r.id)
        FILTER (WHERE r.tipo = 'costas')
        AS fotos_costas,

    COUNT(r.id)
        FILTER (WHERE r.tipo = 'lateral')
        AS fotos_lateral,

    COUNT(r.id)
        FILTER (WHERE r.tipo = 'superior')
        AS fotos_superior,

    MAX(r.caminho_arquivo)
        FILTER (WHERE r.principal)
        AS foto_principal

FROM public.modelos_virtuais AS m

JOIN public.referencias_estilo_modelo_ia AS r
    ON r.modelo_virtual_id = m.id

JOIN public.estilos_geracao_ia AS e
    ON e.id = r.estilo_id

WHERE m.genero = 'feminino'
  AND e.codigo = 'top_legging_poliamida_lisa'

GROUP BY
    m.id,
    m.codigo,
    m.nome,
    m.calcado_padrao;

COMMIT;


-- 8. VERIFICAR AS REFERENCIAS

SELECT
    codigo,
    nome,
    total_fotos,
    fotos_rosto,
    fotos_frente,
    fotos_costas,
    fotos_lateral,
    fotos_superior

FROM public.v_modelos_referencias_ia
ORDER BY codigo;


-- 9. VERIFICAR A QUANTIDADE DE REGISTROS

SELECT
    (
        SELECT COUNT(*)
        FROM public.modelos_virtuais
        WHERE genero = 'feminino'
    ) AS modelos_femininas,

    (
        SELECT COUNT(*)
        FROM public.referencias_estilo_modelo_ia
    ) AS referencias_estilo_total,

    (
        SELECT COUNT(*)
        FROM public.geracoes_imagens_ia
    ) AS geracoes_anteriores_e_novas,

    (
        SELECT COUNT(*)
        FROM public.imagens_geradas_ia
    ) AS imagens_registradas,

    (
        SELECT COUNT(*)
        FROM public.lotes_geracao_ia
    ) AS lotes_gerados;
