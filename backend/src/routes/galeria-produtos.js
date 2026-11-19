"use strict";
/* GOLD FIT PRO — galeria persistente de até quatro fotos originais por COR.
 * Imagens em disco persistente, metadados no PostgreSQL. Foto sem redimensionamento destrutivo.
 */
const express = require("express");
const multer = require("multer");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { pool } = require("../db");
const router = express.Router();
const pasta = path.resolve(__dirname, "..", "..", "uploads", "galeria-loja");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024, files: 1 } });
function admin(req, res, next) {
    if (req.session?.admin === true) return next();
    return res.status(401).json({ status: "erro", mensagem: "Entre novamente no painel administrativo." });
}
function validarTexto(valor, max) {
    const texto = String(valor || "").trim();
    if (!texto || texto.length > max) throw Object.assign(new Error("Produto ou cor inválidos."), { status: 400 });
    return texto;
}
function tipoReal(bytes) {
    if (!Buffer.isBuffer(bytes) || bytes.length < 16) return null;
    if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return "jpg";
    if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
    if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
    return null;
}
function respostaErro(res, erro, contexto) {
    console.error(`Galeria ${contexto}:`, erro.message);
    const status = erro.status || (erro.code === "42P01" ? 503 : 500);
    return res.status(status).json({ status: "erro", mensagem: status === 503
        ? "A galeria ainda não está instalada no PostgreSQL. Execute a migração SQL 17."
        : status < 500 ? erro.message : "Falha ao salvar a galeria. Consulte os logs do painel." });
}
function normalizar(rows) {
    return rows.map(row => ({ id: row.id, chave: row.chave_produto, cor: row.cor,
        ordem: Number(row.ordem), url: row.caminho_arquivo, tipoFoto: row.tipo_foto, criado_em: row.criado_em }));
}
// Consulta pública: usada pelo detalhe de produto e por miniaturas do catálogo.
router.get("/", async (req, res) => {
    try {
        const chave = req.query.chave == null ? null : validarTexto(req.query.chave, 300);
        const { rows } = await pool.query(`SELECT id, chave_produto, cor, ordem, caminho_arquivo, tipo_foto, criado_em
            FROM public.galeria_produtos_cor
            WHERE ($1::text IS NULL OR chave_produto = $1::text)
              AND ($2::boolean OR tipo_foto='modelo')
            ORDER BY chave_produto, cor, ordem LIMIT 2000`, [chave, req.session?.admin === true && req.query.visao !== "publica"]);
        return res.json({ status: "ok", fotos: normalizar(rows) });
    } catch (erro) { return respostaErro(res, erro, "consulta"); }
});
// Altera apenas a posicao das fotos: os arquivos e IDs existentes sao preservados.
// A cor temporaria evita choques com UNIQUE(chave_produto, cor, ordem)
// (constraint nao-deferrable do SQL 17), sem precisar migrar o banco.
async function gravarOrdem(client, chave, cor, ids) {
    if (!ids.length) return;
    const temporaria = `__gf_ordenacao_${crypto.randomUUID()}`;
    const { rowCount: isoladas } = await client.query(
        `UPDATE public.galeria_produtos_cor SET cor=$3
         WHERE chave_produto=$1 AND cor=$2`, [chave, cor, temporaria]);
    if (isoladas !== ids.length) throw Object.assign(new Error("Galeria alterada por outra operacao; recarregue as fotos."), { status: 409 });
    const { rowCount: organizadas } = await client.query(
        `WITH posicoes AS (
            SELECT id, posicao::smallint AS ordem
            FROM unnest($3::bigint[]) WITH ORDINALITY AS foto(id, posicao)
         )
         UPDATE public.galeria_produtos_cor AS g
         SET cor=$2, ordem=p.ordem
         FROM posicoes AS p
         WHERE g.chave_produto=$1 AND g.cor=$4 AND g.id=p.id`,
        [chave, cor, ids, temporaria]);
    if (organizadas !== ids.length) throw Object.assign(new Error("Nao foi possivel salvar a ordem da galeria."), { status: 409 });
}

// Salva a ordem arrastada ou definida no painel administrativo, por cor.
router.put("/ordem", admin, async (req, res) => {
    let client;
    try {
        const chave = validarTexto(req.body?.chave, 300);
        const cor = validarTexto(req.body?.cor, 90);
        const entrada = req.body?.ids;
        if (!Array.isArray(entrada) || entrada.length < 1 || entrada.length > 4 ||
            !entrada.every(id => /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0) ||
            new Set(entrada.map(String)).size !== entrada.length) {
            return res.status(400).json({ status: "erro", mensagem: "Envie de 1 a 4 fotos unicas na ordem desejada." });
        }
        const ids = entrada.map(Number);
        client = await pool.connect();
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))", [chave, cor]);
        const { rows: atuais } = await client.query(
            `SELECT id FROM public.galeria_produtos_cor
             WHERE chave_produto=$1 AND cor=$2 ORDER BY ordem, id FOR UPDATE`, [chave, cor]);
        const existentes = new Set(atuais.map(f => String(f.id)));
        if (atuais.length !== ids.length || ids.some(id => !existentes.has(String(id)))) {
            await client.query("ROLLBACK");
            return res.status(409).json({ status: "erro", mensagem: "As fotos mudaram. Atualize a galeria antes de reorganizar." });
        }
        await gravarOrdem(client, chave, cor, ids);
        await client.query("COMMIT");
        return res.json({ status: "ok" });
    } catch (erro) {
        if (client) await client.query("ROLLBACK").catch(() => {});
        return respostaErro(res, erro, "ordem");
    } finally { if (client) client.release(); }
});

