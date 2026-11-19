-- GOLD FIT PRO — GALERIA POR COR (SEM DESTRUIR DADOS)
BEGIN;
CREATE TABLE IF NOT EXISTS public.galeria_produtos_cor (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    chave_produto TEXT NOT NULL CHECK (length(chave_produto) BETWEEN 2 AND 300),
    cor TEXT NOT NULL CHECK (length(cor) BETWEEN 1 AND 90),
    ordem SMALLINT NOT NULL CHECK (ordem BETWEEN 1 AND 4),
    caminho_arquivo TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(chave_produto, cor, ordem)
);
CREATE INDEX IF NOT EXISTS idx_galeria_produtos_cor_chave ON public.galeria_produtos_cor(chave_produto, cor, ordem);
COMMIT;
