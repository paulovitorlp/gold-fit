-- Gold Fit Pro: documento JSONB da loja para sincronização entre os containers.
CREATE TABLE IF NOT EXISTS public.estado_loja_pro (
    documento VARCHAR(20) PRIMARY KEY CHECK (documento IN ('estoque', 'produtos')),
    dados JSONB NOT NULL DEFAULT '[]'::jsonb,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
