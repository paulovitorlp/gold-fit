"use strict";
/* Gold Fit Pro V12 — derivações controladas a partir de uma foto APROVADA.
 * A PRIMEIRA referência de cada chamada é uma foto REAL da cor de destino.
 * A última referência é a foto-mãe aprovada (identidade e pose, nunca roupa).
 * Cada cor ganha lote próprio no histórico atual e revisão humana obrigatória.
 */
const express = require("express");
const path = require("node:path");
const fs = require("node:fs/promises");
const { randomUUID } = require("node:crypto");
const { pool } = require("../db");
const geracao = require("./geracao-imagens");
const { criarPrompt, VERSAO_PROMPT } = require("../services/prompts-geracao");
const { planejarVariacoes, chaveCor, LIMITE_IMAGENS } = require("../services/planejar-variacoes");

const router = express.Router();
const core = geracao.auxiliaresVariacoes;
const gruposAtivos = new Set();
const MAX_SIMULTANEOS = 1;

function idValido(value) { return /^[1-9][0-9]{0,15}$/.test(String(value)); }
function erroPublico(res, error, mensagem = "Não foi possível preparar variações.") {
    console.error("Variações automáticas:", error.code || "-", error.message);
    return res.status(error.status || (error.code === "42P01" || error.code === "42703" ? 503 : 500))
        .json({ status: "erro", mensagem: error.status ? error.message : mensagem });
}
async function fotoMae(imagemId) {
    const { rows } = await pool.query(`
        SELECT i.id, i.status_revisao, i.caminho_arquivo,
               g.modelo_virtual_id, g.angulo, g.cor_nome, g.nome_produto,
               g.categoria, g.tecido, g.estilo_id, m.codigo AS modelo_codigo, m.nome AS modelo_nome
        FROM public.imagens_geradas_ia i
        JOIN public.geracoes_imagens_ia g ON g.id=i.geracao_id
        JOIN public.modelos_virtuais m ON m.id=g.modelo_virtual_id
        WHERE i.id=$1 AND m.ativo=TRUE AND m.genero='feminino'
    `, [imagemId]);
    return rows[0] || null;
}
async function imagensGaleria(chave) {
    const { rows } = await pool.query(`
        SELECT cor, caminho_arquivo, ordem FROM public.galeria_produtos_cor
        WHERE chave_produto=$1 ORDER BY cor, ordem
    `, [chave]);
    return rows;
}
function arquivoGaleriaSeguro(url) {
    if (!/^\/midia\/galeria\/[a-f0-9-]{36}\.(?:png|jpg|webp)$/.test(String(url))) {
        throw new Error("Fotografia da cor tem caminho inválido.");
    }
    return path.join(core.BASE, "galeria-loja", path.basename(url));
}
async function produtosCadastrados() {
    const { rows } = await pool.query(`SELECT documento, dados FROM public.estado_loja_pro WHERE documento IN ('produtos','estoque')`);
    const dados = Object.fromEntries(rows.map(r => [r.documento, r.dados]));
    const produtos = Array.isArray(dados.produtos) ? dados.produtos.filter(p => p.grupo !== "Masculino" && typeof p.chave === "string") : [];
    const estoque = Array.isArray(dados.estoque) ? dados.estoque : [];
    return { produtos, estoque };
}
function resumirProduto(produto, fotos, estoque) {
    const grupos = new Map();
    for (const foto of fotos) {
        const chave = chaveCor(foto.cor);
        if (!grupos.has(chave)) grupos.set(chave, { cor: foto.cor, quantidade_fotos: 0, foto: foto.caminho_arquivo });
        grupos.get(chave).quantidade_fotos++;
    }
    const ch = produto.chave;
    return {
        chave: ch, nome: produto.produto || ch, marca: produto.marca || "Gold Fit",
        cores: [...grupos.values()].map(g => ({ ...g,
            quantidade_estoque: estoque.filter(v => `${v.produto}|${v.marca}` === ch && chaveCor(v.cor) === chaveCor(g.cor))
                .reduce((t, v) => t + Math.max(0, Number(v.quantidade) || 0), 0)
        }))
    };
}

