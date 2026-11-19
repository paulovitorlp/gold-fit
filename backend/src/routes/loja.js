"use strict";
const express = require("express");
const { pool } = require("../db");
const { mesclarProdutosEstoque, filtrarEstadoPublico } = require("./loja-utils");
const { aplicarGaleriaPublica } = require("./vitrine-utils");
const { mutacaoEstoque } = require("./variacao-utils");
const router = express.Router();

router.get("/estado", async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
        const { rows } = await pool.query("SELECT documento, dados FROM public.estado_loja_pro");
        const resposta = { status: "ok", estoque: null, produtos: null };
        rows.forEach(row => { if (row.documento in resposta) resposta[row.documento] = row.dados; });
        if (req.session?.admin !== true || req.query.visao === "publica") {
            const { rows: album } = await pool.query(
                `SELECT chave_produto, cor, ordem, caminho_arquivo, tipo_foto
                 FROM public.galeria_produtos_cor WHERE tipo_foto='modelo'`);
            Object.assign(resposta, aplicarGaleriaPublica(filtrarEstadoPublico(resposta), album));
        }
        res.json(resposta);
    } catch (error) {
        console.error("Leitura da loja:", error.message);
        res.status(503).json({ status: "erro", mensagem: "Sincronizacao de estoque indisponivel. Verifique a tabela estado_loja_pro (SQL 14)." });
    }
});

router.put("/estado/:documento", async (req, res) => {
    if (req.session?.admin !== true) return res.status(401).json({ status: "erro", mensagem: "Acesso administrativo necessario. Entre novamente." });
    const documento = req.params.documento;
    if (!["estoque", "produtos"].includes(documento) || !Array.isArray(req.body?.dados)) {
        return res.status(400).json({ status: "erro", mensagem: "Documento invalido." });
    }
    if (req.body.dados.length > 2000) return res.status(413).json({ status: "erro", mensagem: "Limite de registros excedido." });

    let client;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        const dados = req.body.dados;
        let novos = 0;

        if (documento === "estoque") {
            // Serializa atualizacoes de estoque/produtos para nao perder
            // publicacoes quando duas abas salvam simultaneamente.
            await client.query("SELECT pg_advisory_xact_lock(90726018)");
            const { rows } = await client.query("SELECT dados FROM public.estado_loja_pro WHERE documento='produtos'");
            const config = mesclarProdutosEstoque(rows[0]?.dados, dados);
            novos = config.novos;
            if (novos) await client.query(`
                INSERT INTO public.estado_loja_pro (documento, dados, atualizado_em)
                VALUES ('produtos', $1::jsonb, NOW())
                ON CONFLICT (documento) DO UPDATE SET dados=EXCLUDED.dados, atualizado_em=NOW()
            `, [JSON.stringify(config.produtos)]);
        } else {
            await client.query("SELECT pg_advisory_xact_lock(90726018)");
            const { rows } = await client.query("SELECT dados FROM public.estado_loja_pro WHERE documento='estoque'");
            const config = mesclarProdutosEstoque(dados, Array.isArray(rows[0]?.dados) ? rows[0].dados : []);
            // Impede que um painel aberto ha horas remova modelos adicionados
            // por outra aba. Nunca altera configuracoes explicitas existentes.
            req.body.dados = config.produtos;
        }

        await client.query(`
            INSERT INTO public.estado_loja_pro (documento, dados, atualizado_em)
            VALUES ($1, $2::jsonb, NOW())
            ON CONFLICT (documento) DO UPDATE SET dados=EXCLUDED.dados, atualizado_em=NOW()
        `, [documento, JSON.stringify(req.body.dados)]);
        await client.query("COMMIT");
        res.json({ status: "ok", modelosNovos: novos });
    } catch (error) {
        if (client) await client.query("ROLLBACK").catch(() => {});
        console.error("Gravacao da loja:", error.message);
        res.status(500).json({ status: "erro", mensagem: "O banco nao confirmou o salvamento. Verifique os logs do painel." });
    } finally {
        if (client) client.release();
    }
});

