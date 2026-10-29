--
-- PostgreSQL database dump
--

\restrict eyyrPTrJmNJo5bwSXBdQMpRIB7sl4psXriaqTcz4MOzFYoNSN0ZoNXCEEkcjqXN

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: atualizar_data_estoque(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_data_estoque() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN

    NEW.data_atualizacao = CURRENT_TIMESTAMP;

    RETURN NEW;

END;
$$;


--
-- Name: fn_goldfit_atualizar_produto(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_goldfit_atualizar_produto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    NEW.data_atualizacao =
        NOW();


    RETURN NEW;

END;

$$;


--
-- Name: fn_goldfit_atualizar_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_goldfit_atualizar_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    NEW.atualizado_em =
        NOW();


    RETURN NEW;

END;

$$;


--
-- Name: processar_pagamento_aprovado(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.processar_pagamento_aprovado() RETURNS trigger
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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: atendimentos_whatsapp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendimentos_whatsapp (
    id integer NOT NULL,
    cliente_id integer,
    telefone character varying(30) NOT NULL,
    status character varying(30) DEFAULT 'aberto'::character varying NOT NULL,
    data_inicio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_finalizacao timestamp without time zone,
    CONSTRAINT atendimentos_whatsapp_status_check CHECK (((status)::text = ANY ((ARRAY['aberto'::character varying, 'atendimento_ia'::character varying, 'atendimento_humano'::character varying, 'finalizado'::character varying])::text[])))
);


--
-- Name: atendimentos_whatsapp_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.atendimentos_whatsapp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: atendimentos_whatsapp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.atendimentos_whatsapp_id_seq OWNED BY public.atendimentos_whatsapp.id;


--
-- Name: categorias_produto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias_produto (
    id bigint NOT NULL,
    departamento_id bigint NOT NULL,
    nome character varying(100) NOT NULL,
    slug character varying(120) NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    ordem_exibicao integer DEFAULT 0 NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_categorias_ordem CHECK ((ordem_exibicao >= 0))
);


--
-- Name: categorias_produto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.categorias_produto ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.categorias_produto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    nome character varying(150) NOT NULL,
    email character varying(150),
    telefone character varying(30),
    cpf character varying(20),
    cep character varying(10),
    endereco character varying(200),
    numero character varying(20),
    complemento character varying(100),
    bairro character varying(100),
    cidade character varying(100),
    estado character varying(2),
    data_cadastro timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- Name: departamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departamentos (
    id bigint NOT NULL,
    nome character varying(80) NOT NULL,
    slug character varying(100) NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    ordem_exibicao integer DEFAULT 0 NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_departamentos_ordem CHECK ((ordem_exibicao >= 0))
);


--
-- Name: departamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.departamentos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.departamentos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: estoque; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estoque (
    id integer NOT NULL,
    tamanho_id integer NOT NULL,
    quantidade integer DEFAULT 0 NOT NULL,
    local character varying(100) DEFAULT 'Santarém'::character varying NOT NULL,
    data_atualizacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estoque_minimo integer DEFAULT 2 NOT NULL,
    CONSTRAINT ck_estoque_minimo CHECK ((estoque_minimo >= 0)),
    CONSTRAINT estoque_quantidade_check CHECK ((quantidade >= 0))
);


--
-- Name: estoque_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.estoque_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: estoque_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.estoque_id_seq OWNED BY public.estoque.id;


--
-- Name: imagens_produto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imagens_produto (
    id integer NOT NULL,
    produto_id integer,
    modelo_id integer,
    variacao_id integer,
    url_imagem text NOT NULL,
    principal boolean DEFAULT false NOT NULL,
    data_cadastro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ordem_exibicao integer DEFAULT 0 NOT NULL,
    texto_alt character varying(255),
    CONSTRAINT ck_imagem_um_proprietario CHECK ((num_nonnulls(produto_id, modelo_id, variacao_id) = 1)),
    CONSTRAINT ck_imagens_produto_ordem CHECK ((ordem_exibicao >= 0))
);


--
-- Name: imagens_produto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.imagens_produto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: imagens_produto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.imagens_produto_id_seq OWNED BY public.imagens_produto.id;


--
-- Name: itens_pedido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_pedido (
    id integer NOT NULL,
    pedido_id integer NOT NULL,
    tamanho_id integer NOT NULL,
    quantidade integer NOT NULL,
    preco_unitario numeric(10,2) NOT NULL,
    CONSTRAINT itens_pedido_preco_unitario_check CHECK ((preco_unitario >= (0)::numeric)),
    CONSTRAINT itens_pedido_quantidade_check CHECK ((quantidade > 0))
);


--
-- Name: itens_pedido_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.itens_pedido_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: itens_pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.itens_pedido_id_seq OWNED BY public.itens_pedido.id;


--
-- Name: mensagens_whatsapp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mensagens_whatsapp (
    id integer NOT NULL,
    atendimento_id integer NOT NULL,
    origem character varying(20) NOT NULL,
    mensagem text NOT NULL,
    data_mensagem timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT mensagens_whatsapp_origem_check CHECK (((origem)::text = ANY ((ARRAY['cliente'::character varying, 'ia'::character varying, 'atendente'::character varying])::text[])))
);


--
-- Name: mensagens_whatsapp_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mensagens_whatsapp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mensagens_whatsapp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mensagens_whatsapp_id_seq OWNED BY public.mensagens_whatsapp.id;


--
-- Name: modelos_produto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modelos_produto (
    id integer NOT NULL,
    produto_id integer NOT NULL,
    marca character varying(100) NOT NULL,
    modelo character varying(150) NOT NULL,
    estilo character varying(100),
    ativo boolean DEFAULT true,
    data_cadastro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ordem_exibicao integer DEFAULT 0 NOT NULL,
    CONSTRAINT ck_modelos_produto_ordem CHECK ((ordem_exibicao >= 0))
);


--
-- Name: modelos_produto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.modelos_produto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: modelos_produto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.modelos_produto_id_seq OWNED BY public.modelos_produto.id;


--
-- Name: movimentacoes_estoque; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimentacoes_estoque (
    id integer NOT NULL,
    tamanho_id integer NOT NULL,
    usuario_id integer,
    pedido_id integer,
    tipo character varying(20) NOT NULL,
    quantidade integer NOT NULL,
    observacao text,
    data_movimentacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT movimentacoes_estoque_quantidade_check CHECK ((quantidade > 0)),
    CONSTRAINT movimentacoes_estoque_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['entrada'::character varying, 'saida'::character varying, 'venda'::character varying, 'ajuste'::character varying, 'devolucao'::character varying])::text[])))
);


