-- V19: classificar fotos sem excluir nenhum cadastro, indice ou arquivo.
-- Imagens ja publicadas na galeria sao preservadas como "modelo" por
-- compatibilidade com a vitrine anterior. Revise manualmente fotos antigas
-- que nao mostrem uma modelo vestindo a peca.
BEGIN;
ALTER TABLE public.galeria_produtos_cor
    ADD COLUMN IF NOT EXISTS tipo_foto TEXT;
UPDATE public.galeria_produtos_cor SET tipo_foto = 'modelo' WHERE tipo_foto IS NULL;
ALTER TABLE public.galeria_produtos_cor
    ALTER COLUMN tipo_foto SET DEFAULT 'produto',
    ALTER COLUMN tipo_foto SET NOT NULL;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='gf19_tipo_foto_check'
      AND conrelid='public.galeria_produtos_cor'::regclass) THEN
        ALTER TABLE public.galeria_produtos_cor
        ADD CONSTRAINT gf19_tipo_foto_check CHECK (tipo_foto IN ('modelo','produto'));
    END IF;
END $$;
COMMIT;
