-- =========================================================
-- BANCO DE DADOS GOLD FIT
-- ARQUIVO: 06_triggers.sql
-- AUTOMAÇÕES DO BANCO
-- =========================================================


-- =========================================================
-- 1. ATUALIZAR DATA DO ESTOQUE AUTOMATICAMENTE
-- =========================================================

CREATE OR REPLACE FUNCTION atualizar_data_estoque()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    NEW.data_atualizacao = CURRENT_TIMESTAMP;

    RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS trg_atualizar_data_estoque
ON estoque;


CREATE TRIGGER trg_atualizar_data_estoque
BEFORE UPDATE ON estoque
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_estoque();



-- =========================================================
-- 2. PROCESSAR PAGAMENTO APROVADO
--
-- Quando um pagamento for aprovado:
--
-- 1. verifica os itens do pedido
-- 2. verifica se existe estoque suficiente
-- 3. diminui o estoque
-- 4. registra a movimentação
-- 5. altera o pedido para "pago"
--
-- =========================================================

CREATE OR REPLACE FUNCTION processar_pagamento_aprovado()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$

DECLARE

    item RECORD;
    status_atual_pedido VARCHAR(30);
    estoque_encontrado INTEGER;
    local_estoque VARCHAR(100) := 'Santarém';

BEGIN

    -- -----------------------------------------------------
    -- Se o pagamento não estiver aprovado,
    -- não é necessário fazer nada
    -- -----------------------------------------------------

    IF NEW.status <> 'aprovado' THEN
        RETURN NEW;
    END IF;


    -- -----------------------------------------------------
    -- Evita executar novamente caso um pagamento
    -- já estivesse aprovado
    -- -----------------------------------------------------

    IF TG_OP = 'UPDATE' THEN

        IF OLD.status = 'aprovado' THEN
            RETURN NEW;
        END IF;

    END IF;


    -- -----------------------------------------------------
    -- Busca o pedido e bloqueia temporariamente
    -- para evitar duas vendas simultâneas
    -- -----------------------------------------------------

    SELECT status
    INTO status_atual_pedido
    FROM pedidos
    WHERE id = NEW.pedido_id
    FOR UPDATE;


    IF NOT FOUND THEN

        RAISE EXCEPTION
        'Pedido % não encontrado.',
        NEW.pedido_id;

    END IF;


    -- -----------------------------------------------------
    -- Se o pedido já estiver pago,
    -- não baixa o estoque novamente
    -- -----------------------------------------------------

    IF status_atual_pedido = 'pago' THEN
        RETURN NEW;
    END IF;


    -- -----------------------------------------------------
    -- Verifica se existem produtos no pedido
    -- -----------------------------------------------------

    IF NOT EXISTS (

        SELECT 1
        FROM itens_pedido
        WHERE pedido_id = NEW.pedido_id

    ) THEN

        RAISE EXCEPTION
        'O pedido % não possui itens.',
        NEW.pedido_id;

    END IF;


    -- -----------------------------------------------------
    -- Percorre os produtos do pedido
    --
    -- SUM permite tratar corretamente caso exista
    -- mais de uma linha do mesmo tamanho no pedido
    -- -----------------------------------------------------

    FOR item IN

        SELECT
            tamanho_id,
            SUM(quantidade)::INTEGER AS quantidade

        FROM itens_pedido

        WHERE pedido_id = NEW.pedido_id

        GROUP BY tamanho_id

    LOOP


        -- -------------------------------------------------
        -- Tenta diminuir o estoque.
        --
        -- Só atualiza se houver quantidade suficiente.
        -- -------------------------------------------------

        UPDATE estoque

        SET quantidade =
            quantidade - item.quantidade

        WHERE tamanho_id = item.tamanho_id

          AND local = local_estoque

          AND quantidade >= item.quantidade

        RETURNING id
        INTO estoque_encontrado;


        -- -------------------------------------------------
        -- Se nenhuma linha foi atualizada,
        -- não existe estoque suficiente
        -- -------------------------------------------------

        IF NOT FOUND THEN

            RAISE EXCEPTION
            'Estoque insuficiente para o tamanho ID %.',
            item.tamanho_id;

        END IF;


        -- -------------------------------------------------
        -- Registra a saída no histórico
        -- -------------------------------------------------

        INSERT INTO movimentacoes_estoque
        (
            tamanho_id,
            pedido_id,
            tipo,
            quantidade,
            observacao
        )

        VALUES
        (
            item.tamanho_id,
            NEW.pedido_id,
            'venda',
            item.quantidade,
            'Saída automática após pagamento aprovado'
        );


    END LOOP;


    -- -----------------------------------------------------
    -- Depois de processar todos os itens,
    -- muda o pedido para pago
    -- -----------------------------------------------------

    UPDATE pedidos

    SET status = 'pago'

    WHERE id = NEW.pedido_id;


    RETURN NEW;

END;

$$;



-- =========================================================
-- 3. TRIGGER DO PAGAMENTO
-- =========================================================

DROP TRIGGER IF EXISTS trg_processar_pagamento_aprovado
ON pagamentos;


CREATE TRIGGER trg_processar_pagamento_aprovado

AFTER INSERT OR UPDATE OF status
ON pagamentos

FOR EACH ROW

EXECUTE FUNCTION processar_pagamento_aprovado();