--
-- Name: movimentacoes_estoque_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.movimentacoes_estoque_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimentacoes_estoque_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.movimentacoes_estoque_id_seq OWNED BY public.movimentacoes_estoque.id;


--
-- Name: pagamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagamentos (
    id integer NOT NULL,
    pedido_id integer NOT NULL,
    forma_pagamento character varying(30) NOT NULL,
    status character varying(30) DEFAULT 'pendente'::character varying NOT NULL,
    valor numeric(10,2) NOT NULL,
    codigo_transacao character varying(150),
    data_pagamento timestamp without time zone,
    data_cadastro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pagamentos_forma_pagamento_check CHECK (((forma_pagamento)::text = ANY ((ARRAY['pix'::character varying, 'cartao'::character varying, 'dinheiro'::character varying, 'outro'::character varying])::text[]))),
    CONSTRAINT pagamentos_status_check CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'aprovado'::character varying, 'recusado'::character varying, 'cancelado'::character varying, 'estornado'::character varying])::text[]))),
    CONSTRAINT pagamentos_valor_check CHECK ((valor >= (0)::numeric))
);


--
-- Name: pagamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pagamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pagamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pagamentos_id_seq OWNED BY public.pagamentos.id;


--
-- Name: pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pedidos (
    id integer NOT NULL,
    cliente_id integer,
    canal_venda character varying(30) DEFAULT 'site'::character varying NOT NULL,
    status character varying(30) DEFAULT 'pendente'::character varying NOT NULL,
    valor_produtos numeric(10,2) DEFAULT 0 NOT NULL,
    valor_frete numeric(10,2) DEFAULT 0 NOT NULL,
    valor_total numeric(10,2) DEFAULT 0 NOT NULL,
    cep_entrega character varying(10),
    endereco_entrega character varying(200),
    numero_entrega character varying(20),
    complemento_entrega character varying(100),
    bairro_entrega character varying(100),
    cidade_entrega character varying(100),
    estado_entrega character varying(2),
    codigo_rastreio character varying(100),
    data_pedido timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pedidos_canal_venda_check CHECK (((canal_venda)::text = ANY ((ARRAY['site'::character varying, 'whatsapp'::character varying, 'loja_fisica'::character varying])::text[]))),
    CONSTRAINT pedidos_status_check CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'aguardando_pagamento'::character varying, 'pago'::character varying, 'separando'::character varying, 'enviado'::character varying, 'entregue'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT pedidos_valor_frete_check CHECK ((valor_frete >= (0)::numeric)),
    CONSTRAINT pedidos_valor_produtos_check CHECK ((valor_produtos >= (0)::numeric)),
    CONSTRAINT pedidos_valor_total_check CHECK ((valor_total >= (0)::numeric))
);


--
-- Name: pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pedidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pedidos_id_seq OWNED BY public.pedidos.id;