router.get("/opcoes/:imagemId", async (req, res) => {
    if (!idValido(req.params.imagemId)) return res.status(400).json({ status: "erro", mensagem: "Imagem inválida." });
    try {
        const mae = await fotoMae(req.params.imagemId);
        if (!mae || mae.status_revisao !== "aprovada") return res.status(409).json({ status: "erro", mensagem: "Selecione uma imagem aprovada para gerar outras cores." });
        const dados = await produtosCadastrados();
        const todas = await pool.query(`SELECT chave_produto,cor,ordem,caminho_arquivo FROM public.galeria_produtos_cor ORDER BY chave_produto,cor,ordem LIMIT 2000`);
        const produtos = dados.produtos.map(p => resumirProduto(p, todas.rows.filter(f => f.chave_produto === p.chave), dados.estoque));
        return res.json({ status: "ok", base: { id: mae.id, modelo: mae.modelo_nome, codigo: mae.modelo_codigo,
            angulo: mae.angulo, foto: mae.caminho_arquivo, cor_original: mae.cor_nome }, produtos,
            limite_imagens: LIMITE_IMAGENS });
    } catch (e) { return erroPublico(res, e, "Não foi possível listar cores do catálogo."); }
});

async function atualizarGrupo(grupoId, status, mensagem = null) {
    await pool.query(`UPDATE public.lotes_variacoes_ia SET status=$2,mensagem_erro=$3,atualizado_em=NOW() WHERE id=$1`, [grupoId, status, mensagem]);
}
async function executarGrupo({ grupoId, mae, produto, referencias, tarefas, modo }) {
    let sucesso = 0;
    const erros = [];
    // Cada cor fica em um lote separado: revisão, download e publicação reaproveitam a V11.
    const cores = [...new Set(tarefas.map(t => t.cor))];
    for (const cor of cores) {
        const destaCor = tarefas.filter(t => t.cor === cor);
        let loteId = null;
        let fotoBuffer = null;
        let formato = null;
        try {
            // Snapshot do produto: mesmo que a galeria seja editada depois, o lote guarda a origem.
            fotoBuffer = await fs.readFile(arquivoGaleriaSeguro(destaCor[0].foto));
            formato = core.formatoReal(fotoBuffer);
            if (!formato) throw new Error(`Fotografia real inválida para a cor ${cor}.`);
            const criado = await pool.query(`
                INSERT INTO public.lotes_geracao_ia
                    (modelo_virtual_id,estilo_id,nome_produto,categoria,tecido,
                     detalhes_produto,angulos_solicitados,status,variacao_grupo_id,
                     imagem_base_id,cor_destino,produto_chave)
                VALUES ($1,$2,$3,$4,$5,$6,$7::text[],'processando',$8,$9,$10,$11)
                RETURNING id
            `, [mae.modelo_virtual_id, mae.estilo_id,
                `${produto.nome} • ${cor}`.slice(0, 150), mae.categoria, mae.tecido,
                "Variação automatizada a partir de foto-mãe aprovada. Foto real da cor é prioridade.",
                destaCor.map(t => t.angulo), grupoId, mae.id, cor, produto.chave]);
            loteId = criado.rows[0].id;
            const pasta = path.join(core.BASE, "produtos-ia", String(loteId));
            await fs.mkdir(pasta, { recursive: true });
            const fotoNome = `cor-${randomUUID()}.${formato.ext}`;
            await fs.writeFile(path.join(pasta, fotoNome), fotoBuffer, { flag: "wx" });
            await pool.query(`UPDATE public.lotes_geracao_ia SET foto_produto_original=$2 WHERE id=$1`,
                [loteId, `/arquivos/produtos-ia/${loteId}/${fotoNome}`]);
            let concluidas = 0;
            const falhasDaCor = [];
            for (let i = 0; i < destaCor.length; i++) {
                const tarefa = destaCor[i];
                let geracaoId = null;
                try {
                    const refs = core.selecionarReferencias(referencias, tarefa.angulo);
                    const prompt = criarPrompt({
                        nome: mae.modelo_nome, angulo: tarefa.angulo,
                        identidade: referencias[0]?.instrucoes_identidade || "",
                        calcado: referencias[0]?.calcado_padrao || "tenis branco",
                        detalhes: `COR DESTINO: ${cor}. Produto cadastrado: ${produto.nome}. A PRIMEIRA imagem é a fotografia real da cor ${cor}. Não reproduzir a cor ou o vestuário da imagem-mãe.`,
                        variacao: Number(grupoId) + i,
                        referenciaAprovada: true,
                        modoPose: modo === "mesma_pose" ? "mesma_pose" : "variavel"
                    });
                    const registro = await pool.query(`
                        INSERT INTO public.geracoes_imagens_ia
                          (lote_id,estilo_id,nome_produto,categoria,tecido,modelo_virtual_id,
                           cor_nome,cor_hex,angulo,detalhes_produto,referencias,prompt,versao_prompt,status)
                        VALUES ($1,$2,$3,$4,$5,$6,$7,'#FFFFFF',$8,$9,$10::jsonb,$11,$12,'processando')
                        RETURNING id
                    `, [loteId, mae.estilo_id, produto.nome, mae.categoria, mae.tecido,
                        mae.modelo_virtual_id, cor, tarefa.angulo, `Variação V12 - ${cor}`,
                        JSON.stringify({ foto_real_cor: tarefa.foto, imagem_mae_aprovada: mae.caminho_arquivo,
                            referencia_rosto: refs.rosto.caminho_arquivo, referencia_pose: refs.pose.caminho_arquivo }),
                        prompt, VERSAO_PROMPT]);
                    geracaoId = registro.rows[0].id;
                    // A foto-mãe é SEMPRE a referência final; nunca geramos a partir de outra cor derivada.
                    const resposta = await core.consultarAPI({
                        original: fotoBuffer, formato, referencias, angulo: tarefa.angulo, prompt,
                        poseAprovada: { tipo: "foto_mae_aprovada", caminho_arquivo: mae.caminho_arquivo }
                    });
                    const nome = `${mae.modelo_codigo.toLowerCase()}-${tarefa.angulo}-cor-${Date.now()}-${randomUUID()}.png`;
                    await fs.mkdir(path.join(core.BASE, "geradas"), { recursive: true });
                    await fs.writeFile(path.join(core.BASE, "geradas", nome), resposta.buffer, { flag: "wx" });
                    await pool.query(`INSERT INTO public.imagens_geradas_ia(geracao_id,caminho_arquivo,angulo,tamanho_bytes)
                        VALUES ($1,$2,$3,$4)`, [geracaoId, `/arquivos/geradas/${nome}`, tarefa.angulo, resposta.buffer.length]);
                    await pool.query(`UPDATE public.geracoes_imagens_ia SET status='concluida',atualizado_em=NOW() WHERE id=$1`, [geracaoId]);
                    sucesso++; concluidas++;
                } catch (e) {
                    const msg = `${cor} / ${tarefa.angulo}: ${String(e.message || e).slice(0, 200)}`;
                    erros.push(msg); falhasDaCor.push(msg);
                    console.error("Variação automática:", msg);
                    if (geracaoId) await pool.query(`UPDATE public.geracoes_imagens_ia SET status='erro',mensagem_erro=$2,atualizado_em=NOW() WHERE id=$1`, [geracaoId, msg]).catch(() => {});
                }
            }
            const st = concluidas === destaCor.length ? "concluida" : concluidas ? "parcial" : "erro";
            await core.atualizarStatusLote(loteId, st, falhasDaCor.join(" | ").slice(0, 1000) || null);
        } catch (e) {
            const msg = `${cor}: ${String(e.message || e).slice(0, 200)}`;
            erros.push(msg); console.error("Falha no lote de cor:", msg);
            if (loteId) await core.atualizarStatusLote(loteId, "erro", msg).catch(() => {});
        }
    }
    const final = !erros.length ? "concluida" : sucesso ? "parcial" : "erro";
    await atualizarGrupo(grupoId, final, erros.join(" | ").slice(0, 2000) || null);
}

