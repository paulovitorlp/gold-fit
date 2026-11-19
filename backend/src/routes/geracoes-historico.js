"use strict";

/* Historico protegido pela sessao administrativa, servido pelo server.js. */
const express = require("express");
const path = require("node:path");
const fs = require("node:fs/promises");
const { randomUUID } = require("node:crypto");
const { pool } = require("../db");
const { criarZip } = require("../services/zip");
const router = express.Router();
const BASE = path.resolve(__dirname, "..", "..", "uploads");
const CAMINHO_PUBLICO = "/midia/produtos/";

async function carregarLote(id) {
    const cabecalho = await pool.query(`
        SELECT l.*, m.codigo AS modelo_codigo, m.nome AS modelo_nome
        FROM public.lotes_geracao_ia AS l
        JOIN public.modelos_virtuais AS m ON m.id = l.modelo_virtual_id
        WHERE l.id = $1
    `, [id]);
    if (!cabecalho.rows.length) return null;
    const itens = await pool.query(`
        SELECT g.id AS geracao_id, g.angulo, g.status, g.mensagem_erro,
               i.id AS imagem_id, i.caminho_arquivo AS url, i.tamanho_bytes,
               i.status_revisao, i.observacao_revisao, i.criado_em,
               CASE WHEN i.id IS NOT NULL THEN EXISTS (
                   SELECT 1 FROM public.correcoes_imagens_ia c
                   WHERE c.imagem_raiz_id=i.id OR c.imagem_origem_id=i.id OR c.imagem_resultado_id=i.id
               ) ELSE FALSE END AS tem_historico_correcao
        FROM public.geracoes_imagens_ia AS g
        LEFT JOIN public.imagens_geradas_ia AS i ON i.geracao_id = g.id
        WHERE g.lote_id = $1
        ORDER BY array_position(ARRAY['frente','costas','lado','superior']::text[], g.angulo::text), g.id, i.id
    `, [id]);
    return {
        ...cabecalho.rows[0],
        imagens: itens.rows.filter(r => r.url),
        geracoes: itens.rows
    };
}

function idSeguro(valor) {
    return /^[1-9][0-9]{0,15}$/.test(String(valor)) ? String(valor) : null;
}

function caminhoSeguro(url, prefixo, subpasta) {
    if (typeof url !== "string" || !url.startsWith(prefixo)) throw new Error("Arquivo nao pertence ao repositorio do gerador.");
    const relativo = url.slice(prefixo.length);
    if (!/^[a-zA-Z0-9_./-]{1,200}$/.test(relativo)) throw new Error("Nome de arquivo invalido.");
    const raiz = path.resolve(BASE, subpasta);
    const arquivo = path.resolve(raiz, relativo);
    if (!arquivo.startsWith(raiz + path.sep)) throw new Error("Caminho de arquivo invalido.");
    return arquivo;
}

router.get("/", async (req, res) => {
    try {
        const pagina = Math.max(1, Math.min(100000, parseInt(req.query.pagina, 10) || 1));
        const limite = 20;
        const { rows } = await pool.query(`
            SELECT l.id, l.modelo_virtual_id, m.codigo AS modelo_codigo,
                   m.nome AS modelo_nome, l.nome_produto, l.foto_produto_original,
                   l.angulos_solicitados, l.status, l.mensagem_erro,
                   l.criado_em, l.atualizado_em,
                   (SELECT COUNT(*)::integer FROM public.imagens_geradas_ia i
                    JOIN public.geracoes_imagens_ia g ON g.id = i.geracao_id
                    WHERE g.lote_id = l.id) AS total_imagens,
                   (SELECT MIN(i.caminho_arquivo) FROM public.imagens_geradas_ia i
                    JOIN public.geracoes_imagens_ia g ON g.id = i.geracao_id
                    WHERE g.lote_id = l.id) AS capa,
                   (SELECT COUNT(*)::integer FROM public.imagens_geradas_ia i
                    JOIN public.geracoes_imagens_ia g ON g.id = i.geracao_id
                    WHERE g.lote_id=l.id AND i.status_revisao='aprovada') AS total_aprovadas,
                   (SELECT COUNT(*)::integer FROM public.correcoes_imagens_ia c
                    WHERE c.lote_id=l.id AND c.status='processando') AS correcoes_em_andamento
            FROM public.lotes_geracao_ia l
            JOIN public.modelos_virtuais m ON m.id = l.modelo_virtual_id
            ORDER BY l.criado_em DESC, l.id DESC
            LIMIT $1 OFFSET $2
        `, [limite, (pagina - 1) * limite]);
        const antigas = await pool.query(`
            SELECT g.id AS geracao_id, m.codigo AS modelo_codigo, m.nome AS modelo_nome,
                   g.angulo, g.status, g.criado_em, i.id AS imagem_id,
                   i.status_revisao, i.caminho_arquivo AS url
            FROM public.geracoes_imagens_ia g
            JOIN public.modelos_virtuais m ON m.id = g.modelo_virtual_id
            LEFT JOIN public.imagens_geradas_ia i ON i.geracao_id = g.id
            WHERE g.lote_id IS NULL
            ORDER BY g.criado_em DESC, g.id DESC
            LIMIT 100
        `);
        return res.json({ status: "ok", pagina, lotes: rows, geracoes_antigas: antigas.rows });
    } catch (erro) {
        console.error("Falha no historico de geracoes:", erro.message);
        return res.status(500).json({ status: "erro", mensagem: "Nao foi possivel consultar o historico." });
    }
});

