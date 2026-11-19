-- GOLD FIT PRO V14 - Referencias reais do produto por lote.
-- Preserva todos os arquivos originais, modelos e imagens geradas.
BEGIN;
CREATE TABLE IF NOT EXISTS public.referencias_produto_geracao_ia (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lote_id BIGINT NOT NULL REFERENCES public.lotes_geracao_ia(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('frente_adicional','costas','lado','detalhes')),
    caminho_arquivo TEXT NOT NULL,
    tipo_foto VARCHAR(20) NOT NULL DEFAULT 'auto' CHECK (tipo_foto IN ('auto','vestida','exposta')),
    mime VARCHAR(30) NOT NULL CHECK (mime IN ('image/jpeg','image/png','image/webp')),
    tamanho_bytes INTEGER NOT NULL CHECK (tamanho_bytes > 0 AND tamanho_bytes <= 10485760),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_referencia_produto_lote_tipo UNIQUE (lote_id, tipo)
);
ALTER TABLE public.referencias_produto_geracao_ia
    ADD COLUMN IF NOT EXISTS tipo_foto VARCHAR(20) NOT NULL DEFAULT 'auto'
        CHECK (tipo_foto IN ('auto','vestida','exposta'));
ALTER TABLE public.lotes_geracao_ia
    ADD COLUMN IF NOT EXISTS tipo_foto_principal VARCHAR(20) NOT NULL DEFAULT 'auto'
        CHECK (tipo_foto_principal IN ('auto','vestida','exposta'));
CREATE INDEX IF NOT EXISTS idx_ref_produto_lote ON public.referencias_produto_geracao_ia(lote_id);
COMMIT;
