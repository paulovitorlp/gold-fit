"use strict";

/* Gold Fit Pro — geracao por lote com persistencia de originais e resultados.
   Mantem resposta da rota antiga: POST individual retorna json.imagem.url.
   POST com kit retorna 202 e deve ser acompanhado por GET /api/geracoes-imagens/:id. */
const express = require("express");
const multer = require("multer");
const path = require("node:path");
const fs = require("node:fs/promises");
const { randomUUID } = require("node:crypto");
const { pool } = require("../db");
const { ANGULOS, VERSAO_PROMPT, criarPrompt } = require("../services/prompts-geracao");

const router = express.Router();
const ESTILO = "top_legging_poliamida_lisa";
const BASE = path.resolve(__dirname, "..", "..", "uploads");
const LIMITE_FOTO = 10 * 1024 * 1024;
const ativos = new Set();
const MAX_LOTES_SIMULTANEOS = 2;
// Each extra photograph is evidence of the GARMENT, not of the selected model.
const CAMPOS_REFS_PRODUTO = Object.freeze([
    { campo: "fotoFrenteExtra", tipo: "frente_adicional", legenda: "frente adicional" },
    { campo: "fotoCostas", tipo: "costas", legenda: "costas" },
    { campo: "fotoLado", tipo: "lado", legenda: "lateral" },
    { campo: "fotoDetalhes", tipo: "detalhes", legenda: "detalhes" }
]);


const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: LIMITE_FOTO, files: 5 },
    fileFilter(_req, file, cb) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
            return cb(Object.assign(new Error("Envie JPG, PNG ou WEBP."), { status: 400 }));
        }
        cb(null, true);
    }
});

const ORIGENS_FOTO = Object.freeze(["auto","vestida","exposta"]);
function origemFoto(valor) {
    const origem = String(valor || "auto").toLowerCase();
    if (!ORIGENS_FOTO.includes(origem)) throw Object.assign(new Error("Tipo de fotografia invalido."), {status:400});
    return origem;
}
const camposPermitidos = [
    { name: "fotoProduto", maxCount: 1 },
    ...CAMPOS_REFS_PRODUTO.map(campo => ({ name: campo.campo, maxCount: 1 }))
];

function obterRefsProdutoAdicionais(files, body = {}) {
    const extras = [];
    for (const item of CAMPOS_REFS_PRODUTO) {
        const file = files?.[item.campo]?.[0];
        if (!file) continue;
        const formato = formatoReal(file.buffer);
        if (!formato || file.size > LIMITE_FOTO) {
            throw Object.assign(new Error(`Imagem adicional invalida (${item.legenda}). Use JPG, PNG ou WEBP ate 10 MB.`), {status:400});
        }
        extras.push({ tipo:item.tipo, legenda:item.legenda, formato, buffer:file.buffer, tamanho:file.size,
            origem:origemFoto(body["origemFoto" + item.campo.slice(4)]) });
    }
    return extras;
}

function ordenarRefsProdutoPorAngulo(extras, angulo) {
    const prioridade = angulo === "costas" ? ["costas","detalhes","lado","frente_adicional"]
        : angulo === "lado" ? ["lado","detalhes","frente_adicional","costas"]
        : angulo === "superior" ? ["detalhes","frente_adicional","costas","lado"]
        : ["frente_adicional","detalhes","lado","costas"];
    return [...extras].sort((a,b) => prioridade.indexOf(a.tipo) - prioridade.indexOf(b.tipo));
}