router.post("/", async (req, res) => {
    if (gruposAtivos.size >= MAX_SIMULTANEOS) return res.status(429).json({ status: "erro", mensagem: "Já existe um lote automático em processamento neste painel." });
    if (!core.apiConfigurada()) return res.status(503).json({ status: "erro", mensagem: "Configure OPENAI_API_KEY para gerar imagens." });
    const imagemId = req.body?.imagem_base_id;
    const chave = String(req.body?.produto_chave || "");
    const modo = String(req.body?.modo || "mesma_pose");
    const corBase = String(req.body?.cor_base || "").trim();
    if (!idValido(imagemId) || chave.length < 2 || chave.length > 300) return res.status(400).json({ status: "erro", mensagem: "Escolha a imagem aprovada e o produto existente." });
    try {
        const mae = await fotoMae(imagemId);
        if (!mae || mae.status_revisao !== "aprovada") return res.status(409).json({ status: "erro", mensagem: "A foto-mãe deve estar aprovada." });
        if (!String(mae.caminho_arquivo).startsWith("/arquivos/geradas/")) return res.status(400).json({ status: "erro", mensagem: "Arquivo da foto-mãe inválido." });
        const { produtos } = await produtosCadastrados();
        const produto = produtos.find(p => p.chave === chave);
        if (!produto) return res.status(404).json({ status: "erro", mensagem: "Produto não cadastrado na loja." });
        const galerias = await imagensGaleria(chave);
        const tarefas = planejarVariacoes({
            cores: req.body?.cores, angulos: req.body?.angulos || [mae.angulo],
            modo, anguloBase: mae.angulo, corBase, galerias
        });
        // Confirma existência do PNG da foto-mãe e das fotos da cor ANTES de cobrar API.
        const maeArquivo = path.join(core.BASE, "geradas", path.basename(mae.caminho_arquivo));
        if (!/^\/arquivos\/geradas\/[a-zA-Z0-9_.-]+\.png$/.test(mae.caminho_arquivo)) throw Object.assign(new Error("Caminho da foto base inválido."), { status: 400 });
        await fs.access(maeArquivo);
        for (const foto of new Set(tarefas.map(t => t.foto))) {
            await fs.access(arquivoGaleriaSeguro(foto));
        }
        const referencias = await core.consultarReferencias(mae.modelo_codigo);
        if (!referencias.length) throw Object.assign(new Error("Modelo sem referências de rosto no banco."), { status: 409 });
        core.selecionarReferencias(referencias, mae.angulo);
        const cores = [...new Set(tarefas.map(t => t.cor))];
        const angulos = [...new Set(tarefas.map(t => t.angulo))];
        const { rows } = await pool.query(`
            INSERT INTO public.lotes_variacoes_ia
              (imagem_base_id,modelo_virtual_id,produto_chave,cor_base,modo,cores_solicitadas,angulos_solicitados,total_solicitado,status)
            VALUES ($1,$2,$3,$4,$5,$6::text[],$7::text[],$8,'processando') RETURNING id
        `, [imagemId, mae.modelo_virtual_id, chave, corBase || null, modo, cores, angulos, tarefas.length]);
        const grupoId = rows[0].id;
        gruposAtivos.add(grupoId);
        setImmediate(() => {
            executarGrupo({ grupoId, mae, produto: { chave, nome: produto.produto || chave }, referencias, tarefas, modo })
                .catch(async e => {
                    console.error("Falha geral do grupo de variações:", e.message);
                    await atualizarGrupo(grupoId, "erro", String(e.message).slice(0, 1000)).catch(() => {});
                }).finally(() => gruposAtivos.delete(grupoId));
        });
        return res.status(202).json({ status: "processando", grupoId, total_imagens: tarefas.length,
            consultaUrl: `/api/variacoes-automaticas/${grupoId}` });
    } catch (e) {
        if (e.message?.includes("fotografia REAL") || e.message?.includes("Selecione") || e.message?.includes("Cores") || e.message?.includes("Limite") || e.message?.includes("ângulos")) e.status = 400;
        return erroPublico(res, e);
    }
});

router.get("/:id", async (req, res) => {
    if (!idValido(req.params.id)) return res.status(400).json({ status: "erro", mensagem: "Grupo inválido." });
    try {
        const { rows } = await pool.query(`SELECT id,imagem_base_id,produto_chave,modo,cores_solicitadas,
            angulos_solicitados,total_solicitado,status,mensagem_erro,criado_em,atualizado_em
            FROM public.lotes_variacoes_ia WHERE id=$1`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ status: "erro", mensagem: "Grupo não encontrado." });
        const lotes = await pool.query(`
            SELECT l.id,l.cor_destino,l.status,l.mensagem_erro,
                   (SELECT COUNT(*)::int FROM public.imagens_geradas_ia i
                    JOIN public.geracoes_imagens_ia g ON g.id=i.geracao_id WHERE g.lote_id=l.id) AS imagens
            FROM public.lotes_geracao_ia l WHERE l.variacao_grupo_id=$1 ORDER BY l.id
        `, [req.params.id]);
        return res.json({ status: "ok", grupo: rows[0], lotes: lotes.rows });
    } catch (e) { return erroPublico(res, e, "Não foi possível acompanhar este grupo."); }
});

module.exports = router;
