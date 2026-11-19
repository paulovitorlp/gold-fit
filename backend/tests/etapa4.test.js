"use strict";

/* Testes sem chamadas pagas a API e sem conexao com banco de dados. */
const test = require("node:test");
const assert = require("node:assert/strict");
const { ANGULOS, VERSAO_PROMPT, criarPrompt } = require("../src/services/prompts-geracao");
const { criarZip } = require("../src/services/zip");

test("quatro angulos definidos e versao identificavel", () => {
    assert.deepEqual(ANGULOS, ["frente", "costas", "lado", "superior"]);
    assert.equal(VERSAO_PROMPT, "GF-ESTUDIO-V13");
});

test("todas as vistas usam produto real, identidade e tenis", () => {
    for (const angulo of ANGULOS) {
        const prompt = criarPrompt({ nome: "Helena", angulo, calcado: "tenis branco" });
        assert.match(prompt, /PRIMEIRA imagem/i);
        assert.match(prompt, /PRODUTO/i);
        assert.match(prompt, /Helena/);
        assert.match(prompt, /t[eê]nis esportivos brancos/i);
        assert.match(prompt, /NUNCA descal[cç]a/i);
    }
});

test("frente nao perde logos brancos", () => {
    const prompt = criarPrompt({ nome: "Helena", angulo: "frente" });
    assert.match(prompt, /BRANCO SOBRE BRANCO/);
    assert.match(prompt, /frontal/i);
});

test("costas nao transfere o logo frontal", () => {
    const prompt = criarPrompt({ nome: "Beatriz", angulo: "costas" });
    assert.match(prompt, /NÃO se transfere automaticamente/);
    assert.match(prompt, /ESTIMATIVA VISUAL/);
});

test("lado e superior possuem instrucoes distintas", () => {
    assert.match(criarPrompt({ nome: "Rafaela", angulo: "lado" }), /perfil lateral VERDADEIRO/);
    assert.match(criarPrompt({ nome: "Rafaela", angulo: "superior" }), /parte superior/i);
});

test("observacoes adicionais e identidade sao limitadas", () => {
    const prompt = criarPrompt({ nome: "Camila", angulo: "frente", detalhes: "short duplo", identidade: "cabelo ondulado" });
    assert.match(prompt, /short duplo/);
    assert.match(prompt, /cabelo ondulado/);
    assert.throws(() => criarPrompt({ nome: "Camila", angulo: "diagonal" }), /invalido/);
});

test("não reproduz modelagem antiga e trata frente lisa", () => {
    const prompt = criarPrompt({ nome: "Helena", angulo: "frente" });
    assert.match(prompt, /costura central frontal/i);
    assert.match(prompt, /frente lisa/i);
    assert.match(prompt, /Não transfira a modelagem frontal/i);
});

test("pose varia por geracao sem alterar o angulo", () => {
    const p1 = criarPrompt({ nome: "Helena", angulo: "frente", variacao: 0 });
    const p2 = criarPrompt({ nome: "Helena", angulo: "frente", variacao: 1 });
    assert.notEqual(p1, p2);
    assert.match(p1, /Variação de pose/i);
});

test("foto aprovada funciona somente como referencia de pose", () => {
    const p = criarPrompt({ nome: "Helena", angulo: "lado", referenciaAprovada: true });
    assert.match(p, /EXCLUSIVAMENTE como inspiração de postura/i);
    assert.match(p, /IGNORE totalmente a roupa/i);
});

test("compactador gera cabecalho ZIP valido", () => {
    const zip = criarZip([{ nome: "frente.png", dados: Buffer.from("imagem-de-teste") }]);
    assert.equal(zip.readUInt32LE(0), 0x04034B50);
    assert.equal(zip.readUInt32LE(zip.length - 22), 0x06054B50);
});
