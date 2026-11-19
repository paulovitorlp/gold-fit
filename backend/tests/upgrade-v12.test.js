"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const raiz = path.resolve(__dirname, "../..");
const { planejarVariacoes, chaveCor, LIMITE_IMAGENS } = require("../src/services/planejar-variacoes");
const { criarPrompt, VERSAO_PROMPT } = require("../src/services/prompts-geracao");
const galeria = [
    { cor: "Preto", caminho_arquivo: "/midia/galeria/preto.png" },
    { cor: "Verde", caminho_arquivo: "/midia/galeria/verde.png" },
    { cor: "Lilás", caminho_arquivo: "/midia/galeria/lilas.png" }
];

test("mesma pose gera uma foto por cor mesmo se outro ângulo for enviado", () => {
    const tasks = planejarVariacoes({ cores: ["Verde", "Lilás"], angulos: ["frente", "costas"], modo: "mesma_pose", anguloBase: "frente", corBase: "Preto", galerias: galeria });
    assert.deepEqual(tasks.map(x => `${x.cor}/${x.angulo}`), ["Verde/frente", "Lilás/frente"]);
});
test("modo poses combina cores e ângulos", () => {
    const tasks = planejarVariacoes({ cores: ["Preto", "Verde"], angulos: ["frente", "lado", "superior"], modo: "poses", anguloBase: "frente", galerias: galeria });
    assert.equal(tasks.length, 6);
    assert.deepEqual(tasks.slice(0, 3).map(x => x.angulo), ["frente", "lado", "superior"]);
});
test("cores não são derivadas se não há fotografia real", () => {
    assert.throws(() => planejarVariacoes({ cores: ["Rosa"], angulos: ["frente"], modo: "poses", anguloBase: "frente", galerias: galeria }), /fotografia REAL/);
});
test("não repetir a cor da foto base e não duplicar cores", () => {
    assert.throws(() => planejarVariacoes({ cores: ["preto"], angulos: ["frente"], modo: "poses", anguloBase: "frente", corBase: "Preto", galerias: galeria }), /outras cores/);
    assert.throws(() => planejarVariacoes({ cores: ["Verde", "verde"], angulos: ["frente"], modo: "poses", anguloBase: "frente", galerias: galeria }), /repetidas/);
});
test("limite evita custos de 13 imagens sem querer", () => {
    assert.equal(LIMITE_IMAGENS, 12);
    assert.throws(() => planejarVariacoes({ cores: ["Preto", "Verde", "Lilás", "Azul"], angulos: ["frente", "lado", "costas", "superior"], modo: "poses", anguloBase: "frente", galerias: galeria }), /Limite/);
});
test("validação rejeita ângulos inválidos ou repetidos", () => {
    assert.throws(() => planejarVariacoes({ cores: ["Preto"], angulos: ["frente", "frente"], modo: "poses", anguloBase: "frente", galerias: galeria }), /ângulos/);
    assert.throws(() => planejarVariacoes({ cores: ["Preto"], angulos: ["diagonal"], modo: "poses", anguloBase: "frente", galerias: galeria }), /ângulos/);
});
test("normalização de cores tolera acentos e caixa", () => {
    assert.equal(chaveCor("LILÁS"), "lilas");
    assert.equal(chaveCor(" Rosa Bebê "), "rosa bebe");
});
test("prompt para mesma pose prioriza a foto REAL e ignora a roupa da foto-mãe", () => {
    assert.equal(VERSAO_PROMPT, "GF-ESTUDIO-V13");
    const s = criarPrompt({ nome: "Camila", angulo: "frente", referenciaAprovada: true, modoPose: "mesma_pose" });
    assert.match(s, /PRIMEIRA imagem é a foto REAL do PRODUTO/);
    assert.match(s, /IMAGEM-MÃE APROVADA/);
    assert.match(s, /NÃO acrescente linha|não acrescente costura central/);
    assert.match(s, /MANTER essa postura/);
});
test("prompt para poses novas exige pose diferente", () => {
    const s = criarPrompt({ nome: "Helena", angulo: "lado", referenciaAprovada: true, modoPose: "variavel" });
    assert.match(s, /Criar uma NOVA pose/);
    assert.match(s, /perfil lateral VERDADEIRO/);
});
test("rota e interface estão instaladas, sem alterar estoque", () => {
    const server = fs.readFileSync(path.join(raiz, "backend/src/server.js"), "utf8");
    const html = fs.readFileSync(path.join(raiz, "site/admin/gerador-imagens.html"), "utf8");
    const interfaceJs = fs.readFileSync(path.join(raiz, "site/js/gerador-imagens.js"), "utf8");
    const rota = fs.readFileSync(path.join(raiz, "backend/src/routes/variacoes-automaticas.js"), "utf8");
    assert.ok(server.includes('app.use("/api/variacoes-automaticas", exigirAdmin, variacoes)'));
    assert.ok(html.includes("variacoes-automaticas.js?v=12"));
    assert.ok(interfaceJs.includes("gf:variacoes:abrir"));
    assert.ok(rota.includes("status_revisao !== \"aprovada\""));
    assert.ok(rota.includes("fotoBuffer = await fs.readFile"));
    assert.ok(!rota.includes("UPDATE public.estoque"));
});
test("migração acrescenta novos lotes sem apagar tabelas antigas", () => {
    const sql = fs.readFileSync(path.join(raiz, "banco-de-dados/19_variacoes_automaticas_ia.sql"), "utf8");
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.lotes_variacoes_ia/);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS variacao_grupo_id/);
    assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});