--
-- Name: produtos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produtos (
    id integer NOT NULL,
    nome character varying(150) NOT NULL,
    categoria character varying(100),
    descricao text,
    preco_base numeric(10,2),
    ativo boolean DEFAULT true NOT NULL,
    data_cadastro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    slug character varying(180) NOT NULL,
    preco numeric(10,2) NOT NULL,
    publicado boolean DEFAULT true NOT NULL,
    destaque boolean DEFAULT false NOT NULL,
    lancamento boolean DEFAULT false NOT NULL,
    ordem_exibicao integer DEFAULT 0 NOT NULL,
    departamento_id bigint NOT NULL,
    categoria_id bigint NOT NULL,
    data_atualizacao timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_produtos_categoria_departamento CHECK (((categoria_id IS NULL) OR (departamento_id IS NOT NULL))),
    CONSTRAINT ck_produtos_ordem_exibicao CHECK ((ordem_exibicao >= 0)),
    CONSTRAINT ck_produtos_preco_nao_negativo CHECK (((preco IS NULL) OR (preco >= (0)::numeric)))
);


--
-- Name: produtos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.produtos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: produtos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.produtos_id_seq OWNED BY public.produtos.id;


--
-- Name: tamanhos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tamanhos (
    id integer NOT NULL,
    variacao_id integer NOT NULL,
    tamanho character varying(20) NOT NULL,
    ativo boolean DEFAULT true,
    sku character varying(120) NOT NULL,
    ordem_exibicao integer DEFAULT 0 NOT NULL,
    CONSTRAINT ck_tamanhos_ordem_exibicao CHECK ((ordem_exibicao >= 0))
);


--
-- Name: COLUMN tamanhos.sku; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tamanhos.sku IS 'SKU comercial da combinação produto/modelo/cor/tamanho.';


--
-- Name: tamanhos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tamanhos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tamanhos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tamanhos_id_seq OWNED BY public.tamanhos.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    senha character varying(255),
    perfil character varying(20) DEFAULT 'cliente'::character varying NOT NULL,
    ativo boolean DEFAULT true,
    data_cadastro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuarios_perfil_check CHECK (((perfil)::text = ANY ((ARRAY['admin'::character varying, 'gerente'::character varying, 'cliente'::character varying])::text[])))
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: variacoes_produto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.variacoes_produto (
    id integer NOT NULL,
    modelo_id integer NOT NULL,
    cor character varying(100) NOT NULL,
    sku character varying(100),
    preco numeric(10,2),
    ativo boolean DEFAULT true,
    data_cadastro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ordem_exibicao integer DEFAULT 0 NOT NULL,
    CONSTRAINT ck_variacoes_preco_nao_negativo CHECK (((preco IS NULL) OR (preco >= (0)::numeric))),
    CONSTRAINT ck_variacoes_produto_ordem CHECK ((ordem_exibicao >= 0))
);


--
-- Name: COLUMN variacoes_produto.sku; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.variacoes_produto.sku IS 'Campo legado. O SKU comercial definitivo é tamanhos.sku.';


--
-- Name: v_admin_estoque; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_admin_estoque AS
 SELECT p.id AS produto_id,
    p.nome AS produto,
    p.publicado,
    d.nome AS departamento,
    c.nome AS categoria,
    mp.id AS modelo_id,
    mp.marca,
    mp.modelo,
    vp.id AS variacao_id,
    vp.cor,
    t.id AS tamanho_id,
    t.tamanho,
    t.sku,
    COALESCE(e.quantidade, 0) AS quantidade,
    COALESCE(e.estoque_minimo, 2) AS estoque_minimo,
    e.local,
        CASE
            WHEN (COALESCE(e.quantidade, 0) = 0) THEN 'sem_estoque'::text
            WHEN (COALESCE(e.quantidade, 0) <= COALESCE(e.estoque_minimo, 2)) THEN 'estoque_baixo'::text
            ELSE 'disponivel'::text
        END AS status_estoque
   FROM ((((((public.produtos p
     JOIN public.departamentos d ON ((d.id = p.departamento_id)))
     JOIN public.categorias_produto c ON ((c.id = p.categoria_id)))
     JOIN public.modelos_produto mp ON ((mp.produto_id = p.id)))
     JOIN public.variacoes_produto vp ON ((vp.modelo_id = mp.id)))
     JOIN public.tamanhos t ON ((t.variacao_id = vp.id)))
     LEFT JOIN public.estoque e ON ((e.tamanho_id = t.id)));


