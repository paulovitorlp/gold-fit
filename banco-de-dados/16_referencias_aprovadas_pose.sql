-- GOLD FIT PRO | MIGRAÇÃO 16 - REFERÊNCIAS DE POSE DE FOTOS APROVADAS
-- Não substitui nem modifica a biblioteca inicial de 31 fotografias.
-- Registra somente imagens aprovadas pelo administrador.
-- "Referência" significa auxílio visual em futuras gerações, não treinamento.
BEGIN;

CREATE TABLE IF NOT EXISTS public.referencias_aprovadas_modelo_ia (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    modelo_virtual_id BIGINT NOT NULL REFERENCES public.modelos_virtuais(id) ON DELETE CASCADE,
    imagem_gerada_id BIGINT NOT NULL UNIQUE REFERENCES public.imagens_geradas_ia(id) ON DELETE CASCADE,
    angulo VARCHAR(20) NOT NULL CHECK (angulo IN ('frente', 'costas', 'lado', 'superior')),
    uso VARCHAR(30) NOT NULL DEFAULT 'pose' CHECK (uso = 'pose'),
    caminho_arquivo TEXT NOT NULL CHECK (caminho_arquivo LIKE '/arquivos/geradas/%'),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ref_aprovadas_modelo_angulo
ON public.referencias_aprovadas_modelo_ia (modelo_virtual_id, angulo, criado_em DESC)
WHERE ativo = TRUE;

-- Aproveita revisões aprovadas anteriormente, sem duplicar imagens.
INSERT INTO public.referencias_aprovadas_modelo_ia
    (modelo_virtual_id, imagem_gerada_id, angulo, caminho_arquivo, ativo)
SELECT g.modelo_virtual_id, i.id, g.angulo, i.caminho_arquivo, TRUE
FROM public.imagens_geradas_ia i
JOIN public.geracoes_imagens_ia g ON g.id = i.geracao_id
WHERE i.status_revisao = 'aprovada'
  AND g.angulo IN ('frente','costas','lado','superior')
  AND i.caminho_arquivo LIKE '/arquivos/geradas/%'
ON CONFLICT (imagem_gerada_id) DO UPDATE
SET ativo = TRUE,
    caminho_arquivo = EXCLUDED.caminho_arquivo,
    atualizado_em = NOW();

COMMIT;

SELECT m.codigo AS modelo, m.nome,
       COUNT(r.id) FILTER (WHERE r.ativo) AS poses_aprovadas_ativas
FROM public.modelos_virtuais m
LEFT JOIN public.referencias_aprovadas_modelo_ia r ON r.modelo_virtual_id = m.id
WHERE m.genero = 'feminino'
GROUP BY m.codigo, m.nome
ORDER BY m.codigo;
