-- GOLD FIT PRO V13 | novas categorias de correcao (sem apagar historico)
BEGIN;
ALTER TABLE public.correcoes_imagens_ia
    DROP CONSTRAINT IF EXISTS correcoes_imagens_ia_tipo_ajuste_check;
ALTER TABLE public.correcoes_imagens_ia
    DROP CONSTRAINT IF EXISTS ck_correcao_tipo_v13;
ALTER TABLE public.correcoes_imagens_ia
    ADD CONSTRAINT ck_correcao_tipo_v13 CHECK (tipo_ajuste IN (
        'alca_decote','costura','logo','cos','tecido','calcado','pose','fundo','outro',
        'trocar_cor','aumentar_top','diminuir_top','aumentar_short','diminuir_short','ajustar_caimento'
    ));
COMMIT;