--
-- Name: v_catalogo_site; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_catalogo_site AS
 SELECT p.id AS produto_id,
    p.nome AS produto,
    p.slug,
    p.descricao,
    p.preco AS preco_produto,
    COALESCE(vp.preco, p.preco) AS preco_final,
    p.destaque,
    p.lancamento,
    p.ordem_exibicao AS ordem_produto,
    d.id AS departamento_id,
    d.nome AS departamento,
    d.slug AS departamento_slug,
    c.id AS categoria_id,
    c.nome AS categoria,
    c.slug AS categoria_slug,
    mp.id AS modelo_id,
    mp.marca,
    mp.modelo,
    mp.estilo,
    vp.id AS variacao_id,
    vp.cor,
    t.id AS tamanho_id,
    t.tamanho,
    t.sku,
    COALESCE(e.quantidade, 0) AS quantidade,
    e.estoque_minimo,
    e.local,
    COALESCE(imagem_variacao.url_imagem, imagem_modelo.url_imagem, imagem_produto.url_imagem) AS url_imagem
   FROM (((((((((public.produtos p
     JOIN public.departamentos d ON ((d.id = p.departamento_id)))
     JOIN public.categorias_produto c ON ((c.id = p.categoria_id)))
     JOIN public.modelos_produto mp ON (((mp.produto_id = p.id) AND (mp.ativo IS TRUE))))
     JOIN public.variacoes_produto vp ON (((vp.modelo_id = mp.id) AND (vp.ativo IS TRUE))))
     JOIN public.tamanhos t ON (((t.variacao_id = vp.id) AND (t.ativo IS TRUE))))
     LEFT JOIN public.estoque e ON ((e.tamanho_id = t.id)))
     LEFT JOIN LATERAL ( SELECT ip.url_imagem
           FROM public.imagens_produto ip
          WHERE (ip.variacao_id = vp.id)
          ORDER BY ip.principal DESC, ip.ordem_exibicao, ip.id
         LIMIT 1) imagem_variacao ON (true))
     LEFT JOIN LATERAL ( SELECT ip.url_imagem
           FROM public.imagens_produto ip
          WHERE (ip.modelo_id = mp.id)
          ORDER BY ip.principal DESC, ip.ordem_exibicao, ip.id
         LIMIT 1) imagem_modelo ON (true))
     LEFT JOIN LATERAL ( SELECT ip.url_imagem
           FROM public.imagens_produto ip
          WHERE (ip.produto_id = p.id)
          ORDER BY ip.principal DESC, ip.ordem_exibicao, ip.id
         LIMIT 1) imagem_produto ON (true))
  WHERE ((p.publicado IS TRUE) AND (p.ativo IS TRUE) AND (d.ativo IS TRUE) AND (c.ativo IS TRUE));


--
-- Name: variacoes_produto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.variacoes_produto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: variacoes_produto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.variacoes_produto_id_seq OWNED BY public.variacoes_produto.id;


--
-- Name: vw_catalogo_completo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_catalogo_completo AS
 SELECT p.id AS produto_id,
    p.nome AS produto,
    p.categoria,
    p.descricao,
    mp.id AS modelo_id,
    mp.marca,
    mp.modelo,
    mp.estilo,
    vp.id AS variacao_id,
    vp.cor,
    vp.sku,
    COALESCE(vp.preco, p.preco_base) AS preco,
    t.id AS tamanho_id,
    t.tamanho,
    COALESCE(e.quantidade, 0) AS quantidade,
    COALESCE(e.local, 'Santarém'::character varying) AS local,
        CASE
            WHEN (COALESCE(e.quantidade, 0) > 0) THEN 'Disponível'::text
            ELSE 'Indisponível'::text
        END AS disponibilidade
   FROM ((((public.produtos p
     JOIN public.modelos_produto mp ON ((mp.produto_id = p.id)))
     JOIN public.variacoes_produto vp ON ((vp.modelo_id = mp.id)))
     JOIN public.tamanhos t ON ((t.variacao_id = vp.id)))
     LEFT JOIN public.estoque e ON ((e.tamanho_id = t.id)))
  WHERE ((p.ativo = true) AND (mp.ativo = true) AND (vp.ativo = true) AND (t.ativo = true));


--
-- Name: vw_catalogo_ia; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_catalogo_ia AS
 SELECT produto,
    categoria,
    marca,
    modelo,
    estilo,
    cor,
    tamanho,
    preco,
    quantidade,
    local,
    disponibilidade,
    sku
   FROM public.vw_catalogo_completo;


--
-- Name: vw_estoque_atual; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_estoque_atual AS
 SELECT p.nome AS produto,
    mp.marca,
    mp.modelo,
    vp.cor,
    vp.sku,
    t.tamanho,
    e.quantidade,
    e.local,
    e.data_atualizacao
   FROM ((((public.estoque e
     JOIN public.tamanhos t ON ((t.id = e.tamanho_id)))
     JOIN public.variacoes_produto vp ON ((vp.id = t.variacao_id)))
     JOIN public.modelos_produto mp ON ((mp.id = vp.modelo_id)))
     JOIN public.produtos p ON ((p.id = mp.produto_id)));


--
-- Name: vw_historico_estoque; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_historico_estoque AS
 SELECT me.id AS movimentacao_id,
    me.data_movimentacao,
    p.nome AS produto,
    mp.marca,
    mp.modelo,
    vp.cor,
    t.tamanho,
    me.tipo,
    me.quantidade,
    me.pedido_id,
    u.nome AS usuario,
    me.observacao
   FROM (((((public.movimentacoes_estoque me
     JOIN public.tamanhos t ON ((t.id = me.tamanho_id)))
     JOIN public.variacoes_produto vp ON ((vp.id = t.variacao_id)))
     JOIN public.modelos_produto mp ON ((mp.id = vp.modelo_id)))
     JOIN public.produtos p ON ((p.id = mp.produto_id)))
     LEFT JOIN public.usuarios u ON ((u.id = me.usuario_id)));


