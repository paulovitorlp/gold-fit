"use strict";

/* GOLD FIT PRO V9 — Edicao de imagem existente, versoes preservadas.
 * Protecao de sessao e aplicada em server.js.
 * NENHUMA imagem anterior e sobrescrita. Cada correcao aprovada pode
 * entrar nas referencias da modelo pelo fluxo normal de aprovacao V7. */
const express = require("express");
const multer = require("multer");
const path = require("node:path");
const fs = require("node:fs/promises");
const { randomUUID } = require("node:crypto");
const { pool } = require("../db");
const { TIPOS, VERSAO_PROMPT_CORRECAO, instrucoesCorrecao } = require("../services/prompts-correcao");
const { dimensoesPNG, normalizarArea, mascaraPNG, composicaoLocalizada } = require("../services/edicao-localizada");

const router = express.Router();
const UPLOADS = path.resolve(__dirname, "..", "..", "uploads");
const tarefasAtivas = new Set();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter(_req, file, cb) {
        return ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
            ? cb(null, true)
            : cb(Object.assign(new Error("A referencia extra deve ser JPG, PNG ou WEBP."), { status: 400 }));
    }
});
function idSeguro(id) { return /^[1-9]\d{0,15}$/.test(String(id)) ? String(id) : null; }
function formato(buffer) {
    if (!buffer || buffer.length < 12) return null;
    if (buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return { mime: "image/jpeg", ext: ".jpg" };
    if (buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return { mime: "image/png", ext: ".png" };
    if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return { mime: "image/webp", ext: ".webp" };
    return null;
}
function arquivoSeguro(url, prefixo, pasta) {
    if (typeof url !== "string" || !url.startsWith(prefixo)) throw new Error("Caminho de fotografia nao reconhecido.");
    const relativo = url.slice(prefixo.length);
    if (!/^[A-Za-z0-9_./-]{1,250}\.(?:png|jpe?g|webp)$/i.test(relativo)) throw new Error("Nome de arquivo invalido.");
    const raiz = path.resolve(UPLOADS, pasta);
    const destino = path.resolve(raiz, relativo);
    if (!destino.startsWith(raiz + path.sep)) throw new Error("Caminho fora da pasta autorizada.");
    return destino;
}
async function imagemLocal(url, prefixo, pasta) {
    if (!url) return null;
    const dados = await fs.readFile(arquivoSeguro(url, prefixo, pasta));
    const tipo = formato(dados);
    if (!tipo) throw new Error("Uma das fotografias de referencia nao e valida.");
    return { dados, tipo };
}
function anexar(form, imagem, rotulo) {
    form.append("image[]", new Blob([imagem.dados], { type: imagem.tipo.mime }), `${rotulo}${imagem.tipo.ext}`);
}
async function consultarAPI({ base, produto, extra, rosto, prompt, mascara, tamanho }) {
    const form = new FormData();
    form.append("model", process.env.GF_CORRECTION_MODEL || process.env.GF_IMAGE_MODEL || "gpt-image-2.5-flare");
    form.append("prompt", prompt);
    form.append("size", tamanho);
    form.append("quality", ["low", "medium", "high", "xhigh", "max"].includes(process.env.GF_CORRECTION_QUALITY) ? process.env.GF_CORRECTION_QUALITY : "high");
    form.append("n", "1");
    anexar(form, base, "imagem-a-corrigir");
    if (mascara) form.append("mask", new Blob([mascara], {type:"image/png"}), "area-de-correcao.png");
    if (produto) anexar(form, produto, "produto-original");
    if (extra) anexar(form, extra, "detalhe-extra");
    if (rosto) anexar(form, rosto, "identidade-modelo");

    const abort = new AbortController();
    const limite = setTimeout(() => abort.abort(), 170000);
    let resposta;
    try {
        resposta = await fetch("https://api.openai.com/v1/images/edits", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
            body: form,
            signal: abort.signal
        });
    } finally { clearTimeout(limite); }
    const json = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
        const motivo = String(json.error?.message || "A API recusou a edicao.").slice(0, 260);
        console.error("Gold Fit — erro da API de correcao:", resposta.status, motivo);
        const erro = new Error(resposta.status === 429 ? `API sem credito ou limite disponivel: ${motivo}` : `API de edicao (${resposta.status}): ${motivo}`);
        erro.status = resposta.status === 429 ? 429 : 502;
        throw erro;
    }
    const base64 = json.data?.[0]?.b64_json;
    const imagem = typeof base64 === "string" ? Buffer.from(base64, "base64") : null;
    if (!imagem || imagem.length < 1000 || !imagem.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
        throw new Error("A API nao devolveu um PNG valido; a versao anterior permanece intacta.");
    }
    return imagem;
}
async function consultarImagem(loteId, imagemId) {
    const { rows } = await pool.query(`
        SELECT i.id AS imagem_id, i.caminho_arquivo, i.status_revisao,
               g.id AS geracao_id, g.angulo, g.estilo_id, g.modelo_virtual_id,
               g.nome_produto, g.categoria, g.tecido, g.cor_nome, g.cor_hex,
               g.detalhes_produto, l.foto_produto_original, m.nome AS modelo_nome,
               (SELECT c.imagem_raiz_id FROM public.correcoes_imagens_ia c
                WHERE c.imagem_resultado_id = i.id LIMIT 1) AS raiz_corrigida
        FROM public.imagens_geradas_ia i
        JOIN public.geracoes_imagens_ia g ON g.id=i.geracao_id
        JOIN public.lotes_geracao_ia l ON l.id=g.lote_id
        JOIN public.modelos_virtuais m ON m.id=g.modelo_virtual_id
        WHERE l.id=$1 AND i.id=$2
    `, [loteId, imagemId]);
    return rows[0] || null;
}
async function consultarRosto(modeloId) {
    const { rows } = await pool.query(`
        SELECT r.caminho_arquivo FROM public.referencias_estilo_modelo_ia r
        WHERE r.modelo_virtual_id=$1 AND r.tipo='rosto' AND r.uso='identidade'
        ORDER BY r.principal DESC, r.ordem, r.id LIMIT 1
    `, [modeloId]);
    return rows[0]?.caminho_arquivo || null;
}