function formatoReal(buffer) {
    if (!buffer || buffer.length < 12) return null;
    if (buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return { mime: "image/jpeg", ext: "jpg" };
    if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { mime: "image/png", ext: "png" };
    if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
    return null;
}

function angulosDesejados(body) {
    const valor = body?.angulos ?? body?.tipoGeracao ?? "frente";
    let lista;
    if (Array.isArray(valor)) lista = valor;
    else if (typeof valor === "string" && valor.trim().startsWith("[")) {
        try { lista = JSON.parse(valor); } catch (_) { throw new Error("Lista de angulos invalida."); }
    } else if (valor === "kit" || valor === "completo") lista = ANGULOS;
    else lista = String(valor).split(",");
    if (!Array.isArray(lista) || !lista.length || lista.length > 4 ||
        lista.some(a => !ANGULOS.includes(a)) || new Set(lista).size !== lista.length) {
        throw new Error("Escolha entre frente, costas, lado e superior, sem repetir angulos.");
    }
    return lista;
}

function apiConfigurada() { return /^sk-/.test(process.env.OPENAI_API_KEY || ""); }
router.get("/status", (_req, res) => res.json({
    status: "ok",
    disponivel: apiConfigurada(),
    modelo: process.env.GF_IMAGE_MODEL || "gpt-image-2.5-flare",
    angulos_disponiveis: ANGULOS,
    mensagem: apiConfigurada()
        ? "Chave configurada; limites, credito e permissao avaliados na geracao."
        : "Configure OPENAI_API_KEY no .env da raiz e recrie o painel."
}));

async function consultarReferencias(codigo) {
    const { rows } = await pool.query(`
        SELECT m.id AS modelo_id, m.nome, m.calcado_padrao, m.instrucoes_identidade, e.id AS estilo_id,
               r.id AS referencia_id, r.tipo, r.uso, r.caminho_arquivo, r.principal, r.ordem
        FROM public.modelos_virtuais AS m
        JOIN public.referencias_estilo_modelo_ia AS r ON r.modelo_virtual_id = m.id
        JOIN public.estilos_geracao_ia AS e ON e.id = r.estilo_id
        WHERE m.codigo = $1 AND m.genero = 'feminino' AND m.ativo = TRUE
          AND e.codigo = $2 AND e.ativo = TRUE
        ORDER BY r.ordem, r.id
    `, [codigo, ESTILO]);
    return rows;
}
function caminhoReferenciaSeguro(url) {
    // Apenas caminhos relativos gerados pelo próprio sistema; nunca uma URL externa.
    const fontes = [
        { prefixo: "/arquivos/modelos/", pasta: "modelos" },
        { prefixo: "/arquivos/geradas/", pasta: "geradas" }
    ];
    const fonte = fontes.find(f => typeof url === "string" && url.startsWith(f.prefixo));
    if (!fonte) throw new Error("Referencia de imagem invalida.");
    const nome = url.slice(fonte.prefixo.length);
    if (!/^[A-Za-z0-9_./-]{1,240}\.(png|jpg|jpeg|webp)$/i.test(nome)) {
        throw new Error("Nome de referencia invalido.");
    }
    const raiz = path.resolve(BASE, fonte.pasta);
    const arquivo = path.resolve(raiz, nome);
    if (!arquivo.startsWith(raiz + path.sep)) throw new Error("Referencia fora da pasta autorizada.");
    return arquivo;
}
async function incluirReferencia(form, item) {
    const dados = await fs.readFile(caminhoReferenciaSeguro(item.caminho_arquivo));
    const formato = formatoReal(dados);
    if (!formato) throw new Error(`Imagem de referencia invalida: ${item.tipo}.`);
    form.append("image[]", new Blob([dados], { type: formato.mime }), `${item.tipo}-${randomUUID()}.${formato.ext}`);
}
function selecionarReferencias(referencias, angulo) {
    const rosto = referencias.find(r => r.tipo === "rosto" && r.uso === "identidade") || referencias.find(r => r.uso === "identidade");
    const frente = referencias.find(r => r.tipo === "frente" && r.principal) || referencias.find(r => r.tipo === "frente");
    const tipoDesejado = angulo === "lado" ? "lateral" : angulo;
    const pose = referencias.find(r => r.tipo === tipoDesejado && r.principal) || referencias.find(r => r.tipo === tipoDesejado) || frente;
    if (!rosto || !frente || !pose) throw new Error("A modelo precisa de referencias de rosto e frente no banco.");
    const selecionadas = [...new Map([rosto, pose, frente].map(r => [r.caminho_arquivo, r])).values()];
    return { selecionadas, rosto, pose, frente };
}

async function selecionarPoseAprovada(modeloId, angulo, loteId) {
    // Banco de POSES: apenas fotos da mesma modelo e mesmo angulo,
    // aprovadas e ativas; nunca são consideradas referências de produto.
    const { rows } = await pool.query(`
        SELECT r.caminho_arquivo
        FROM public.referencias_aprovadas_modelo_ia r
        JOIN public.imagens_geradas_ia i ON i.id = r.imagem_gerada_id
        WHERE r.modelo_virtual_id = $1 AND r.angulo = $2
          AND r.ativo = TRUE AND r.uso = 'pose'
          AND i.status_revisao = 'aprovada'
        ORDER BY r.criado_em DESC, r.id DESC
        LIMIT 8
    `, [modeloId, angulo]);
    if (!rows.length) return null;
    // Alterna as referências usadas entre lotes, evitando sempre a mesma pose.
    for (let tentativa = 0; tentativa < rows.length; tentativa++) {
        const item = rows[(Number(loteId) + tentativa) % rows.length];
        try {
            await fs.access(caminhoReferenciaSeguro(item.caminho_arquivo));
            return { tipo: 'pose_aprovada', caminho_arquivo: item.caminho_arquivo };
        } catch (erro) {
            console.warn('Referencia de pose aprovada indisponivel no disco:', item.caminho_arquivo);
        }
    }
    return null;
}

async function consultarAPI({ original, formato, referencias, angulo, prompt, poseAprovada = null, referenciasProduto = [] }) {
    const refs = selecionarReferencias(referencias, angulo);
    const form = new FormData();
    form.append("model", process.env.GF_IMAGE_MODEL || "gpt-image-2.5-flare");
    form.append("prompt", prompt);
    form.append("size", "1024x1536");
    form.append("quality", "high");
    form.append("n", "1");
    // A imagem principal sempre e a primeira referencia e define a roupa.
    form.append("image[]", new Blob([original], { type: formato.mime }), `produto-principal.${formato.ext}`);
    // Fotos adicionais do mesmo produto ANTES das fotos da modelo, para evitar
    // a transferencia de detalhes de roupas antigas para a nova colecao.
    for (const item of ordenarRefsProdutoPorAngulo(referenciasProduto, angulo)) {
        form.append("image[]", new Blob([item.buffer], { type: item.formato.mime }),
            `produto-${item.tipo}.${item.formato.ext}`);
    }
    for (const ref of refs.selecionadas) await incluirReferencia(form, ref);
    // A última imagem, se houver, é apenas apoio de pose: o prompt proíbe copiar sua roupa.
    if (poseAprovada) await incluirReferencia(form, poseAprovada);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 170000);
    let resposta;
    try {
        resposta = await fetch("https://api.openai.com/v1/images/edits", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
            body: form,
            signal: controller.signal
        });
    } finally { clearTimeout(timeout); }
    const json = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
        const motivo = String(json.error?.message || "Erro sem detalhes da API.").slice(0, 300);
        console.error("Falha na API de imagens:", resposta.status, motivo);
        const erro = new Error(
            resposta.status === 429 ? `API sem creditos ou com limite: ${motivo}` :
            resposta.status === 401 ? "Chave da OpenAI invalida ou revogada." :
            `API recusou a geracao (${resposta.status}): ${motivo}`
        );
        erro.status = resposta.status === 429 ? 429 : 502;
        throw erro;
    }
    const base64 = json.data?.[0]?.b64_json;
    if (!base64) throw new Error("API nao devolveu PNG. Verifique o modelo de imagem selecionado.");
    const buffer = Buffer.from(base64, "base64");
    const assinaturaPNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (buffer.length < 1000 || !buffer.subarray(0, 8).equals(assinaturaPNG)) {
        throw new Error("Resposta de imagem invalida. Nenhum arquivo foi registrado como concluido.");
    }
    return { buffer, prompt, refs };
}