--
-- Name: vw_produtos_disponiveis; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_produtos_disponiveis AS
 SELECT produto_id,
    produto,
    categoria,
    marca,
    modelo,
    estilo,
    cor,
    sku,
    preco,
    tamanho_id,
    tamanho,
    quantidade,
    local
   FROM public.vw_catalogo_completo
  WHERE (quantidade > 0);


--
-- Name: vw_resumo_pedidos; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_resumo_pedidos AS
 SELECT ped.id AS pedido_id,
    ped.data_pedido,
    c.id AS cliente_id,
    c.nome AS cliente,
    c.telefone,
    ped.canal_venda,
    ped.status AS status_pedido,
    count(ip.id) AS tipos_itens,
    COALESCE(sum(ip.quantidade), (0)::bigint) AS quantidade_total_itens,
    ped.valor_produtos,
    ped.valor_frete,
    ped.valor_total,
    ( SELECT pg.status
           FROM public.pagamentos pg
          WHERE (pg.pedido_id = ped.id)
          ORDER BY pg.id DESC
         LIMIT 1) AS status_pagamento,
    ( SELECT pg.forma_pagamento
           FROM public.pagamentos pg
          WHERE (pg.pedido_id = ped.id)
          ORDER BY pg.id DESC
         LIMIT 1) AS forma_pagamento
   FROM ((public.pedidos ped
     LEFT JOIN public.clientes c ON ((c.id = ped.cliente_id)))
     LEFT JOIN public.itens_pedido ip ON ((ip.pedido_id = ped.id)))
  GROUP BY ped.id, ped.data_pedido, c.id, c.nome, c.telefone, ped.canal_venda, ped.status, ped.valor_produtos, ped.valor_frete, ped.valor_total;


--
-- Name: atendimentos_whatsapp id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimentos_whatsapp ALTER COLUMN id SET DEFAULT nextval('public.atendimentos_whatsapp_id_seq'::regclass);


--
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- Name: estoque id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estoque ALTER COLUMN id SET DEFAULT nextval('public.estoque_id_seq'::regclass);


--
-- Name: imagens_produto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imagens_produto ALTER COLUMN id SET DEFAULT nextval('public.imagens_produto_id_seq'::regclass);


--
-- Name: itens_pedido id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_pedido ALTER COLUMN id SET DEFAULT nextval('public.itens_pedido_id_seq'::regclass);


--
-- Name: mensagens_whatsapp id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensagens_whatsapp ALTER COLUMN id SET DEFAULT nextval('public.mensagens_whatsapp_id_seq'::regclass);


--
-- Name: modelos_produto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modelos_produto ALTER COLUMN id SET DEFAULT nextval('public.modelos_produto_id_seq'::regclass);


--
-- Name: movimentacoes_estoque id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque ALTER COLUMN id SET DEFAULT nextval('public.movimentacoes_estoque_id_seq'::regclass);


--
-- Name: pagamentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos ALTER COLUMN id SET DEFAULT nextval('public.pagamentos_id_seq'::regclass);


--
-- Name: pedidos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN id SET DEFAULT nextval('public.pedidos_id_seq'::regclass);


--
-- Name: produtos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos ALTER COLUMN id SET DEFAULT nextval('public.produtos_id_seq'::regclass);