router.get("/versoes/:imagemId", async (req, res) => {
    const imagemId = idSeguro(req.params.imagemId);
    if (!imagemId) return res.status(400).json({ status: "erro", mensagem: "Identificador invalido." });
    try {
        const { rows: inicio } = await pool.query(`
            SELECT imagem_raiz_id FROM public.correcoes_imagens_ia WHERE imagem_resultado_id=$1
        `, [imagemId]);
        const raiz = inicio[0]?.imagem_raiz_id || imagemId;
        const { rows } = await pool.query(`
            SELECT c.id, c.lote_id, c.versao, c.tipo_ajuste, c.instrucoes,
                   c.imagem_origem_id, c.imagem_resultado_id, c.status,
                   c.mensagem_erro, c.criado_em, c.concluido_em,
                   i.caminho_arquivo AS url, i.status_revisao
            FROM public.correcoes_imagens_ia c
            LEFT JOIN public.imagens_geradas_ia i ON i.id=c.imagem_resultado_id
            WHERE c.imagem_raiz_id=$1 ORDER BY c.versao
        `, [raiz]);
        return res.json({ status: "ok", imagem_raiz_id: raiz, versoes: rows });
    } catch (erro) {
        console.error("Falha ao consultar versoes:", erro.code || "-", erro.message);
        return res.status(500).json({ status: "erro", mensagem: "Nao foi possivel consultar as versoes." });
    }
});

// URL segura da V1, utilizada quando o admin solicita recomeçar da versão original.
router.get("/base/:imagemId", async (req,res) => {
    const imagemId=idSeguro(req.params.imagemId);
    if(!imagemId) return res.status(400).json({status:"erro",mensagem:"ID invalido."});
    try {
        const {rows}=await pool.query(`
            SELECT i.id, i.caminho_arquivo, COALESCE((
                SELECT c.imagem_raiz_id FROM public.correcoes_imagens_ia c
                WHERE c.imagem_resultado_id=i.id LIMIT 1
            ),i.id) AS raiz_id
            FROM public.imagens_geradas_ia i WHERE i.id=$1`,[imagemId]);
        if(!rows.length) return res.status(404).json({status:"erro",mensagem:"Imagem nao encontrada."});
        const raiz=rows[0].raiz_id;
        const {rows: originais}=await pool.query(`SELECT caminho_arquivo FROM public.imagens_geradas_ia WHERE id=$1`,[raiz]);
        if(!originais.length) return res.status(404).json({status:"erro",mensagem:"Foto original indisponivel."});
        // Somente retornamos caminhos pertencentes à pasta de uploads gerados.
        arquivoSeguro(originais[0].caminho_arquivo,"/arquivos/geradas/","geradas");
        return res.json({status:"ok",raiz_id:String(raiz),url:originais[0].caminho_arquivo});
    } catch(erro) {
        console.error("Falha na consulta da foto raiz:",erro.message);
        return res.status(500).json({status:"erro",mensagem:"Nao foi possivel recuperar a foto inicial."});
    }
});

