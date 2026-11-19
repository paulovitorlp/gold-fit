"use strict";

/* GOLD FIT — MODELOS VIRTUAIS E REFERÊNCIAS POR ESTILO */

const express = require("express");
const multer = require("multer");
const path = require("node:path");
const fs = require("node:fs/promises");
const { randomUUID, timingSafeEqual } = require("node:crypto");
const { pool } = require("../db");

const router = express.Router();
const pastaModelos = path.resolve(__dirname, "..", "..", "uploads", "modelos");
const ESTILO_PADRAO = "top_legging_poliamida_lisa";
const LIMITE_FOTO = 10 * 1024 * 1024;

/* VALIDAÇÃO DOS DADOS */

function codigoValido(codigo) {
    return /^[FM]\d{2}$/i.test(String(codigo || ""));
}

function estiloValido(estilo) {
    return /^[a-z0-9_]{1,80}$/.test(String(estilo || ""));
}

function formatoReal(buffer) {
    if (!buffer || buffer.length < 12) return null;

    if (buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) {
        return "jpg";
    }
    if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        return "png";
    }
    if (buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP") {
        return "webp";
    }
    return null;
}

/* CONSULTA AO POSTGRESQL */

async function consultarModelos(genero, estilo, codigo = null) {
    const resultado = await pool.query(`
        SELECT
            m.id,
            m.codigo,
            m.nome,
            m.genero,
            m.descricao,
            COALESCE(est.foto_principal, geral.caminho_arquivo) AS foto_principal,
            COALESCE(est.referencias, '[]'::jsonb) AS referencias,
            COALESCE(est.total_referencias, 0) AS total_referencias,
            COALESCE(aprov.total_aprovadas, 0) AS total_aprovadas,
            COALESCE(geradas.total_geradas, 0) AS total_geradas
        FROM public.modelos_virtuais AS m
        LEFT JOIN LATERAL (
            SELECT r.caminho_arquivo
            FROM public.referencias_modelos_virtuais AS r
            WHERE r.modelo_virtual_id = m.id
              AND r.principal = TRUE
            ORDER BY r.id DESC
            LIMIT 1
        ) AS geral ON TRUE
        LEFT JOIN LATERAL (
            SELECT
                MAX(ref.caminho_arquivo) FILTER (
                    WHERE ref.principal = TRUE
                ) AS foto_principal,
                COUNT(ref.id)::INTEGER AS total_referencias,
                jsonb_agg(
                    jsonb_build_object(
                        'id', ref.id,
                        'tipo', ref.tipo,
                        'uso', ref.uso,
                        'caminho_arquivo', ref.caminho_arquivo,
                        'principal', ref.principal
                    ) ORDER BY ref.ordem, ref.id
                ) AS referencias
            FROM public.referencias_estilo_modelo_ia AS ref
            JOIN public.estilos_geracao_ia AS e
              ON e.id = ref.estilo_id
             AND e.codigo = $2
             AND e.ativo = TRUE
            WHERE ref.modelo_virtual_id = m.id
        ) AS est ON TRUE
        LEFT JOIN LATERAL (
            SELECT COUNT(*)::INTEGER AS total_aprovadas
            FROM public.referencias_aprovadas_modelo_ia AS r
            WHERE r.modelo_virtual_id = m.id AND r.ativo = TRUE
        ) AS aprov ON TRUE
        LEFT JOIN LATERAL (
            SELECT COUNT(i.id)::INTEGER AS total_geradas
            FROM public.geracoes_imagens_ia AS g
            JOIN public.imagens_geradas_ia AS i ON i.geracao_id = g.id
            WHERE g.modelo_virtual_id = m.id
        ) AS geradas ON TRUE
        WHERE m.genero = $1
          AND m.ativo = TRUE
          AND ($3::text IS NULL OR m.codigo = $3)
        ORDER BY m.codigo
    `, [genero, estilo, codigo]);

    return resultado.rows;
}

/* LISTA USADA PELO CARROSSEL */

router.get("/", async (req, res) => {
    const genero = req.query.genero === "masculino" ? "masculino" : "feminino";
    const estilo = String(req.query.estilo || ESTILO_PADRAO);

    if (!estiloValido(estilo)) {
        return res.status(400).json({
            status: "erro",
            mensagem: "Código de estilo inválido."
        });
    }

    try {
        const modelos = await consultarModelos(genero, estilo);

        return res.json({
            status: "ok",
            estilo,
            total: modelos.length,
            total_referencias: modelos.reduce(
                (soma, modelo) => soma + modelo.total_referencias,
                0
            ),
            modelos
        });
    } catch (erro) {
        console.error("Erro ao consultar modelos:", erro.message);

        return res.status(500).json({
            status: "erro",
            mensagem: "Não foi possível consultar as modelos no PostgreSQL."
        });
    }
});

