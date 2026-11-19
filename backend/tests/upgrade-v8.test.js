"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const app = path.resolve(__dirname, "..", "..");
const read = x => fs.readFileSync(path.join(app, x), "utf8");
test("SQL preserva dados e limita galeria a quatro imagens por cor", () => {
    const sql = read("banco-de-dados/17_galeria_produtos_cor.sql");
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.galeria_produtos_cor/);
    assert.match(sql, /CHECK \(ordem BETWEEN 1 AND 4\)/);
    assert.match(sql, /UNIQUE\(chave_produto, cor, ordem\)/);
    assert.doesNotMatch(sql, /\bDROP TABLE\b/i);
});
test("API da galeria possui leitura, inclusão protegida e exclusão protegida", () => {
    const js = read("backend/src/routes/galeria-produtos.js");
    assert.match(js, /router\.get\("\/"/);
    assert.match(js, /router\.post\("\/fotos", admin/);
    assert.match(js, /router\.delete\("\/fotos\/:id", admin/);
    assert.match(js, /const ordem = \[1,2,3,4\]\.find/);
});
test("originais são salvos no volume de uploads, sem canvas", () => {
    const js = read("backend/src/routes/galeria-produtos.js");
    assert.match(js, /uploads", "galeria-loja"/);
    assert.match(js, /fs\.writeFile\(caminho, req\.file\.buffer/);
});
test("detalhe do produto seleciona somente fotos da cor ativa", () => {
    const js = read("site/js/produto.js");
    assert.match(js, /galeriaFotosCor\.get\(corSelecionada\)/);
    assert.match(js, /carregarGaleriaPorCor\(/);
    assert.match(js, /renderizarGaleria\(\);/);
});
test("interface mostra galerias por cor e não recorta a modelo", () => {
    const html = read("site/admin/produtos.html");
    const css = read("site/css/galeria-v8.css");
    assert.match(html, /id="gf8GaleriaUpload"/);
    assert.match(css, /object-fit: contain !important/);
    assert.match(css, /72vh/);
});
test("imagens aprovadas entram na galeria com a cor escolhida", () => {
    const js = read("backend/src/routes/geracoes-historico.js");
    const ui = read("site/js/gerador-imagens.js");
    assert.match(js, /INSERT INTO public\.galeria_produtos_cor/);
    assert.match(ui, /produto_chave: seletor\.value, cor: corProduto\.value/);
});
test("biblioteca da modelo distingue originais de referências aprovadas", () => {
    const js = read("backend/src/routes/modelos-virtuais.js");
    const ui = read("site/js/gerador-imagens.js");
    assert.match(js, /total_aprovadas/);
    assert.match(ui, /aprovadas como referência/);
});
