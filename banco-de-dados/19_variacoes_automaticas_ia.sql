-- GOLD FIT PRO V12 - VARIACOES DE COR E POSE / sem apagar geracoes anteriores
BEGIN;

CREATE TABLE IF NOT EXISTS public.lotes_variacoes_ia (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    imagem_base_id BIGINT NOT NULL REFERENCES public.imagens_geradas_ia(id) ON DELETE RESTRICT,
    modelo_virtual_id BIGINT NOT NULL REFERENCES public.modelos_virtuais(id) ON DELETE RESTRICT,
    produto_chave TEXT NOT NULL,
    cor_base VARCHAR(90),
    modo VARCHAR(20) NOT NULL CHECK(modo IN ('mesma_pose','poses')),
    cores_solicitadas TEXT[] NOT NULL,
    angulos_solicitados TEXT[] NOT NULL,
    total_solicitado SMALLINT NOT NULL CHECK(total_solicitado BETWEEN 1 AND 12),
    status VARCHAR(20) NOT NULL DEFAULT 'processando'
        CHECK(status IN ('processando','concluida','parcial','erro')),
    mensagem_erro TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lotes_geracao_ia
    ADD COLUMN IF NOT EXISTS variacao_grupo_id BIGINT
        REFERENCES public.lotes_variacoes_ia(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS imagem_base_id BIGINT
        REFERENCES public.imagens_geradas_ia(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS cor_destino VARCHAR(90),
    ADD COLUMN IF NOT EXISTS produto_chave TEXT;

CREATE INDEX IF NOT EXISTS idx_lotes_geracao_variacao_grupo
    ON public.lotes_geracao_ia(variacao_grupo_id);
CREATE INDEX IF NOT EXISTS idx_lotes_variacoes_data
    ON public.lotes_variacoes_ia(criado_em DESC);

COMMIT;