async function atualizarStatusLote(loteId, status, mensagem = null) {
    await pool.query(`
        UPDATE public.lotes_geracao_ia
        SET status=$2, mensagem_erro=$3, atualizado_em=NOW()
        WHERE id=$1
    `, [loteId, status, mensagem]);
}

async function processarLote({ loteId, codigo, referencias, original, formato, angulos, detalhes, nomeProduto, categoria, tecido, referenciasProduto = [], origemPrincipal = "auto" }) {
    const resultado = [];
    const erros = [];
    for (const angulo of angulos) {
        let geracaoId = null;
        try {
            const refs = selecionarReferencias(referencias, angulo);
            const poseAprovada = await selecionarPoseAprovada(referencias[0].modelo_id, angulo, loteId);
            const prompt = criarPrompt({
                nome: referencias[0].nome, angulo, detalhes,
                calcado: referencias[0].calcado_padrao || "tenis branco",
                identidade: referencias[0].instrucoes_identidade || "",
                // Alternar postura sem sacrificar o angulo solicitado.
                variacao: Number(loteId) + ANGULOS.indexOf(angulo),
                referenciaAprovada: Boolean(poseAprovada),
                referenciasProduto: referenciasProduto.map(item => ({tipo:item.tipo, origem:item.origem})), origemPrincipal
            });
            const banco = await pool.query(`
                INSERT INTO public.geracoes_imagens_ia
                    (lote_id, estilo_id, nome_produto, categoria, tecido,
                     modelo_virtual_id, cor_nome, cor_hex, angulo,
                     detalhes_produto, referencias, prompt, versao_prompt, status)
                VALUES ($1, $2, $3, $4, $5, $6, 'conforme fotografia', '#FFFFFF', $7,
                        $8, $9::jsonb, $10, $11, 'processando')
                RETURNING id
            `, [loteId, referencias[0].estilo_id, nomeProduto, categoria, tecido,
                referencias[0].modelo_id, angulo, detalhes,
                JSON.stringify({ produto: "original salvo", rosto: refs.rosto.caminho_arquivo,
                    pose: refs.pose.caminho_arquivo, pose_aprovada: poseAprovada?.caminho_arquivo || null,
                    referencias_produto: referenciasProduto.map(item => ({tipo:item.tipo, tipo_foto:item.origem, caminho_arquivo:item.url})) }),
                prompt, VERSAO_PROMPT]);
            geracaoId = banco.rows[0].id;
            const { buffer } = await consultarAPI({ original, formato, referencias, angulo, prompt, poseAprovada, referenciasProduto });
            const arquivoNome = `${codigo.toLowerCase()}-${angulo}-${Date.now()}-${randomUUID()}.png`;
            await fs.mkdir(path.join(BASE, "geradas"), { recursive: true });
            await fs.writeFile(path.join(BASE, "geradas", arquivoNome), buffer, { flag: "wx" });
            const url = `/arquivos/geradas/${arquivoNome}`;
            await pool.query(`
                INSERT INTO public.imagens_geradas_ia
                    (geracao_id, caminho_arquivo, angulo, tamanho_bytes)
                VALUES ($1, $2, $3, $4)
            `, [geracaoId, url, angulo, buffer.length]);
            await pool.query(`UPDATE public.geracoes_imagens_ia SET status='concluida', atualizado_em=NOW() WHERE id=$1`, [geracaoId]);
            resultado.push({ angulo, url, nome: arquivoNome, status_revisao: "pendente" });
        } catch (error) {
            const mensagem = String(error.message || "Falha desconhecida").slice(0, 300);
            erros.push({ angulo, mensagem, status: error.status || 500 });
            console.error(`Lote ${loteId}, angulo ${angulo}:`, mensagem);
            if (geracaoId) {
                await pool.query(`
                    UPDATE public.geracoes_imagens_ia
                    SET status='erro', mensagem_erro=$2, atualizado_em=NOW()
                    WHERE id=$1 AND status <> 'concluida'
                `, [geracaoId, mensagem]).catch(err => console.error("Falha ao registrar erro:", err.message));
            }
        }
    }
    const status = erros.length === 0 ? "concluida" : resultado.length ? "parcial" : "erro";
    await atualizarStatusLote(loteId, status, erros.map(e => `${e.angulo}: ${e.mensagem}`).join(" | ") || null);
    return { status, imagens: resultado, erros };
}