router.get("/:id", async (req, res) => {
    const id = idSeguro(req.params.id);
    if (!id) return res.status(400).json({ status: "erro", mensagem: "Identificador invalido." });
    try {
        const lote = await carregarLote(id);
        if (!lote) return res.status(404).json({ status: "erro", mensagem: "Lote nao encontrado." });
        return res.json({ status: "ok", lote });
    } catch (erro) {
        console.error("Falha ao abrir lote:", erro.message);
        return res.status(500).json({ status: "erro", mensagem: "Nao foi possivel abrir o lote." });
    }
});


/* Verificacao sem alterar tabelas nem consumir creditos da API. */
router.get("/diagnostico/revisao", async (_req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT to_regclass('public.referencias_aprovadas_modelo_ia') IS NOT NULL AS migracao_16,
                   to_regclass('public.imagens_geradas_ia') IS NOT NULL AS imagens,
                   to_regclass('public.estado_loja_pro') IS NOT NULL AS catalogo
        `);
        return res.json({ status: "ok", ...rows[0],
            mensagem: rows[0].migracao_16
                ? "Biblioteca de referencias pronta para aprovacoes."
                : "A migracao SQL 16 ainda precisa ser aplicada ao banco deste Docker."
        });
    } catch (erro) {
        console.error("Diagnostico de revisao:", erro.code || "-", erro.message);
        return res.status(503).json({ status: "erro", mensagem: "Banco de dados nao respondeu." });
    }
});

function arquivoGeradoSeguro(url) {
    return caminhoSeguro(url, "/arquivos/geradas/", "geradas");
}

async function fotoUsadaNaLoja(imagemId, cliente) {
    const { rows } = await cliente.query(`SELECT dados FROM public.estado_loja_pro WHERE documento='produtos'`);
    const dados = rows[0]?.dados;
    const url = `${CAMINHO_PUBLICO}gf-imagem-${imagemId}.png`;
    return Array.isArray(dados) && dados.some(p => p.fotoPrincipal === url);
}

/* Revisao humana. Aprovada -> entra na biblioteca de poses; rejeitada -> desativa.
   Toda atualizacao ocorre em UMA transacao, para nao deixar status falso. */
router.patch("/:id/revisar/:imagemId", async (req, res) => {
    const loteId = idSeguro(req.params.id);
    const imagemId = idSeguro(req.params.imagemId);
    const revisao = String(req.body?.status_revisao || "");
    const justificativa = String(req.body?.observacao_revisao || "").trim().slice(0, 500);
    if (!loteId || !imagemId || !["pendente", "aprovada", "rejeitada"].includes(revisao)) {
        return res.status(400).json({ status: "erro", mensagem: "Lote, imagem ou revisao invalida." });
    }
    const cliente = await pool.connect().catch(() => null);
    if (!cliente) return res.status(503).json({ status: "erro", mensagem: "Banco indisponivel." });
    let iniciou = false;
    try {
        const { rows: ver } = await cliente.query(`SELECT to_regclass('public.referencias_aprovadas_modelo_ia') IS NOT NULL AS ok`);
        if (!ver[0].ok) return res.status(503).json({
            status: "erro", codigo: "MIGRACAO_16_PENDENTE",
            mensagem: "A biblioteca da migracao 16 nao existe neste banco. Execute o script SQL 16 antes de aprovar."
        });
        await cliente.query("BEGIN"); iniciou = true;
        const busca = await cliente.query(`
            SELECT i.id, i.caminho_arquivo, g.modelo_virtual_id, g.angulo
            FROM public.imagens_geradas_ia i
            JOIN public.geracoes_imagens_ia g ON g.id=i.geracao_id
            WHERE g.lote_id=$1 AND i.id=$2
            FOR UPDATE OF i
        `, [loteId, imagemId]);
        if (!busca.rows.length) {
            await cliente.query("ROLLBACK"); iniciou = false;
            return res.status(404).json({ status: "erro", mensagem: "Imagem nao localizada neste lote." });
        }
        const foto = busca.rows[0];
        if (revisao !== "aprovada" && await fotoUsadaNaLoja(imagemId, cliente)) {
            await cliente.query("ROLLBACK"); iniciou = false;
            return res.status(409).json({ status: "erro",
                mensagem: "Esta imagem esta sendo usada no catalogo. Troque a foto principal em Produtos antes de retirar a aprovacao."
            });
        }
        // Parametros SQL com tipos explicitos: evita erro PG 42P08
        // (tipo ambiguo quando um parametro de VARCHAR aparece tambem no CASE).
        // $4 e booleano e indica se a revisao voltou ao estado pendente.
        const atualizada = await cliente.query(`
            UPDATE public.imagens_geradas_ia
            SET status_revisao = $2::varchar(20),
                observacao_revisao = $3::text,
                revisado_em = CASE WHEN $4::boolean THEN NULL ELSE NOW() END
            WHERE id = $1::bigint
            RETURNING id, status_revisao, observacao_revisao, revisado_em
        `, [imagemId, revisao, justificativa || null, revisao === "pendente"]);
        if (revisao === "aprovada") {
            if (!["frente", "costas", "lado", "superior"].includes(foto.angulo) ||
                !String(foto.caminho_arquivo).startsWith("/arquivos/geradas/")) {
                throw new Error("Imagem sem angulo ou caminho valido para a biblioteca de poses.");
            }
            await cliente.query(`
                INSERT INTO public.referencias_aprovadas_modelo_ia
                  (modelo_virtual_id, imagem_gerada_id, angulo, caminho_arquivo, ativo)
                VALUES ($1,$2,$3,$4,TRUE)
                ON CONFLICT(imagem_gerada_id) DO UPDATE
                  SET ativo=TRUE, caminho_arquivo=EXCLUDED.caminho_arquivo, atualizado_em=NOW()
            `, [foto.modelo_virtual_id, imagemId, foto.angulo, foto.caminho_arquivo]);
        } else {
            await cliente.query(`
                UPDATE public.referencias_aprovadas_modelo_ia
                SET ativo=FALSE, atualizado_em=NOW() WHERE imagem_gerada_id=$1
            `, [imagemId]);
        }
        await cliente.query("COMMIT"); iniciou = false;
        return res.json({ status: "ok", imagem: atualizada.rows[0],
            referencia_pose_ativa: revisao === "aprovada",
            mensagem: "Revisao salva no PostgreSQL e biblioteca atualizada." });
    } catch (erro) {
        if (iniciou) await cliente.query("ROLLBACK").catch(() => {});
        console.error("Revisao nao salva: PG", erro.code || "-", erro.message, erro.detail || "");
        return res.status(500).json({ status: "erro", codigo: erro.code || "REVISAO_ERRO",
            mensagem: `Nao foi possivel aprovar esta imagem (codigo ${erro.code || "interno"}). Consulte docker compose logs --tail=50 painel.` });
    } finally { cliente.release(); }
});

/* Excluir somente fotos pendentes ou rejeitadas. Nunca permitir exclusao de aprovada.
   Apaga o registro primeiro, depois o PNG; em falha no disco, informa aviso. */
async function excluirImagem(req, res, antiga = false) {
    const imagemId = idSeguro(req.params.imagemId);
    const loteId = antiga ? null : idSeguro(req.params.id);
    if (!imagemId || (!antiga && !loteId)) return res.status(400).json({ status: "erro", mensagem: "Identificador invalido." });
    const cliente = await pool.connect().catch(() => null);
    if (!cliente) return res.status(503).json({ status: "erro", mensagem: "Banco indisponivel." });
    let arquivo = null;
    let iniciou = false;
    try {
        await cliente.query("BEGIN"); iniciou = true;
        const { rows } = await cliente.query(`
            SELECT i.id, i.caminho_arquivo, i.status_revisao, g.lote_id
            FROM public.imagens_geradas_ia i
            JOIN public.geracoes_imagens_ia g ON g.id=i.geracao_id
            WHERE i.id=$1 AND g.lote_id IS NOT DISTINCT FROM $2::bigint
            FOR UPDATE OF i
        `, [imagemId, loteId]);
        if (!rows.length) {
            await cliente.query("ROLLBACK"); iniciou = false;
            return res.status(404).json({ status: "erro", mensagem: "Imagem nao encontrada." });
        }
        if (rows[0].status_revisao === "aprovada") {
            await cliente.query("ROLLBACK"); iniciou = false;
            return res.status(409).json({ status: "erro", mensagem: "Imagem aprovada nao pode ser excluida. Ela pode ser usada pela loja ou como referencia de pose." });
        }
        const { rows: dependentes } = await cliente.query(`
            SELECT id FROM public.correcoes_imagens_ia
            WHERE imagem_raiz_id=$1 OR imagem_origem_id=$1 OR imagem_resultado_id=$1
            LIMIT 1
        `, [imagemId]);
        if (dependentes.length) {
            await cliente.query("ROLLBACK"); iniciou = false;
            return res.status(409).json({ status: "erro", mensagem: "Esta foto possui historico de correcoes. Preserve a versao original e suas correcoes." });
        }
        arquivo = arquivoGeradoSeguro(rows[0].caminho_arquivo);
        await cliente.query(`DELETE FROM public.imagens_geradas_ia WHERE id=$1`, [imagemId]);
        await cliente.query("COMMIT"); iniciou = false;
    } catch (erro) {
        if (iniciou) await cliente.query("ROLLBACK").catch(() => {});
        console.error("Erro ao excluir registro da imagem:", erro.code || "-", erro.message);
        return res.status(500).json({ status: "erro", mensagem: "Nao foi possivel excluir o registro. Nenhum arquivo foi removido." });
    } finally { cliente.release(); }
    try {
        await fs.unlink(arquivo);
        return res.json({ status: "ok", mensagem: "Fotografia nao aprovada excluida do historico e do disco." });
    } catch (erro) {
        if (erro.code !== "ENOENT") console.error("Arquivo orfao apos exclusao:", arquivo, erro.message);
        return res.json({ status: "ok", aviso: erro.code === "ENOENT"
            ? "Registro excluido; arquivo ja nao existia no disco."
            : "Registro excluido; nao foi possivel remover o PNG do disco. Verifique o log do painel." });
    }
}

router.delete("/antigas/:imagemId", (req, res) => excluirImagem(req, res, true));
router.delete("/:id/imagens/:imagemId", (req, res) => excluirImagem(req, res, false));

/* Publica UMA imagem aprovada como foto principal de um produto ja cadastrado.
   A imagem gerada privada nunca e exposta diretamente: copia-se para pasta publica.
   O administrador decide o produto e se deseja torna-lo visivel no catalogo. */
router.post("/:id/publicar/:imagemId", async (req, res) => {
    const loteId = idSeguro(req.params.id);
    const imagemId = idSeguro(req.params.imagemId);
    const chave = String(req.body?.produto_chave || "").trim();
    const cor = String(req.body?.cor || "").trim();
    if (!loteId || !imagemId || !chave || chave.length > 240 || !cor || cor.length > 90) {
        return res.status(400).json({ status: "erro", mensagem: "Selecione um produto existente." });
    }
    const cliente = await pool.connect().catch(() => null);
    if (!cliente) return res.status(503).json({ status: "erro", mensagem: "Banco indisponivel." });
    let iniciou = false;
    try {
        await cliente.query("BEGIN"); iniciou = true;
        const { rows: imgs } = await cliente.query(`
            SELECT i.caminho_arquivo, i.status_revisao
            FROM public.imagens_geradas_ia i
            JOIN public.geracoes_imagens_ia g ON g.id=i.geracao_id
            WHERE i.id=$1 AND g.lote_id=$2 FOR UPDATE OF i
        `, [imagemId, loteId]);
        if (!imgs.length) {
            await cliente.query("ROLLBACK"); iniciou = false;
            return res.status(404).json({ status: "erro", mensagem: "Foto nao encontrada no lote." });
        }
        if (imgs[0].status_revisao !== "aprovada") {
            await cliente.query("ROLLBACK"); iniciou = false;
            return res.status(409).json({ status: "erro", mensagem: "Aprove a foto antes de utiliza-la na loja." });
        }
        const fonte = arquivoGeradoSeguro(imgs[0].caminho_arquivo);
        await fs.access(fonte);
        const estado = await cliente.query(`SELECT dados FROM public.estado_loja_pro WHERE documento='produtos' FOR UPDATE`);
        const produtos = estado.rows[0]?.dados;
        if (!Array.isArray(produtos)) {
            await cliente.query("ROLLBACK"); iniciou = false;
            return res.status(409).json({ status: "erro", mensagem: "Catalogo nao inicializado. Abra Produtos no painel e salve um produto antes de publicar." });
        }
        const produto = produtos.find(p => p.chave === chave && p.grupo !== "Masculino");
        if (!produto) {
            await cliente.query("ROLLBACK"); iniciou = false;
            return res.status(404).json({ status: "erro", mensagem: "Produto nao encontrado no cadastro do site." });
        }
        // Galeria por cor: fotografia aprovada ocupa um dos 4 slots daquela cor.
        await cliente.query("SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))", [chave, cor]);
        const { rows: existentes } = await cliente.query(
            "SELECT ordem FROM public.galeria_produtos_cor WHERE chave_produto=$1 AND cor=$2 ORDER BY ordem", [chave, cor]);
        const ocupadas = new Set(existentes.map(f => Number(f.ordem)));
        const ordem = [1,2,3,4].find(n => !ocupadas.has(n));
        if (!ordem) {
            await cliente.query("ROLLBACK"); iniciou = false;
            return res.status(409).json({ status: "erro", mensagem: "Esta cor ja possui 4 fotos. Exclua uma na galeria em Produtos e tente novamente." });
        }
        const pastaGaleria = path.join(BASE, "galeria-loja");
        await fs.mkdir(pastaGaleria, { recursive: true });
        const nomeGaleria = `${randomUUID()}.png`;
        await fs.copyFile(fonte, path.join(pastaGaleria, nomeGaleria));
        await cliente.query(`INSERT INTO public.galeria_produtos_cor(chave_produto,cor,ordem,caminho_arquivo)
            VALUES($1,$2,$3,$4)`, [chave, cor, ordem, `/midia/galeria/${nomeGaleria}`]);
        const pasta = path.join(BASE, "publicadas");
        await fs.mkdir(pasta, { recursive: true });
        const destino = path.join(pasta, `gf-imagem-${imagemId}.png`);
        await fs.copyFile(fonte, destino);
        const urlPublica = `${CAMINHO_PUBLICO}gf-imagem-${imagemId}.png`;
        produto.fotoPrincipal = urlPublica;
        await cliente.query(`UPDATE public.estado_loja_pro SET dados=$2::jsonb, atualizado_em=NOW() WHERE documento=$1`,
            ["produtos", JSON.stringify(produtos)]);
        await cliente.query("COMMIT"); iniciou = false;
        return res.json({ status: "ok", imagem_publica: urlPublica, produto: produto.produto,
            publicado: produto.publicado !== false,
            mensagem: produto.publicado === false
                ? "Foto adicionada ao produto. Ele esta oculto; habilite Publicado em Produtos."
                : `Foto principal atualizada e adicionada à galeria da cor ${cor}.` });
    } catch (erro) {
        if (iniciou) await cliente.query("ROLLBACK").catch(() => {});
        console.error("Falha ao usar imagem na loja:", erro.code || "-", erro.message);
        return res.status(500).json({ status: "erro", mensagem: "Nao foi possivel associar a foto ao produto. Verifique os logs do painel." });
    } finally { cliente.release(); }
});

router.get("/:id/baixar/:angulo", async (req, res) => {
    const id = idSeguro(req.params.id);
    const angulo = String(req.params.angulo);
    if (!id || !["frente", "costas", "lado", "superior"].includes(angulo)) {
        return res.status(400).json({ status: "erro", mensagem: "Lote ou angulo invalido." });
    }
    try {
        const lote = await carregarLote(id);
        if (!lote) return res.status(404).json({ status: "erro", mensagem: "Lote nao encontrado." });
        const imagem = lote.imagens.find(i => i.angulo === angulo);
        if (!imagem) return res.status(404).json({ status: "erro", mensagem: "Imagem nao gerada para esse angulo." });
        const arquivo = caminhoSeguro(imagem.url, "/arquivos/geradas/", "geradas");
        return res.download(arquivo, `goldfit-${lote.modelo_codigo}-lote-${id}-${angulo}.png`);
    } catch (erro) {
        console.error("Falha ao baixar imagem:", erro.message);
        if (!res.headersSent) return res.status(500).json({ status: "erro", mensagem: "Imagem nao encontrada no disco." });
    }
});

router.get("/:id/baixar-zip", async (req, res) => {
    const id = idSeguro(req.params.id);
    if (!id) return res.status(400).json({ status: "erro", mensagem: "Identificador invalido." });
    try {
        const lote = await carregarLote(id);
        if (!lote) return res.status(404).json({ status: "erro", mensagem: "Lote nao encontrado." });
        if (!lote.imagens.length) return res.status(409).json({ status: "erro", mensagem: "Lote ainda sem imagens geradas." });
        const arquivos = [];
        let bytes = 0;
        for (const imagem of lote.imagens) {
            const arquivo = caminhoSeguro(imagem.url, "/arquivos/geradas/", "geradas");
            const dados = await fs.readFile(arquivo);
            bytes += dados.length;
            arquivos.push({ nome: `${imagem.angulo}-${imagem.imagem_id}.png`, dados });
        }
        if (lote.foto_produto_original) {
            const original = caminhoSeguro(lote.foto_produto_original, "/arquivos/produtos-ia/", "produtos-ia");
            const dados = await fs.readFile(original);
            bytes += dados.length;
            arquivos.push({ nome: `produto-original${path.extname(original)}`, dados });
        }
        if (bytes > 80 * 1024 * 1024) return res.status(413).json({ status: "erro", mensagem: "Arquivos excedem 80 MB." });
        const zip = criarZip(arquivos);
        res.set("Content-Type", "application/zip");
        res.set("Content-Disposition", `attachment; filename="goldfit-lote-${id}.zip"`);
        res.set("Content-Length", String(zip.length));
        return res.send(zip);
    } catch (erro) {
        console.error("Falha ao baixar ZIP:", erro.message);
        return res.status(500).json({ status: "erro", mensagem: "Nao foi possivel montar o ZIP. Confira se os arquivos ainda estao na pasta uploads." });
    }
});


/* Remocao de um lote INTEIRO do Arquivo Persistente.
   Suporta V1 + versoes corrigidas, sem quebrar as chaves estrangeiras da migracao 18.
   NUNCA remove lotes com foto aprovada ou em processamento. O apagamento dos
   arquivos acontece apenas depois do COMMIT; se houver falha o aviso e informado. */
router.delete("/:id", async (req,res) => {
    const loteId=idSeguro(req.params.id);
    if(!loteId) return res.status(400).json({status:"erro",mensagem:"Identificador de geracao invalido."});
    const cliente=await pool.connect().catch(()=>null);
    if(!cliente) return res.status(503).json({status:"erro",mensagem:"Banco indisponivel."});
    let iniciou=false, caminhos=[];
    try {
        await cliente.query("BEGIN"); iniciou=true;
        const {rows:lotes}=await cliente.query(`
            SELECT id,status,foto_produto_original FROM public.lotes_geracao_ia
            WHERE id=$1 FOR UPDATE
        `,[loteId]);
        if(!lotes.length){
            await cliente.query("ROLLBACK"); iniciou=false;
            return res.status(404).json({status:"erro",mensagem:"Geracao nao encontrada no historico."});
        }
        if(lotes[0].status==='processando'){
            await cliente.query("ROLLBACK"); iniciou=false;
            return res.status(409).json({status:"erro",mensagem:"A geracao ainda esta em andamento. Aguarde terminar para excluir."});
        }
        const {rows:imagens}=await cliente.query(`
            SELECT i.id,i.caminho_arquivo,i.status_revisao
            FROM public.imagens_geradas_ia i
            JOIN public.geracoes_imagens_ia g ON g.id=i.geracao_id
            WHERE g.lote_id=$1 ORDER BY i.id FOR UPDATE OF i
        `,[loteId]);
        if(imagens.some(i=>i.status_revisao==='aprovada')){
            await cliente.query("ROLLBACK"); iniciou=false;
            return res.status(409).json({status:"erro",mensagem:"Esta geracao tem fotos aprovadas. Para proteger a loja e as referencias, exclua apenas as fotos nao aprovadas individualmente."});
        }
        const {rows:rodando}=await cliente.query(`SELECT id FROM public.correcoes_imagens_ia WHERE lote_id=$1 AND status='processando' LIMIT 1`,[loteId]);
        if(rodando.length){
            await cliente.query("ROLLBACK"); iniciou=false;
            return res.status(409).json({status:"erro",mensagem:"Existe uma correcao em andamento neste lote."});
        }
        const ids=imagens.map(i=>i.id);
        if(ids.length){
            const {rows:refs}=await cliente.query(`SELECT id FROM public.referencias_aprovadas_modelo_ia
                WHERE imagem_gerada_id=ANY($1::bigint[]) AND ativo=TRUE LIMIT 1`,[ids]);
            if(refs.length){
                await cliente.query("ROLLBACK"); iniciou=false;
                return res.status(409).json({status:"erro",mensagem:"A geracao possui referencia ativa de modelo. Desative-a antes de excluir."});
            }
        }
        caminhos=imagens.map(i=>arquivoGeradoSeguro(i.caminho_arquivo));
        if(lotes[0].foto_produto_original){
            caminhos.push(caminhoSeguro(lotes[0].foto_produto_original,"/arquivos/produtos-ia/","produtos-ia"));
        }
        const {rows:extras}=await cliente.query(`SELECT referencia_extra_url FROM public.correcoes_imagens_ia
            WHERE lote_id=$1 AND referencia_extra_url IS NOT NULL`,[loteId]);
        for(const r of extras){
            caminhos.push(caminhoSeguro(r.referencia_extra_url,"/arquivos/correcoes-referencias/","correcoes-referencias"));
        }
        // Primeiro remover os registros de correcoes, pois a migracao 18 usa ON DELETE RESTRICT.
        await cliente.query(`DELETE FROM public.correcoes_imagens_ia WHERE lote_id=$1`,[loteId]);
        // A FK das imagens possui ON DELETE CASCADE.
        await cliente.query(`DELETE FROM public.geracoes_imagens_ia WHERE lote_id=$1`,[loteId]);
        await cliente.query(`DELETE FROM public.lotes_geracao_ia WHERE id=$1`,[loteId]);
        await cliente.query("COMMIT"); iniciou=false;
    }catch(erro){
        if(iniciou)await cliente.query("ROLLBACK").catch(()=>{});
        console.error("Falha ao excluir lote no historico:",erro.code||"-",erro.message);
        return res.status(500).json({status:"erro",mensagem:"Nao foi possivel excluir o lote do banco. Nenhuma foto foi removida. Confira os logs do painel."});
    }finally{cliente.release();}
    let falhas=0;
    for(const arquivo of new Set(caminhos)){
        try{await fs.unlink(arquivo);}catch(e){if(e.code!=="ENOENT"){falhas++;console.error("Falha ao apagar arquivo de lote:",e.message);}}
    }
    return res.json({status:"ok",lote_id:loteId,arquivos:caminhos.length,
        mensagem:falhas ? `Geracao removida do historico. ${falhas} arquivo(s) nao puderam ser apagados; confira logs.`
            :"Geracao e suas versoes nao aprovadas removidas do historico e do armazenamento."});
});


module.exports = router;
