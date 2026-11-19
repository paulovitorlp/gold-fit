"use strict";
// Testes gratuitos: prompt, estrutura e integridade dos arquivos.
// Nao chamam OpenAI, nao acessam PostgreSQL e nao usam creditos.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TIPOS, VERSAO_PROMPT_CORRECAO, instrucoesCorrecao } = require("../src/services/prompts-correcao");
const raiz = path.resolve(__dirname, "..", "..");
function ler(caminho) { return fs.readFileSync(path.join(raiz, caminho), "utf8"); }

test("01 — o prompt atualizado anuncia versao V13", () => {
    assert.equal(VERSAO_PROMPT_CORRECAO, "GF-CORRECAO-V13");
});
test("02 — existe correcao especifica para alças, costuras e logos", () => {
    assert.ok(TIPOS.alca_decote && TIPOS.costura && TIPOS.logo);
});
test("03 — a primeira imagem permanece a fotografia-base", () => {
    const p = instrucoesCorrecao({ tipo:"alca_decote", descricao:"Acertar a linha branca da alca.", comOriginal:true });
    assert.match(p, /PRIMEIRA IMAGEM/);
    assert.match(p, /EDICAO POR TEXTO SEM MASCARA/);
    assert.match(p, /SEGUNDA IMAGEM/);
});
test("04 — referencia extra nao altera a identidade da modelo", () => {
    const p = instrucoesCorrecao({ tipo:"costura", descricao:"Ajustar apenas a costura.", comExtra:true, comRosto:true });
    assert.match(p, /NAO copiar rosto/);
    assert.match(p, /REFERENCIA DE IDENTIDADE/);
});
test("05 — descarta instruçao muito curta", () => {
    assert.throws(() => instrucoesCorrecao({ tipo:"logo", descricao:"logo" }), /8 a 1500/);
});
test("06 — bloqueia categoria desconhecida", () => {
    assert.throws(() => instrucoesCorrecao({ tipo:"xxx", descricao:"Corrigir somente uma linha." }), /invalido/);
});
test("07 — migration 18 guarda original, resultado e versao", () => {
    const sql = ler("banco-de-dados/18_correcao_imagens_ia.sql");
    for (const col of ["imagem_raiz_id","imagem_origem_id","imagem_resultado_id","versao","status","instrucoes"]) assert.ok(sql.includes(col));
    assert.match(sql, /CREATE TABLE IF NOT EXISTS/);
    assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE TABLE/i);
});
test("08 — backend usa API de edicao e salva novo PNG", () => {
    const source = ler("backend/src/routes/correcoes-imagens.js");
    assert.match(source, /\/v1\/images\/edits/);
    assert.match(source, /INSERT INTO public\.imagens_geradas_ia/);
    assert.match(source, /status_revisao: "pendente"/);
});
test("09 — front tem modal, botao e retorno ao historico", () => {
    const html = ler("site/admin/gerador-imagens.html");
    const js = ler("site/js/gerador-imagens.js");
    assert.match(html, /id="gf9Modal"/);
    assert.match(html, /id="gf9Referencia"/);
    assert.match(js, /gf9-corrigir/);
    assert.match(js, /goldfit:correcao-concluida/);
});
test("10 — rota protegida no mesmo backend e SQL montado no Docker", () => {
    const server = ler("backend/src/server.js");
    const compose = ler("compose.yaml");
    assert.match(server, /"\/api\/correcoes-imagens", exigirAdmin/);
    assert.match(compose, /18_correcao_imagens_ia.sql/);
    assert.match(compose, /galeria_produtos_cor.sql/);
});