router.get("/baixar/:imagemId", async (req, res) => {
    const imagemId = idSeguro(req.params.imagemId);
    if (!imagemId) return res.status(400).json({ status: "erro", mensagem: "ID invalido." });
    try {
        const { rows } = await pool.query(`SELECT caminho_arquivo FROM public.imagens_geradas_ia WHERE id=$1`, [imagemId]);
        if (!rows.length) return res.status(404).json({ status: "erro", mensagem: "Imagem nao encontrada." });
        return res.download(arquivoSeguro(rows[0].caminho_arquivo, "/arquivos/geradas/", "geradas"), `goldfit-imagem-${imagemId}.png`);
    } catch (erro) {
        console.error("Falha ao baixar versao:", erro.message);
        if (!res.headersSent) return res.status(500).json({ status: "erro", mensagem: "Nao foi possivel baixar a imagem." });
    }
});

router.post("/:loteId/:imagemId", upload.single("referenciaExtra"), async (req, res) => {
    const loteId = idSeguro(req.params.loteId);
    const imagemId = idSeguro(req.params.imagemId);
    const tipo = String(req.body?.tipoAjuste || "").trim();
    const descricao = String(req.body?.instrucoes || "").trim();
    let areaEnviada = null;
    try { areaEnviada = JSON.parse(String(req.body?.area || "null")); }
    catch { return res.status(400).json({status:"erro",mensagem:"Selecao de area invalida."}); }
    const usarRaiz = String(req.body?.usarRaiz ?? "true") !== "false";
    if (!loteId || !imagemId || !Object.hasOwn(TIPOS, tipo) || descricao.length < 8 || descricao.length > 1500) {
        return res.status(400).json({ status: "erro", mensagem: "Escolha o ajuste e descreva exatamente o detalhe (8 a 1500 caracteres)." });
    }
    const formatoExtra = req.file ? formato(req.file.buffer) : null;
    if (req.file && !formatoExtra) return res.status(400).json({ status: "erro", mensagem: "Referencia extra invalida." });
    if (!/^sk-/.test(process.env.OPENAI_API_KEY || "")) return res.status(503).json({ status: "erro", mensagem: "OPENAI_API_KEY nao configurada." });

    let correcaoId = null;
    let raizId = null;
    try {
        const original = await consultarImagem(loteId, imagemId);
        if (!original) return res.status(404).json({ status: "erro", mensagem: "Fotografia nao encontrada neste lote." });
        raizId = String(original.raiz_corrigida || imagemId);
        if (tarefasAtivas.has(raizId)) return res.status(409).json({ status: "erro", mensagem: "Ja existe uma correcao em andamento para esta fotografia." });
        tarefasAtivas.add(raizId);
        // Em uma segunda/terceira correção, a V1 é a base padrão para preservar nitidez e rosto.
        let baseImagemId = imagemId;
        let caminhoBase = original.caminho_arquivo;
        if (usarRaiz && String(raizId) !== String(imagemId)) {
            const { rows: raizRows } = await pool.query(`
                SELECT i.caminho_arquivo FROM public.imagens_geradas_ia i
                JOIN public.geracoes_imagens_ia g ON g.id=i.geracao_id
                WHERE i.id=$1 AND g.lote_id=$2 AND g.modelo_virtual_id=$3
            `, [raizId,loteId,original.modelo_virtual_id]);
            if (!raizRows.length) throw new Error("Fotografia original nao encontrada neste lote.");
            baseImagemId=String(raizId);
            caminhoBase=raizRows[0].caminho_arquivo;
        }
        const base = await imagemLocal(caminhoBase, "/arquivos/geradas/", "geradas");
        const tamanhoBase = dimensoesPNG(base.dados);
        // Modo V13: texto puro e o padrao. Sem area => sem mascara, sem recorte/localizacao.
        const area = areaEnviada == null ? null : normalizarArea(areaEnviada, tamanhoBase.largura, tamanhoBase.altura);
        const mascara = area ? mascaraPNG({largura:tamanhoBase.largura,altura:tamanhoBase.altura,area}) : null;
        const produto = original.foto_produto_original
            ? await imagemLocal(original.foto_produto_original, "/arquivos/produtos-ia/", "produtos-ia") : null;
        const urlRosto = await consultarRosto(original.modelo_virtual_id);
        let rosto = null;
        if (urlRosto) {
            try { rosto = await imagemLocal(urlRosto, "/arquivos/modelos/", "modelos"); }
            catch (erro) { console.warn("Referencia facial de correcao indisponivel:", erro.message); }
        }
        const extra = formatoExtra ? { dados: req.file.buffer, tipo: formatoExtra } : null;
        const prompt = instrucoesCorrecao({ tipo, descricao, angulo: original.angulo,
            nome: original.modelo_nome, comOriginal: !!produto, comExtra: !!extra, comRosto: !!rosto, comMascara: !!mascara });
        const { rows: calculo } = await pool.query(`
            SELECT COALESCE(MAX(versao),1)+1 AS proxima
            FROM public.correcoes_imagens_ia WHERE imagem_raiz_id=$1
        `, [raizId]);
        const versao = Number(calculo[0].proxima);
        const { rows: nova } = await pool.query(`
            INSERT INTO public.correcoes_imagens_ia
                (lote_id,imagem_raiz_id,imagem_origem_id,versao,tipo_ajuste,instrucoes,status)
            VALUES($1,$2,$3,$4,$5,$6,'processando') RETURNING id
        `, [loteId, raizId, imagemId, versao, tipo, descricao]);
        correcaoId = nova[0].id;
        if (extra) {
            const pastaExtra = path.join(UPLOADS, "correcoes-referencias");
            await fs.mkdir(pastaExtra, { recursive: true });
            const nomeExtra = `${randomUUID()}${formatoExtra.ext}`;
            await fs.writeFile(path.join(pastaExtra, nomeExtra), extra.dados, { flag: "wx" });
            await pool.query(`UPDATE public.correcoes_imagens_ia SET referencia_extra_url=$2 WHERE id=$1`,
                [correcaoId, `/arquivos/correcoes-referencias/${nomeExtra}`]);
        }
        const pngResposta = await consultarAPI({ base, produto, extra, rosto, prompt, mascara,
            tamanho:`${tamanhoBase.largura}x${tamanhoBase.altura}` });
        // Sem selecao: mantemos o PNG completo da API, sem composicao artificial.
        // Com selecao (compatibilidade antiga): preservar pixels externos da V1.
        const png = area ? composicaoLocalizada(base.dados,pngResposta,area) : pngResposta;
        const nome = `correcao-${loteId}-${imagemId}-v${versao}-${randomUUID()}.png`;
        const pastaGeradas = path.join(UPLOADS, "geradas");
        await fs.mkdir(pastaGeradas, { recursive: true });
        const destino = path.join(pastaGeradas, nome);
        await fs.writeFile(destino, png, { flag: "wx" });
        const cliente = await pool.connect();
        let inicio = false;
        try {
            await cliente.query("BEGIN"); inicio = true;
            const { rows: geracao } = await cliente.query(`
                INSERT INTO public.geracoes_imagens_ia
                    (lote_id,estilo_id,nome_produto,categoria,tecido,modelo_virtual_id,
                     cor_nome,cor_hex,angulo,detalhes_produto,referencias,prompt,versao_prompt,status)
                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,'concluida') RETURNING id
            `, [loteId, original.estilo_id, original.nome_produto,
                original.categoria, original.tecido, original.modelo_virtual_id,
                original.cor_nome, original.cor_hex, original.angulo, original.detalhes_produto,
                JSON.stringify({ imagem_base_id: imagemId, imagem_base_real_id: baseImagemId, correcao_id: correcaoId, referencia_extra: !!extra, area, edicao_localizada: !!area, correcao_por_texto: !area }),
                prompt, VERSAO_PROMPT_CORRECAO]);
            const { rows: gerada } = await cliente.query(`
                INSERT INTO public.imagens_geradas_ia(geracao_id,caminho_arquivo,angulo,tamanho_bytes)
                VALUES($1,$2,$3,$4) RETURNING id
            `, [geracao[0].id, `/arquivos/geradas/${nome}`, original.angulo, png.length]);
            await cliente.query(`
                UPDATE public.correcoes_imagens_ia
                SET imagem_resultado_id=$2,status='concluida',concluido_em=NOW()
                WHERE id=$1
            `, [correcaoId, gerada[0].id]);
            await cliente.query("COMMIT"); inicio = false;
            return res.json({ status: "ok", mensagem: "Versao corrigida salva; imagem anterior preservada.",
                loteId, imagem_origem_id: imagemId, imagem_id: gerada[0].id,
                versao, url: `/arquivos/geradas/${nome}`, status_revisao: "pendente", modo: area ? "localizada" : "texto", imagem_base_real_id: baseImagemId });
        } catch (erro) {
            if (inicio) await cliente.query("ROLLBACK").catch(() => {});
            await fs.unlink(destino).catch(() => {});
            throw erro;
        } finally { cliente.release(); }
    } catch (erro) {
        const mensagem = String(erro.message || "Falha na edicao.").slice(0, 400);
        console.error("Falha na correcao de imagem:", erro.code || "-", mensagem);
        if (correcaoId) await pool.query(`
            UPDATE public.correcoes_imagens_ia
            SET status='erro',mensagem_erro=$2,concluido_em=NOW()
            WHERE id=$1 AND status='processando'
        `, [correcaoId, mensagem]).catch(err => console.error("Falha ao registrar erro da correcao:", err.message));
        return res.status(erro.status || 502).json({ status: "erro", mensagem: erro.status ? mensagem : "Falha na correcao. A imagem original continua salva. Verifique logs do painel." });
    } finally { if (raizId) tarefasAtivas.delete(raizId); }
});

module.exports = router;
