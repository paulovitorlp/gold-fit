-- GOLD FIT PRO — MIGRACAO 18: HISTORICO DE CORRECOES DE IMAGENS
-- Idempotente, nao altera ou remove fotos existentes.
BEGIN;
CREATE TABLE IF NOT EXISTS public.correcoes_imagens_ia (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lote_id BIGINT NOT NULL REFERENCES public.lotes_geracao_ia(id) ON DELETE RESTRICT,
    imagem_raiz_id BIGINT NOT NULL REFERENCES public.imagens_geradas_ia(id) ON DELETE RESTRICT,
    imagem_origem_id BIGINT NOT NULL REFERENCES public.imagens_geradas_ia(id) ON DELETE RESTRICT,
    imagem_resultado_id BIGINT UNIQUE REFERENCES public.imagens_geradas_ia(id) ON DELETE RESTRICT,
    versao INTEGER NOT NULL CHECK (versao >= 2),
    tipo_ajuste VARCHAR(25) NOT NULL CHECK (tipo_ajuste IN (
        'alca_decote','costura','logo','cos','tecido','calcado','pose','fundo','outro'
    )),
    instrucoes TEXT NOT NULL CHECK (length(btrim(instrucoes)) BETWEEN 8 AND 1500),
    referencia_extra_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'processando' CHECK (status IN ('processando','concluida','erro')),
    mensagem_erro TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    concluido_em TIMESTAMPTZ,
    CONSTRAINT uq_correcao_raiz_versao UNIQUE(imagem_raiz_id, versao)
);
CREATE INDEX IF NOT EXISTS idx_correcao_lote ON public.correcoes_imagens_ia(lote_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_correcao_raiz ON public.correcoes_imagens_ia(imagem_raiz_id, versao);
CREATE INDEX IF NOT EXISTS idx_correcao_origem ON public.correcoes_imagens_ia(imagem_origem_id);
COMMIT;
SELECT to_regclass('public.correcoes_imagens_ia') AS tabela_correcoes;