// Só o administrador cadastra fotografias. Upload preserva os bytes originais.
router.post("/fotos", admin, upload.single("foto"), async (req, res) => {
    let client, caminho;
    try {
        const chave = validarTexto(req.body.chave, 300);
        const cor = validarTexto(req.body.cor, 90);
        const tipoFoto = req.body.tipoFoto === "modelo" ? "modelo" : "produto";
        if (!req.file) return res.status(400).json({ status: "erro", mensagem: "Escolha uma foto." });
        const extensao = tipoReal(req.file.buffer);
        if (!extensao) return res.status(415).json({ status: "erro", mensagem: "Use uma fotografia JPG, PNG ou WEBP válida." });
        client = await pool.connect();
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))", [chave, cor]);
        const atuais = (await client.query("SELECT ordem FROM public.galeria_produtos_cor WHERE chave_produto=$1 AND cor=$2 ORDER BY ordem", [chave, cor])).rows;
        const ocupadas = new Set(atuais.map(x => Number(x.ordem)));
        const ordem = [1,2,3,4].find(n => !ocupadas.has(n));
        if (!ordem) {
            await client.query("ROLLBACK");
            return res.status(409).json({ status: "erro", mensagem: "Esta cor já possui 4 fotos. Remova uma antes de adicionar outra." });
        }
        await fs.mkdir(pasta, { recursive: true });
        const nome = `${crypto.randomUUID()}.${extensao}`;
        caminho = path.join(pasta, nome);
        await fs.writeFile(caminho, req.file.buffer, { flag: "wx" });
        const url = `/midia/galeria/${nome}`;
        const { rows } = await client.query(`INSERT INTO public.galeria_produtos_cor(chave_produto,cor,ordem,caminho_arquivo,tipo_foto)
            VALUES($1,$2,$3,$4,$5)
            RETURNING id,chave_produto,cor,ordem,caminho_arquivo,tipo_foto,criado_em`, [chave, cor, ordem, url, tipoFoto]);
        await client.query("COMMIT");
        return res.status(201).json({ status: "ok", foto: normalizar(rows)[0] });
    } catch (erro) {
        if (client) await client.query("ROLLBACK").catch(() => {});
        if (caminho) await fs.unlink(caminho).catch(() => {});
        return respostaErro(res, erro, "upload");
    } finally { if (client) client.release(); }
});
// A classificacao manual e persistida e aplicada imediatamente a vitrine.
router.patch("/fotos/:id/tipo", admin, async (req, res) => {
    const id = Number(req.params.id);
    const tipo = req.body?.tipoFoto;
    if (!Number.isSafeInteger(id) || id < 1 || !["modelo", "produto"].includes(tipo)) {
        return res.status(400).json({status:"erro", mensagem:"Foto ou classificacao invalida."});
    }
    try {
        const { rows } = await pool.query(
            `UPDATE public.galeria_produtos_cor SET tipo_foto=$2 WHERE id=$1
             RETURNING id,chave_produto,cor,ordem,caminho_arquivo,tipo_foto,criado_em`, [id, tipo]);
        if (!rows.length) return res.status(404).json({status:"erro", mensagem:"Foto nao encontrada."});
        return res.json({status:"ok", foto:normalizar(rows)[0]});
    } catch (erro) { return respostaErro(res, erro, "classificacao"); }
});
router.delete("/fotos/:id", admin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ status:"erro", mensagem:"Foto inválida." });
    let client;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        const original = await client.query(
            "SELECT chave_produto, cor FROM public.galeria_produtos_cor WHERE id=$1", [id]);
        if (!original.rows.length) {
            await client.query("ROLLBACK");
            return res.status(404).json({ status:"erro", mensagem:"Foto não encontrada." });
        }
        const { chave_produto: chave, cor } = original.rows[0];
        await client.query("SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))", [chave, cor]);
        const { rows } = await client.query(
            "DELETE FROM public.galeria_produtos_cor WHERE id=$1 AND chave_produto=$2 AND cor=$3 RETURNING caminho_arquivo",
            [id, chave, cor]);
        if (!rows.length) {
            await client.query("ROLLBACK");
            return res.status(409).json({ status:"erro", mensagem:"A galeria mudou. Atualize e tente novamente." });
        }
        // Ao remover a foto 1, a seguinte torna-se a capa, sem lacunas na ordem.
        const restantes = await client.query(
            "SELECT id FROM public.galeria_produtos_cor WHERE chave_produto=$1 AND cor=$2 ORDER BY ordem, id FOR UPDATE",
            [chave, cor]);
        await gravarOrdem(client, chave, cor, restantes.rows.map(f => Number(f.id)));
        await client.query("COMMIT");
        const nome = path.basename(rows[0].caminho_arquivo);
        if (/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(nome)) await fs.unlink(path.join(pasta, nome)).catch(err => {
            if (err.code !== "ENOENT") console.error("Falha ao apagar foto da galeria:", err.message);
        });
        return res.json({ status: "ok" });
    } catch (erro) {
        if (client) await client.query("ROLLBACK").catch(() => {});
        return respostaErro(res, erro, "exclusão");
    } finally { if (client) client.release(); }
});
module.exports = router;