/* REFERÊNCIAS DE UMA MODELO ESPECÍFICA */

router.get("/:codigo/referencias", async (req, res) => {
    const codigo = String(req.params.codigo || "").toUpperCase();
    const estilo = String(req.query.estilo || ESTILO_PADRAO);
    const genero = codigo.startsWith("M") ? "masculino" : "feminino";

    if (!codigoValido(codigo) || !estiloValido(estilo)) {
        return res.status(400).json({
            status: "erro",
            mensagem: "Modelo ou estilo inválido."
        });
    }

    try {
        const modelos = await consultarModelos(genero, estilo, codigo);

        if (!modelos.length) {
            return res.status(404).json({
                status: "erro",
                mensagem: "Modelo não encontrada."
            });
        }

        return res.json({
            status: "ok",
            estilo,
            modelo: modelos[0]
        });
    } catch (erro) {
        console.error("Erro ao consultar referências:", erro.message);

        return res.status(500).json({
            status: "erro",
            mensagem: "Não foi possível consultar as referências."
        });
    }
});

/* UPLOAD FUTURO DE FOTOGRAFIA PRINCIPAL — TOKEN LOCAL */

function exigirTokenLocal(req, res, next) {
    const esperado = process.env.GF_UPLOAD_TOKEN || "";
    const recebido = req.get("x-goldfit-upload-token") || "";

    if (esperado.length < 32) {
        return res.status(503).json({
            status: "erro",
            mensagem: "Configure GF_UPLOAD_TOKEN no backend/.env."
        });
    }

    const bufferEsperado = Buffer.from(esperado);
    const bufferRecebido = Buffer.from(recebido);

    if (bufferEsperado.length !== bufferRecebido.length ||
        !timingSafeEqual(bufferEsperado, bufferRecebido)) {
        return res.status(401).json({
            status: "erro",
            mensagem: "Token de upload inválido."
        });
    }
    next();
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: LIMITE_FOTO, files: 1 },
    fileFilter(req, arquivo, callback) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.mimetype)) {
            return callback(Object.assign(
                new Error("Envie uma imagem JPG, PNG ou WEBP."),
                { status: 400 }
            ));
        }
        callback(null, true);
    }
});

router.post("/:codigo/foto", exigirTokenLocal, upload.single("foto"), async (req, res) => {
    const codigo = String(req.params.codigo || "").toUpperCase();
    const extensao = formatoReal(req.file?.buffer);

    if (!codigoValido(codigo) || !extensao) {
        return res.status(400).json({
            status: "erro",
            mensagem: "Código ou fotografia inválidos."
        });
    }

    let cliente;
    let arquivoSalvo = null;

    try {
        const pasta = path.join(pastaModelos, codigo);
        const nome = `${randomUUID()}.${extensao}`;
        const caminhoBanco = `/arquivos/modelos/${codigo}/${nome}`;

        cliente = await pool.connect();
        await cliente.query("BEGIN");

        const modelo = await cliente.query(`
            SELECT id
            FROM public.modelos_virtuais
            WHERE codigo = $1 AND ativo = TRUE
            FOR UPDATE
        `, [codigo]);

        if (!modelo.rows.length) {
            await cliente.query("ROLLBACK");
            cliente.release();
            cliente = null;

            return res.status(404).json({
                status: "erro",
                mensagem: "Modelo não cadastrada."
            });
        }

        await fs.mkdir(pasta, { recursive: true });
        arquivoSalvo = path.join(pasta, nome);
        await fs.writeFile(arquivoSalvo, req.file.buffer, { flag: "wx" });

        await cliente.query(`
            UPDATE public.referencias_modelos_virtuais
            SET principal = FALSE
            WHERE modelo_virtual_id = $1 AND principal = TRUE
        `, [modelo.rows[0].id]);

        await cliente.query(`
            INSERT INTO public.referencias_modelos_virtuais
                (modelo_virtual_id, tipo, caminho_arquivo, principal)
            VALUES ($1, 'principal', $2, TRUE)
        `, [modelo.rows[0].id, caminhoBanco]);

        await cliente.query("COMMIT");

        return res.status(201).json({
            status: "ok",
            codigo,
            foto_principal: caminhoBanco
        });
    } catch (erro) {
        if (cliente) await cliente.query("ROLLBACK").catch(() => {});
        if (arquivoSalvo) await fs.unlink(arquivoSalvo).catch(() => {});
        console.error("Erro no upload da modelo:", erro.message);

        return res.status(500).json({
            status: "erro",
            mensagem: "Não foi possível salvar a fotografia."
        });
    } finally {
        if (cliente) cliente.release();
    }
});

module.exports = router;
