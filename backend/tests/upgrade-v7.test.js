"use strict";
/* Testes sem banco real e sem API paga: simula respostas PostgreSQL e arquivos. */
const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const rotas = { get: [], patch: [], delete: [], post: [] };
const fakeRouter = {};
for (const metodo of Object.keys(rotas)) {
    fakeRouter[metodo] = (caminho, callback) => rotas[metodo].push({ caminho, callback });
}
let modo = "ok";
let revisao = "pendente";
const consultas = [];
let copias = [];
let exclusoes = [];
let produtos = [{ chave: "Top|ALO", produto: "Top", grupo: "Feminino", publicado: true, fotoPrincipal: "" }];
const arquivoURL = "/arquivos/geradas/teste-v7.png";
const sql = async (query, params = []) => {
    const q = String(query).replace(/\s+/g, " ").trim();
    consultas.push({ q, params });
    if (q.includes("to_regclass('public.referencias_aprovadas_modelo_ia')") && q.includes("AS ok")) {
        return { rows: [{ ok: modo !== "sem_migracao" }] };
    }
    if (q.startsWith("SELECT i.id, i.caminho_arquivo, g.modelo_virtual_id")) {
        return { rows: [{ id: 9, caminho_arquivo: arquivoURL, modelo_virtual_id: 2, angulo: "frente" }] };
    }
    if (q.startsWith("SELECT i.id, i.caminho_arquivo, i.status_revisao")) {
        return { rows: [{ id: 9, caminho_arquivo: arquivoURL, status_revisao: revisao, lote_id: 1 }] };
    }
    if (q.startsWith("SELECT i.caminho_arquivo, i.status_revisao")) {
        return { rows: [{ caminho_arquivo: arquivoURL, status_revisao: revisao }] };
    }
    if (q.startsWith("SELECT dados FROM public.estado_loja_pro")) return { rows: [{ dados: produtos }] };
    if (/RETURNING id,\s*status_revisao/.test(q)) return { rows: [{ id: 9, status_revisao: params[1] }] };
    if (q.startsWith("UPDATE public.estado_loja_pro")) produtos = JSON.parse(params[1]);
    return { rows: [] };
};
const pool = { connect: async () => ({ query: sql, release: () => {} }), query: sql };
const fsMock = {
    access: async () => {},
    mkdir: async () => {},
    copyFile: async (src, dst) => { copias.push([src, dst]); },
    unlink: async file => { exclusoes.push(file); },
    readFile: async () => Buffer.from("teste")
};
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === "express") return { Router: () => fakeRouter };
    if (request === "node:fs/promises") return fsMock;
    if (request === "../db" && parent?.filename.endsWith("geracoes-historico.js")) return { pool };
    if (request === "../services/zip") return { criarZip: () => Buffer.alloc(10) };
    return originalLoad.apply(this, arguments);
};
try { require("../src/routes/geracoes-historico"); }
finally { Module._load = originalLoad; }

const handler = (metodo, url) => rotas[metodo].find(r => r.caminho === url)?.callback;
const resposta = () => ({
    code: 200, body: null,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; }
});

test("rota de diagnostico e operacoes administrativas registradas", () => {
    for (const [metodo, caminho] of [
        ["get", "/diagnostico/revisao"],
        ["patch", "/:id/revisar/:imagemId"],
        ["delete", "/:id/imagens/:imagemId"],
        ["delete", "/antigas/:imagemId"],
        ["post", "/:id/publicar/:imagemId"]
    ]) assert.equal(typeof handler(metodo, caminho), "function", `${metodo} ${caminho}`);
});

test("diagnostico identifica migracao 16 ausente sem aprovar", async () => {
    modo = "sem_migracao";
    const res = resposta();
    await handler("patch", "/:id/revisar/:imagemId")({ params: { id: "1", imagemId: "9" }, body: { status_revisao: "aprovada" } }, res);
    assert.equal(res.code, 503);
    assert.equal(res.body.codigo, "MIGRACAO_16_PENDENTE");
    modo = "ok";
});

test("aprovar fotografia salva status e alimenta biblioteca em uma transacao", async () => {
    consultas.length = 0;
    const res = resposta();
    await handler("patch", "/:id/revisar/:imagemId")({ params: { id: "1", imagemId: "9" }, body: { status_revisao: "aprovada" } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.referencia_pose_ativa, true);
    assert(consultas.some(c => c.q.includes("INSERT INTO public.referencias_aprovadas_modelo_ia")));
    assert(consultas.some(c => c.q === "COMMIT"));
    const atualizacao = consultas.find(c => c.q.startsWith("UPDATE public.imagens_geradas_ia"));
    assert(atualizacao, "A revisao deve atualizar a imagem antes de criar a referencia");
    assert.match(atualizacao.q, /status_revisao = \$2::varchar\(20\)/);
    assert.match(atualizacao.q, /CASE WHEN \$4::boolean THEN NULL ELSE NOW\(\) END/);
    assert.deepEqual(atualizacao.params, ["9", "aprovada", null, false]);
});

test("voltar a pendente limpa a data sem ambiguidade de parametros no PostgreSQL", async () => {
    consultas.length = 0;
    produtos = [{ chave: "Top|ALO", produto: "Top", grupo: "Feminino", publicado: true, fotoPrincipal: "" }];
    const res = resposta();
    await handler("patch", "/:id/revisar/:imagemId")({ params: { id: "1", imagemId: "9" }, body: { status_revisao: "pendente" } }, res);
    assert.equal(res.code, 200);
    const atualizacao = consultas.find(c => c.q.startsWith("UPDATE public.imagens_geradas_ia"));
    assert(atualizacao, "Consulta de atualizacao nao encontrada");
    assert.deepEqual(atualizacao.params, ["9", "pendente", null, true]);
    assert.match(atualizacao.q, /revisado_em = CASE WHEN \$4::boolean/);
    assert(consultas.some(c => c.q.includes("SET ativo=FALSE")));
    assert(consultas.some(c => c.q === "COMMIT"));
});

test("exclusao de imagem aprovada e bloqueada inclusive por API", async () => {
    revisao = "aprovada";
    exclusoes = [];
    const res = resposta();
    await handler("delete", "/:id/imagens/:imagemId")({ params: { id: "1", imagemId: "9" } }, res);
    assert.equal(res.code, 409);
    assert.equal(exclusoes.length, 0);
});

test("imagem pendente pode ser excluida com registro e PNG", async () => {
    revisao = "pendente";
    exclusoes = [];
    const res = resposta();
    await handler("delete", "/:id/imagens/:imagemId")({ params: { id: "1", imagemId: "9" } }, res);
    assert.equal(res.code, 200);
    assert.equal(exclusoes.length, 1);
    assert.match(exclusoes[0], /geradas[/\\]teste-v7\.png$/);
});

test("foto aprovada pode ser copiada para o catalogo publico", async () => {
    revisao = "aprovada";
    produtos = [{ chave: "Top|ALO", produto: "Top", grupo: "Feminino", publicado: true, fotoPrincipal: "" }];
    copias = [];
    const res = resposta();
    await handler("post", "/:id/publicar/:imagemId")({ params: { id: "1", imagemId: "9" }, body: { produto_chave: "Top|ALO" } }, res);
    assert.equal(res.code, 200);
    assert.equal(produtos[0].fotoPrincipal, "/midia/produtos/gf-imagem-9.png");
    assert.equal(copias.length, 1);
});