// Salva a publicação, preço e capa do modelo de uma vez, sem sobrescrever
// o estoque de outra aba ou compartilhar fotos entre cores distintas.
router.post("/modelo", async (req, res) => {
    if (req.session?.admin !== true) return res.status(401).json({ status: "erro", mensagem: "Acesso administrativo necessário." });
    let client;
    try {
        const chave = String(req.body?.chave || "").trim();
        const alteracoes = req.body?.alteracoes || {};
        if (!chave || chave.length > 300 || !alteracoes || Array.isArray(alteracoes))
            return res.status(400).json({ status: "erro", mensagem: "Modelo inválido." });
        const permitidos = ["publicado", "destaque", "lancamento", "ordem", "preco", "grupo", "categoria", "fotoPrincipal", "corCapa"];
        if (Object.keys(alteracoes).some(k => !permitidos.includes(k)))
            return res.status(400).json({ status: "erro", mensagem: "Campos de publicação inválidos." });
        for (const k of ["publicado", "destaque", "lancamento"])
            if (k in alteracoes && typeof alteracoes[k] !== "boolean")
                return res.status(400).json({ status: "erro", mensagem: `${k} inválido.` });
        for (const k of ["preco", "ordem"])
            if (k in alteracoes && (!Number.isFinite(alteracoes[k]) || alteracoes[k] < 0 || alteracoes[k] > 10000000))
                return res.status(400).json({ status: "erro", mensagem: `${k} inválido.` });
        for (const k of ["grupo", "categoria", "corCapa", "fotoPrincipal"])
            if (k in alteracoes && (typeof alteracoes[k] !== "string" || alteracoes[k].length > (k === "fotoPrincipal" ? 3000000 : 100)))
                return res.status(400).json({ status: "erro", mensagem: `${k} inválido.` });
        client = await pool.connect();
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(90726018)");
        const { rows } = await client.query("SELECT documento, dados FROM public.estado_loja_pro WHERE documento IN ('estoque','produtos')");
        const docs = Object.fromEntries(rows.map(r => [r.documento,r.dados]));
        const estoque = Array.isArray(docs.estoque) ? docs.estoque : [];
        const produtos = mesclarProdutosEstoque(docs.produtos, estoque).produtos;
        const indice = produtos.findIndex(x => x.chave === chave);
        if (indice < 0) throw Object.assign(new Error("Modelo não encontrado no estoque"), { status: 404 });
        if (alteracoes.corCapa) {
            const cor = alteracoes.corCapa;
            const pertencente = estoque.some(x => `${x.produto}|${x.marca}` === chave && String(x.cor).toLocaleLowerCase("pt-BR") === cor.toLocaleLowerCase("pt-BR"));
            if (!pertencente) throw Object.assign(new Error("A cor escolhida não existe no estoque deste modelo"), { status: 400 });
            const { rows: fotos } = await client.query(`SELECT 1 FROM public.galeria_produtos_cor
                WHERE chave_produto=$1 AND lower(trim(cor))=lower(trim($2)) AND tipo_foto='modelo' LIMIT 1`, [chave, cor]);
            if (!fotos.length) throw Object.assign(new Error("A cor de capa precisa ter uma foto de modelo vestindo a peça"), { status: 400 });
        }
        produtos[indice] = { ...produtos[indice], ...alteracoes };
        // Configuração e variações são gravadas na mesma transação.
        const novoEstoque = estoque.map(item => `${item.produto}|${item.marca}` !== chave ? item : ({
            ...item,
            ...(alteracoes.grupo != null ? {grupo: alteracoes.grupo} : {}),
            ...(alteracoes.categoria != null ? {categoria: alteracoes.categoria} : {}),
            ...(alteracoes.preco != null ? {preco: alteracoes.preco} : {})
        }));
        await client.query(`INSERT INTO public.estado_loja_pro(documento,dados,atualizado_em)
            VALUES('produtos',$1::jsonb,NOW()) ON CONFLICT(documento)
            DO UPDATE SET dados=EXCLUDED.dados, atualizado_em=NOW()`, [JSON.stringify(produtos)]);
        await client.query(`INSERT INTO public.estado_loja_pro(documento,dados,atualizado_em)
            VALUES('estoque',$1::jsonb,NOW()) ON CONFLICT(documento)
            DO UPDATE SET dados=EXCLUDED.dados, atualizado_em=NOW()`, [JSON.stringify(novoEstoque)]);
        await client.query("COMMIT");
        return res.json({ status: "ok", modelo: produtos[indice] });
    } catch (error) {
        if (client) await client.query("ROLLBACK").catch(() => {});
        console.error("Publicação unificada:", error.message);
        res.status(error.status || 500).json({ status: "erro", mensagem: error.status ? error.message : "PostgreSQL não confirmou a publicação." });
    } finally { if (client) client.release(); }
});

// Cadastro unificado: muda somente a variação solicitada, dentro de uma
// transação que também registra modelos novos. Outras cores/SKUs são preservados.
router.post("/variacao", async (req, res) => {
    if (req.session?.admin !== true) return res.status(401).json({ status: "erro", mensagem: "Acesso administrativo necessário." });
    let client;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(90726018)");
        const { rows } = await client.query("SELECT documento, dados FROM public.estado_loja_pro WHERE documento IN ('estoque','produtos')");
        const documentos = Object.fromEntries(rows.map(row => [row.documento, row.dados]));
        const { estoque, chave } = mutacaoEstoque(Array.isArray(documentos.estoque) ? documentos.estoque : [], req.body);
        const { produtos } = mesclarProdutosEstoque(documentos.produtos, estoque);
        await client.query(`INSERT INTO public.estado_loja_pro(documento,dados,atualizado_em)
            VALUES('estoque',$1::jsonb,NOW()) ON CONFLICT(documento)
            DO UPDATE SET dados=EXCLUDED.dados, atualizado_em=NOW()`, [JSON.stringify(estoque)]);
        await client.query(`INSERT INTO public.estado_loja_pro(documento,dados,atualizado_em)
            VALUES('produtos',$1::jsonb,NOW()) ON CONFLICT(documento)
            DO UPDATE SET dados=EXCLUDED.dados, atualizado_em=NOW()`, [JSON.stringify(produtos)]);
        await client.query("COMMIT");
        res.json({ status: "ok", chave });
    } catch (error) {
        if (client) await client.query("ROLLBACK").catch(() => {});
        console.error("Estoque unificado:", error.message);
        res.status(error.status || 500).json({ status: "erro", mensagem: error.status ? error.message : "O PostgreSQL não confirmou a alteração." });
    } finally { if (client) client.release(); }
});

module.exports = router;