--
-- Name: tamanhos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tamanhos ALTER COLUMN id SET DEFAULT nextval('public.tamanhos_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: variacoes_produto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variacoes_produto ALTER COLUMN id SET DEFAULT nextval('public.variacoes_produto_id_seq'::regclass);


--
-- Name: atendimentos_whatsapp atendimentos_whatsapp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimentos_whatsapp
    ADD CONSTRAINT atendimentos_whatsapp_pkey PRIMARY KEY (id);


--
-- Name: categorias_produto categorias_produto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_produto
    ADD CONSTRAINT categorias_produto_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: departamentos departamentos_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_nome_key UNIQUE (nome);


--
-- Name: departamentos departamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_pkey PRIMARY KEY (id);


--
-- Name: departamentos departamentos_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_slug_key UNIQUE (slug);


--
-- Name: estoque estoque_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estoque
    ADD CONSTRAINT estoque_pkey PRIMARY KEY (id);


--
-- Name: estoque estoque_tamanho_id_local_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estoque
    ADD CONSTRAINT estoque_tamanho_id_local_key UNIQUE (tamanho_id, local);


--
-- Name: imagens_produto imagens_produto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imagens_produto
    ADD CONSTRAINT imagens_produto_pkey PRIMARY KEY (id);


--
-- Name: itens_pedido itens_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_pedido
    ADD CONSTRAINT itens_pedido_pkey PRIMARY KEY (id);


--
-- Name: mensagens_whatsapp mensagens_whatsapp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensagens_whatsapp
    ADD CONSTRAINT mensagens_whatsapp_pkey PRIMARY KEY (id);


--
-- Name: modelos_produto modelos_produto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modelos_produto
    ADD CONSTRAINT modelos_produto_pkey PRIMARY KEY (id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_pkey PRIMARY KEY (id);


--
-- Name: pagamentos pagamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_pkey PRIMARY KEY (id);


--
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- Name: produtos produtos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT produtos_pkey PRIMARY KEY (id);


--
-- Name: tamanhos tamanhos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tamanhos
    ADD CONSTRAINT tamanhos_pkey PRIMARY KEY (id);


--
-- Name: tamanhos tamanhos_variacao_id_tamanho_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tamanhos
    ADD CONSTRAINT tamanhos_variacao_id_tamanho_key UNIQUE (variacao_id, tamanho);


--
-- Name: categorias_produto uq_categoria_departamento_nome; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_produto
    ADD CONSTRAINT uq_categoria_departamento_nome UNIQUE (departamento_id, nome);


--
-- Name: categorias_produto uq_categoria_departamento_slug; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_produto
    ADD CONSTRAINT uq_categoria_departamento_slug UNIQUE (departamento_id, slug);


--
-- Name: categorias_produto uq_categoria_id_departamento; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_produto
    ADD CONSTRAINT uq_categoria_id_departamento UNIQUE (id, departamento_id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: variacoes_produto variacoes_produto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variacoes_produto
    ADD CONSTRAINT variacoes_produto_pkey PRIMARY KEY (id);


--
-- Name: variacoes_produto variacoes_produto_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variacoes_produto
    ADD CONSTRAINT variacoes_produto_sku_key UNIQUE (sku);


--
-- Name: idx_atendimentos_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atendimentos_cliente ON public.atendimentos_whatsapp USING btree (cliente_id);


--
-- Name: idx_atendimentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atendimentos_status ON public.atendimentos_whatsapp USING btree (status);


--
-- Name: idx_atendimentos_telefone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atendimentos_telefone ON public.atendimentos_whatsapp USING btree (telefone);


--
-- Name: idx_categorias_departamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_departamento ON public.categorias_produto USING btree (departamento_id, ordem_exibicao);


--
-- Name: idx_clientes_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_cpf ON public.clientes USING btree (cpf);


--
-- Name: idx_clientes_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_email ON public.clientes USING btree (email);


--
-- Name: idx_clientes_telefone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_telefone ON public.clientes USING btree (telefone);


--
-- Name: idx_departamentos_ordem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_departamentos_ordem ON public.departamentos USING btree (ordem_exibicao);


--
-- Name: idx_estoque_local; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estoque_local ON public.estoque USING btree (local);


--
-- Name: idx_estoque_quantidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estoque_quantidade ON public.estoque USING btree (quantidade);


--
-- Name: idx_estoque_tamanho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estoque_tamanho ON public.estoque USING btree (tamanho_id);


--
-- Name: idx_estoque_tamanho_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estoque_tamanho_id ON public.estoque USING btree (tamanho_id);


--
-- Name: idx_imagens_produto_modelo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imagens_produto_modelo ON public.imagens_produto USING btree (modelo_id);


--
-- Name: idx_imagens_produto_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imagens_produto_produto ON public.imagens_produto USING btree (produto_id);


--
-- Name: idx_imagens_produto_variacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imagens_produto_variacao ON public.imagens_produto USING btree (variacao_id);


--
-- Name: idx_itens_pedido_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_pedido_id ON public.itens_pedido USING btree (pedido_id);


--
-- Name: idx_itens_pedido_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_pedido_pedido ON public.itens_pedido USING btree (pedido_id);


--
-- Name: idx_itens_pedido_tamanho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_pedido_tamanho ON public.itens_pedido USING btree (tamanho_id);


--
-- Name: idx_itens_tamanho_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_tamanho_id ON public.itens_pedido USING btree (tamanho_id);


--
-- Name: idx_mensagens_atendimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_atendimento ON public.mensagens_whatsapp USING btree (atendimento_id);


--
-- Name: idx_mensagens_atendimento_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_atendimento_id ON public.mensagens_whatsapp USING btree (atendimento_id);


--
-- Name: idx_mensagens_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_data ON public.mensagens_whatsapp USING btree (data_mensagem);


--
-- Name: idx_modelos_marca; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modelos_marca ON public.modelos_produto USING btree (marca);


--
-- Name: idx_modelos_modelo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modelos_modelo ON public.modelos_produto USING btree (modelo);


--
-- Name: idx_modelos_produto_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modelos_produto_id ON public.modelos_produto USING btree (produto_id);


--
-- Name: idx_modelos_produto_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modelos_produto_produto ON public.modelos_produto USING btree (produto_id);


--
-- Name: idx_movimentacoes_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_data ON public.movimentacoes_estoque USING btree (data_movimentacao);


--
-- Name: idx_movimentacoes_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_pedido ON public.movimentacoes_estoque USING btree (pedido_id);


--
-- Name: idx_movimentacoes_pedido_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_pedido_id ON public.movimentacoes_estoque USING btree (pedido_id);


--
-- Name: idx_movimentacoes_tamanho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_tamanho ON public.movimentacoes_estoque USING btree (tamanho_id);


--
-- Name: idx_movimentacoes_tamanho_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_tamanho_id ON public.movimentacoes_estoque USING btree (tamanho_id);


--
-- Name: idx_movimentacoes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_tipo ON public.movimentacoes_estoque USING btree (tipo);


--
-- Name: idx_movimentacoes_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_usuario ON public.movimentacoes_estoque USING btree (usuario_id);


--
-- Name: idx_pagamentos_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_pedido ON public.pagamentos USING btree (pedido_id);


--
-- Name: idx_pagamentos_pedido_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_pedido_id ON public.pagamentos USING btree (pedido_id);


--
-- Name: idx_pagamentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_status ON public.pagamentos USING btree (status);


--
-- Name: idx_pagamentos_transacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_transacao ON public.pagamentos USING btree (codigo_transacao);


--
-- Name: idx_pedidos_canal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_canal ON public.pedidos USING btree (canal_venda);


--
-- Name: idx_pedidos_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_cliente ON public.pedidos USING btree (cliente_id);


--
-- Name: idx_pedidos_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_cliente_id ON public.pedidos USING btree (cliente_id);


--
-- Name: idx_pedidos_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_data ON public.pedidos USING btree (data_pedido);


--
-- Name: idx_pedidos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_status ON public.pedidos USING btree (status);


--
-- Name: idx_produtos_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_ativo ON public.produtos USING btree (ativo);


--
-- Name: idx_produtos_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_categoria ON public.produtos USING btree (categoria);


--
-- Name: idx_produtos_departamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_departamento ON public.produtos USING btree (departamento_id);


--
-- Name: idx_produtos_departamento_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_departamento_categoria ON public.produtos USING btree (departamento_id, categoria_id);


--
-- Name: idx_produtos_destaques; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_destaques ON public.produtos USING btree (ordem_exibicao) WHERE ((publicado IS TRUE) AND (destaque IS TRUE));


--
-- Name: idx_produtos_destaques_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_destaques_site ON public.produtos USING btree (ordem_exibicao) WHERE ((publicado IS TRUE) AND (destaque IS TRUE));


--
-- Name: idx_produtos_lancamentos; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_lancamentos ON public.produtos USING btree (ordem_exibicao) WHERE ((publicado IS TRUE) AND (lancamento IS TRUE));


--
-- Name: idx_produtos_lancamentos_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_lancamentos_site ON public.produtos USING btree (ordem_exibicao) WHERE ((publicado IS TRUE) AND (lancamento IS TRUE));


--
-- Name: idx_produtos_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_nome ON public.produtos USING btree (nome);


--
-- Name: idx_produtos_publicado_ordem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_publicado_ordem ON public.produtos USING btree (publicado, ordem_exibicao);


--
-- Name: idx_produtos_publicados; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_publicados ON public.produtos USING btree (ordem_exibicao) WHERE (publicado IS TRUE);


--
-- Name: idx_tamanhos_tamanho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tamanhos_tamanho ON public.tamanhos USING btree (tamanho);


--
-- Name: idx_tamanhos_variacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tamanhos_variacao ON public.tamanhos USING btree (variacao_id);


--
-- Name: idx_tamanhos_variacao_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tamanhos_variacao_id ON public.tamanhos USING btree (variacao_id);


--
-- Name: idx_variacoes_cor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_variacoes_cor ON public.variacoes_produto USING btree (cor);


--
-- Name: idx_variacoes_modelo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_variacoes_modelo ON public.variacoes_produto USING btree (modelo_id);


--
-- Name: idx_variacoes_modelo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_variacoes_modelo_id ON public.variacoes_produto USING btree (modelo_id);


--
-- Name: idx_variacoes_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_variacoes_sku ON public.variacoes_produto USING btree (sku);


--
-- Name: uq_imagem_principal_modelo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_imagem_principal_modelo ON public.imagens_produto USING btree (modelo_id) WHERE ((principal IS TRUE) AND (modelo_id IS NOT NULL));


--
-- Name: uq_imagem_principal_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_imagem_principal_produto ON public.imagens_produto USING btree (produto_id) WHERE ((principal IS TRUE) AND (produto_id IS NOT NULL));


--
-- Name: uq_imagem_principal_variacao; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_imagem_principal_variacao ON public.imagens_produto USING btree (variacao_id) WHERE ((principal IS TRUE) AND (variacao_id IS NOT NULL));


--
-- Name: uq_modelos_produto_identidade; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_modelos_produto_identidade ON public.modelos_produto USING btree (produto_id, lower((marca)::text), lower((modelo)::text));


--
-- Name: uq_produtos_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_produtos_slug ON public.produtos USING btree (slug) WHERE (slug IS NOT NULL);


--
-- Name: uq_produtos_slug_ci; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_produtos_slug_ci ON public.produtos USING btree (lower((slug)::text));


--
-- Name: uq_tamanhos_sku_ci; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_tamanhos_sku_ci ON public.tamanhos USING btree (lower((sku)::text));


--
-- Name: uq_variacao_modelo_cor; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_variacao_modelo_cor ON public.variacoes_produto USING btree (modelo_id, lower((cor)::text));


--
-- Name: estoque trg_atualizar_data_estoque; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_atualizar_data_estoque BEFORE UPDATE ON public.estoque FOR EACH ROW EXECUTE FUNCTION public.atualizar_data_estoque();


--
-- Name: categorias_produto trg_categorias_produto_atualizado_em; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_categorias_produto_atualizado_em BEFORE UPDATE ON public.categorias_produto FOR EACH ROW EXECUTE FUNCTION public.fn_goldfit_atualizar_timestamp();


--
-- Name: departamentos trg_departamentos_atualizado_em; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_departamentos_atualizado_em BEFORE UPDATE ON public.departamentos FOR EACH ROW EXECUTE FUNCTION public.fn_goldfit_atualizar_timestamp();


--
-- Name: pagamentos trg_processar_pagamento_aprovado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_processar_pagamento_aprovado AFTER INSERT OR UPDATE OF status ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.processar_pagamento_aprovado();


--
-- Name: produtos trg_produtos_data_atualizacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_produtos_data_atualizacao BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.fn_goldfit_atualizar_produto();


--
-- Name: atendimentos_whatsapp atendimentos_whatsapp_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimentos_whatsapp
    ADD CONSTRAINT atendimentos_whatsapp_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: estoque estoque_tamanho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estoque
    ADD CONSTRAINT estoque_tamanho_id_fkey FOREIGN KEY (tamanho_id) REFERENCES public.tamanhos(id) ON DELETE CASCADE;


--
-- Name: categorias_produto fk_categoria_departamento; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_produto
    ADD CONSTRAINT fk_categoria_departamento FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: produtos fk_produtos_categoria_departamento; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT fk_produtos_categoria_departamento FOREIGN KEY (categoria_id, departamento_id) REFERENCES public.categorias_produto(id, departamento_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: produtos fk_produtos_departamento; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT fk_produtos_departamento FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: imagens_produto imagens_produto_modelo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imagens_produto
    ADD CONSTRAINT imagens_produto_modelo_id_fkey FOREIGN KEY (modelo_id) REFERENCES public.modelos_produto(id) ON DELETE CASCADE;


--
-- Name: imagens_produto imagens_produto_produto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imagens_produto
    ADD CONSTRAINT imagens_produto_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;


--
-- Name: imagens_produto imagens_produto_variacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imagens_produto
    ADD CONSTRAINT imagens_produto_variacao_id_fkey FOREIGN KEY (variacao_id) REFERENCES public.variacoes_produto(id) ON DELETE CASCADE;


--
-- Name: itens_pedido itens_pedido_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_pedido
    ADD CONSTRAINT itens_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- Name: itens_pedido itens_pedido_tamanho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_pedido
    ADD CONSTRAINT itens_pedido_tamanho_id_fkey FOREIGN KEY (tamanho_id) REFERENCES public.tamanhos(id);


--
-- Name: mensagens_whatsapp mensagens_whatsapp_atendimento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensagens_whatsapp
    ADD CONSTRAINT mensagens_whatsapp_atendimento_id_fkey FOREIGN KEY (atendimento_id) REFERENCES public.atendimentos_whatsapp(id) ON DELETE CASCADE;


--
-- Name: modelos_produto modelos_produto_produto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modelos_produto
    ADD CONSTRAINT modelos_produto_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;


--
-- Name: movimentacoes_estoque movimentacoes_estoque_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_tamanho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_tamanho_id_fkey FOREIGN KEY (tamanho_id) REFERENCES public.tamanhos(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: pagamentos pagamentos_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- Name: pedidos pedidos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: tamanhos tamanhos_variacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tamanhos
    ADD CONSTRAINT tamanhos_variacao_id_fkey FOREIGN KEY (variacao_id) REFERENCES public.variacoes_produto(id) ON DELETE CASCADE;


--
-- Name: variacoes_produto variacoes_produto_modelo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variacoes_produto
    ADD CONSTRAINT variacoes_produto_modelo_id_fkey FOREIGN KEY (modelo_id) REFERENCES public.modelos_produto(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict eyyrPTrJmNJo5bwSXBdQMpRIB7sl4psXriaqTcz4MOzFYoNSN0ZoNXCEEkcjqXN

