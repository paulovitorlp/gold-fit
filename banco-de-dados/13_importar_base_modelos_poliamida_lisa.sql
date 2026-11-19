-- GOLD FIT | Base de modelos para TOP + LEGGING EM POLIAMIDA LISA
-- Versao: 13 | PostgreSQL 16 | Executar apos 12_gerador_imagens_ia.sql
-- 31 referencias visuais aprovadas para uso COMO ESTILO/IDENTIDADE.
-- O produto NOVO enviado no formulario define cor, tecido, logos e costuras.
-- Os arquivos devem ser copiados antes para backend/uploads/modelos/estilos.

BEGIN;

-- ESTILOS DE VESTUARIO PARA A GERACAO
CREATE TABLE IF NOT EXISTS public.estilos_geracao_ia (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(80) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    tipo_peca VARCHAR(80) NOT NULL,
    tecido VARCHAR(100) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FOTOS DE REFERENCIA VINCULADAS A UM ESTILO E UMA MODELO
CREATE TABLE IF NOT EXISTS public.referencias_estilo_modelo_ia (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    estilo_id BIGINT NOT NULL REFERENCES public.estilos_geracao_ia(id) ON DELETE CASCADE,
    modelo_virtual_id BIGINT NOT NULL REFERENCES public.modelos_virtuais(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('rosto','original','frente','costas','lateral','superior','outra')),
    uso VARCHAR(30) NOT NULL CHECK (uso IN ('identidade','pose_e_caimento')),
    caminho_arquivo TEXT NOT NULL,
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    ordem INTEGER NOT NULL DEFAULT 100,
    referencia_cor_valida BOOLEAN NOT NULL DEFAULT FALSE,
    referencia_detalhes_produto_valida BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_referencia_estilo_modelo_arquivo UNIQUE (estilo_id, modelo_virtual_id, caminho_arquivo)
);

CREATE INDEX IF NOT EXISTS idx_referencias_estilo_modelo_selecao
ON public.referencias_estilo_modelo_ia (estilo_id, modelo_virtual_id, tipo);

CREATE UNIQUE INDEX IF NOT EXISTS idx_referencias_estilo_uma_foto_principal
ON public.referencias_estilo_modelo_ia (estilo_id, modelo_virtual_id)
WHERE principal = TRUE;

-- ESTILO PADRAO DO SEU PACOTE
INSERT INTO public.estilos_geracao_ia (codigo, nome, tipo_peca, tecido, descricao)
VALUES (
    'top_legging_poliamida_lisa',
    'Top e legging — poliamida lisa',
    'top_legging',
    'poliamida_lisa',
    'Base de modelo, poses e caimento; detalhes do produto novo sempre prevalecem.'
)
ON CONFLICT (codigo) DO UPDATE SET
    nome = EXCLUDED.nome,
    tipo_peca = EXCLUDED.tipo_peca,
    tecido = EXCLUDED.tecido,
    descricao = EXCLUDED.descricao;

-- REFERENCIAS: sao as 31 fotografias selecionadas e aprovadas
WITH dados (codigo_modelo, tipo, uso, caminho, principal, ordem) AS (
    VALUES
        ('F01', 'frente', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F01/HELENA_FRENTE.png', TRUE, 1),
        ('F01', 'lateral', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F01/HELENA_LADO.png', FALSE, 2),
        ('F01', 'costas', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F01/HELENA_COSTAS.png', FALSE, 3),
        ('F01', 'superior', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F01/HELENA_SUPERIOR.png', FALSE, 4),
        ('F01', 'rosto', 'identidade', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F01/HELENA_3X4.jpg', FALSE, 5),
        ('F02', 'frente', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F02/CAMILA_FRENTE.png', TRUE, 1),
        ('F02', 'frente', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F02/CAMILA_FUNDO_BRANCO.png', FALSE, 1),
        ('F02', 'lateral', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F02/CAMILA_LADO.png', FALSE, 2),
        ('F02', 'costas', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F02/CAMILA_COSTAS.png', FALSE, 3),
        ('F02', 'superior', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F02/CAMILA_SUPERIOR.png', FALSE, 4),
        ('F02', 'rosto', 'identidade', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F02/CAMILA_3X4.png', FALSE, 5),
        ('F02', 'original', 'identidade', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F02/CAMILA_IMAGEM_BASE.jpg', FALSE, 6),
        ('F03', 'frente', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F03/BEATRIZ_FRENTE_02.png', FALSE, 1),
        ('F03', 'frente', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F03/BEATRIZ_FRENTE_COMPLETO.png', TRUE, 1),
        ('F03', 'lateral', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F03/BEATRIZ_LADO.png', FALSE, 2),
        ('F03', 'costas', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F03/BEATRIZ_COSTAS.png', FALSE, 3),
        ('F03', 'superior', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F03/BEATRIZ_FRENTE_SUPERIOR.jpg', FALSE, 4),
        ('F03', 'rosto', 'identidade', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F03/BEATRIZ_3X4.jpg', FALSE, 5),
        ('F03', 'original', 'identidade', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F03/BEATRIZ_IMAGEM_BASE.jpg', FALSE, 6),
        ('F04', 'frente', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F04/RAFAELA_FRENTE_01.png', FALSE, 1),
        ('F04', 'frente', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F04/RAFAELA_FRENTE_FUNDO_BRANCO.png', TRUE, 1),
        ('F04', 'lateral', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F04/RAFAELA_LADO.png', FALSE, 2),
        ('F04', 'costas', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F04/RAFAELA_COSTAS.png', FALSE, 3),
        ('F04', 'rosto', 'identidade', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F04/RAFAELA_3X4.png', FALSE, 5),
        ('F04', 'original', 'identidade', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F04/RAFAELA_FOTO_BASE.jpg', FALSE, 6),
        ('F05', 'frente', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F05/ISABELA_FRENTE.png', TRUE, 1),
        ('F05', 'lateral', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F05/ISABELA_LADO.png', FALSE, 2),
        ('F05', 'costas', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F05/ISABELA_COSTAS.png', FALSE, 3),
        ('F05', 'costas', 'pose_e_caimento', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F05/ISABELA_COSTAS_01.png', FALSE, 3),
        ('F05', 'rosto', 'identidade', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F05/ISABELA_3X4.png', FALSE, 5),
        ('F05', 'original', 'identidade', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F05/ISABELA_IMAGEM_BASE.jpg', FALSE, 6)
)
INSERT INTO public.referencias_estilo_modelo_ia (
    estilo_id, modelo_virtual_id, tipo, uso, caminho_arquivo, principal, ordem,
    referencia_cor_valida, referencia_detalhes_produto_valida
)
SELECT e.id, m.id, d.tipo, d.uso, d.caminho, d.principal, d.ordem, FALSE, FALSE
FROM dados AS d
JOIN public.modelos_virtuais AS m ON m.codigo = d.codigo_modelo
JOIN public.estilos_geracao_ia AS e ON e.codigo = 'top_legging_poliamida_lisa'
ON CONFLICT (estilo_id, modelo_virtual_id, caminho_arquivo) DO UPDATE SET
    tipo = EXCLUDED.tipo,
    uso = EXCLUDED.uso,
    ordem = EXCLUDED.ordem,
    referencia_cor_valida = FALSE,
    referencia_detalhes_produto_valida = FALSE;

-- VINCULAR OS RECORTES DE ROSTO AO CADASTRO GERAL DE CADA MODELO
-- Sem sobrescrever a foto principal, caso ja exista uma cadastrada.
WITH rostos (codigo_modelo, caminho) AS (
    VALUES
        ('F01', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F01/HELENA_3X4.jpg'),
        ('F02', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F02/CAMILA_3X4.png'),
        ('F03', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F03/BEATRIZ_3X4.jpg'),
        ('F04', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F04/RAFAELA_3X4.png'),
        ('F05', '/arquivos/modelos/estilos/top_legging_poliamida_lisa/F05/ISABELA_3X4.png')
)
INSERT INTO public.referencias_modelos_virtuais (modelo_virtual_id, tipo, caminho_arquivo, principal)
SELECT m.id, 'rosto', r.caminho, FALSE
FROM rostos AS r
JOIN public.modelos_virtuais AS m ON m.codigo = r.codigo_modelo
WHERE NOT EXISTS (
    SELECT 1 FROM public.referencias_modelos_virtuais AS atual
    WHERE atual.modelo_virtual_id = m.id AND atual.caminho_arquivo = r.caminho
);

-- Se a modelo nao tiver foto principal, promover seu rosto registrado.
UPDATE public.referencias_modelos_virtuais AS r
SET principal = TRUE
FROM public.modelos_virtuais AS m
WHERE r.modelo_virtual_id = m.id
AND m.codigo IN ('F01','F02','F03','F04','F05')
AND r.tipo = 'rosto'
AND r.caminho_arquivo LIKE '/arquivos/modelos/estilos/top_legging_poliamida_lisa/%'
AND NOT EXISTS (
    SELECT 1 FROM public.referencias_modelos_virtuais AS outra
    WHERE outra.modelo_virtual_id = m.id AND outra.principal = TRUE
);

-- Ligacao opcional do estilo ao historico de geracoes da tabela existente.
ALTER TABLE public.geracoes_imagens_ia
    ADD COLUMN IF NOT EXISTS estilo_id BIGINT REFERENCES public.estilos_geracao_ia(id);

COMMIT;

-- CONFERENCIA (deve retornar 5 linhas somando 31 referencias no estilo).
SELECT m.codigo, m.nome, COUNT(r.id) AS total_referencias,
       COUNT(r.id) FILTER (WHERE r.principal) AS referencias_principais
FROM public.modelos_virtuais AS m
JOIN public.referencias_estilo_modelo_ia AS r ON r.modelo_virtual_id = m.id
JOIN public.estilos_geracao_ia AS e ON e.id = r.estilo_id
WHERE e.codigo = 'top_legging_poliamida_lisa'
GROUP BY m.codigo, m.nome
ORDER BY m.codigo;