router.post("/", upload.fields(camposPermitidos), async (req, res) => {
    const codigo = String(req.body?.modeloCodigo || "").trim().toUpperCase();
    const detalhes = String(req.body?.detalhes || "").trim().slice(0, 500);
    const nomeProduto = String(req.body?.nomeProduto || "Produto enviado pelo administrador").trim().slice(0, 150);
    const categoria = String(req.body?.categoria || "roupa fitness").trim().slice(0, 100);
    const tecido = String(req.body?.tecido || "conforme fotografia").trim().slice(0, 100);
    const principal = req.files?.fotoProduto?.[0];
    const formato = formatoReal(principal?.buffer);
    let referenciasProduto;
    try { referenciasProduto = obterRefsProdutoAdicionais(req.files, req.body); }
    catch (erro) { return res.status(400).json({status:"erro", mensagem:erro.message}); }
    let origemPrincipal;
    try { origemPrincipal = origemFoto(req.body?.origemFotoPrincipal); }
    catch(erro) { return res.status(400).json({status:"erro", mensagem:erro.message}); }
    let angulos;
    try { angulos = angulosDesejados(req.body); }
    catch (e) { return res.status(400).json({ status: "erro", mensagem: e.message }); }
    if (!/^F0[1-5]$/.test(codigo) || !formato || !nomeProduto) {
        return res.status(400).json({ status: "erro", mensagem: "Escolha a modelo e envie foto valida do produto JPG/PNG/WEBP." });
    }
    if (!apiConfigurada()) return res.status(503).json({ status: "erro", mensagem: "Configure OPENAI_API_KEY no .env da raiz." });
    if (ativos.size >= MAX_LOTES_SIMULTANEOS) return res.status(429).json({ status: "erro", mensagem: "Ja existem geracoes em andamento. Aguarde finalizar antes de iniciar outra." });

    let loteId = null;
    try {
        const referencias = await consultarReferencias(codigo);
        if (!referencias.length) return res.status(404).json({ status: "erro", mensagem: "Modelo sem referencias no PostgreSQL." });
        selecionarReferencias(referencias, "frente");

        // Primeiro registra um lote duravel, antes de chamar a API externa.
        const criada = await pool.query(`
            INSERT INTO public.lotes_geracao_ia
                (modelo_virtual_id, estilo_id, nome_produto, categoria, tecido,
                 detalhes_produto, angulos_solicitados, status)
            VALUES ($1,$2,$3,$4,$5,$6,$7::text[],'processando') RETURNING id
        `, [referencias[0].modelo_id, referencias[0].estilo_id, nomeProduto,
            categoria, tecido, detalhes, angulos]);
        loteId = criada.rows[0].id;
        const pastaOriginais = path.join(BASE, "produtos-ia", String(loteId));
        await fs.mkdir(pastaOriginais, { recursive: true });
        const originalNome = `original-${randomUUID()}.${formato.ext}`;
        await fs.writeFile(path.join(pastaOriginais, originalNome), principal.buffer, { flag: "wx" });
        await pool.query(`
            UPDATE public.lotes_geracao_ia
            SET foto_produto_original=$2, tipo_foto_principal=$3, atualizado_em=NOW() WHERE id=$1
        `, [loteId, `/arquivos/produtos-ia/${loteId}/${originalNome}`, origemPrincipal]);

        // Persistir todas as evidencias da roupa no disco e no PostgreSQL.
        // Esses arquivos sao privados e protegidos pela sessao administrativa.
        for (const item of referenciasProduto) {
            const nomeRef = `produto-${item.tipo}-${randomUUID()}.${item.formato.ext}`;
            const url = `/arquivos/produtos-ia/${loteId}/${nomeRef}`;
            await fs.writeFile(path.join(pastaOriginais, nomeRef), item.buffer, {flag:"wx"});
            await pool.query(`
                INSERT INTO public.referencias_produto_geracao_ia
                    (lote_id, tipo, caminho_arquivo, mime, tamanho_bytes, tipo_foto)
                VALUES ($1,$2,$3,$4,$5,$6)
            `, [loteId,item.tipo,url,item.formato.mime,item.tamanho,item.origem]);
            item.url = url;
        }

        const tarefa = { loteId, codigo, referencias, original: principal.buffer, formato,
            angulos, detalhes, nomeProduto, categoria, tecido, referenciasProduto, origemPrincipal };
        ativos.add(loteId);
        if (angulos.length > 1) {
            // Quatro chamadas podem demorar varios minutos: devolver 202 e permitir polling.
            setImmediate(() => {
                processarLote(tarefa).catch(async error => {
                    console.error("Falha inesperada no lote:", loteId, error.message);
                    await atualizarStatusLote(loteId, "erro", error.message.slice(0, 300)).catch(() => {});
                }).finally(() => ativos.delete(loteId));
            });
            return res.status(202).json({
                status: "processando", loteId, modelo: codigo, angulos,
                consultaUrl: `/api/geracoes-imagens/${loteId}`,
                mensagem: "Lote recebido e foto original salva. Consulte o status ate concluir."
            });
        }
        // Compatibilidade com a interface antiga: uma foto frontal e retorno imediato.
        try {
            const concluido = await processarLote(tarefa);
            if (concluido.imagens.length === 0) {
                const primeiro = concluido.erros[0] || {};
                return res.status(primeiro.status === 429 ? 429 : 502).json({
                    status: "erro", loteId, mensagem: primeiro.mensagem || "Nao foi possivel gerar a foto."
                });
            }
            return res.json({ status: "ok", loteId, modelo: codigo,
                imagem: concluido.imagens[0], imagens: concluido.imagens });
        } finally { ativos.delete(loteId); }
    } catch (erro) {
        console.error("Erro ao preparar geracao:", erro.message);
        if (loteId) await atualizarStatusLote(loteId, "erro", erro.message.slice(0, 300)).catch(() => {});
        ativos.delete(loteId);
        return res.status(500).json({ status: "erro", mensagem: "Falha ao salvar o lote no PostgreSQL ou no disco. Consulte os logs do painel." });
    }
});

// Os mesmos filtros de imagem e integrações com a API são reutilizados no módulo V12.
// A rota V12 nunca acessa estas funções pela rede pública.
router.auxiliaresReferenciasV14 = Object.freeze({ CAMPOS_REFS_PRODUTO, ORIGENS_FOTO, origemFoto, obterRefsProdutoAdicionais, ordenarRefsProdutoPorAngulo });
router.auxiliaresVariacoes = Object.freeze({
    consultarReferencias, selecionarReferencias, consultarAPI,
    formatoReal, apiConfigurada, BASE, atualizarStatusLote
});
module.exports = router;
