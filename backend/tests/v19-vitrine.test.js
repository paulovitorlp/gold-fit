"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { aplicarGaleriaPublica, fotosAprovadasPorCor } = require("../src/routes/vitrine-utils");
const raiz = path.resolve(__dirname, "../..");
const codigo = arquivo => fs.readFileSync(path.join(raiz, arquivo), "utf8");
const estado = () => ({
    produtos:[{ chave:"Cropped ALO|ALO", produto:"Cropped ALO", marca:"ALO", publicado:true, fotoPrincipal:"foto-antiga" }],
    estoque:[
        { id:1, produto:"Cropped ALO",marca:"ALO",cor:"Amarelo",tamanho:"Único",sku:"CR-AMA",quantidade:1,foto:"estoque-ama" },
        { id:2, produto:"Cropped ALO",marca:"ALO",cor:"Bege",tamanho:"Único",sku:"CR-BEI",quantidade:1,foto:"estoque-bege" },
        { id:3, produto:"Cropped ALO",marca:"ALO",cor:"Preto",tamanho:"Único",sku:"CR-PRE",quantidade:2,foto:"estoque-pre" }
    ]
});
const foto = (cor, tipo="modelo", ordem=1, url=`/midia/${cor}`) => ({chave_produto:"Cropped ALO|ALO", cor, tipo_foto:tipo, ordem, caminho_arquivo:url});
test("Cor em estoque sem foto de modelo nao entra no site", () => {
    const atual = aplicarGaleriaPublica(estado(),[foto("Amarelo")]);
    assert.deepEqual(atual.estoque.map(x=>x.cor),["Amarelo"]);
    assert.equal(atual.produtos.length,1);
    assert.equal(atual.estoque[0].foto,"/midia/Amarelo");
    assert.equal(atual.produtos[0].fotoPrincipal,"");
});
test("Foto da peca sem modelo nao libera a cor Bege", () => {
    const atual = aplicarGaleriaPublica(estado(),[foto("Bege","produto")]);
    assert.equal(atual.estoque.length,0);
    // O modelo publicado fica na vitrine como prévia, mas não libera cores.
    assert.equal(atual.produtos.length,1);
    assert.equal(atual.produtos[0].fotoPrincipal, "");
});
test("Foto de modelo vestindo Bege libera apenas Bege", () => {
    const atual = aplicarGaleriaPublica(estado(),[foto("BEGE", "modelo")]);
    assert.deepEqual(atual.estoque.map(x=>x.sku),["CR-BEI"]);
});
test("Produto despublicado fica invisivel mesmo com foto", () => {
    const e = estado();e.produtos[0].publicado=false;
    const atual = aplicarGaleriaPublica(e,[foto("Bege")]);
    assert.equal(atual.produtos.length,0);
    assert.equal(atual.estoque.length,0);
});
test("Capa usa a foto 1 da cor e nao outra cor ou foto antiga", () => {
    const fotos=[foto("Bege","modelo",2,"foto2"), foto("Bege","modelo",1,"foto1"), foto("Preto","produto",1,"nao")];
    const mapa=fotosAprovadasPorCor(fotos);
    assert.equal(mapa.get("Cropped ALO|ALO").get("bege").url,"foto1");
    assert.equal(mapa.get("Cropped ALO|ALO").get("preto"),undefined);
});
test("Migracao V19 nao exclui dados ou indices e permite execucao repetida", () => {
    const sql=codigo("banco-de-dados/22_fotos_modelo_vitrine.sql");
    assert.match(sql,/ADD COLUMN IF NOT EXISTS tipo_foto/);
    assert.doesNotMatch(sql,/\bDROP\s+(TABLE|INDEX)|\bTRUNCATE|\bDELETE\s+FROM/i);
});
test("Site oculta cores sem foto; painel mostra agrupamento de variacoes", () => {
    const detalhe=codigo("site/js/produto.js");
    const painel=codigo("site/js/produtos-admin.js");
    assert.match(detalhe,/\.filter\(cor => coresV11\.fotosDaCor\(fotosGaleria, cor\)\.length > 0\)/);
    assert.match(painel,/gf19RenderizarVariacoes/);
    assert.match(painel,/api\/loja\/variacao/);
});
