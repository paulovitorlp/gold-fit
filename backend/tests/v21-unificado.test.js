"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { mutacaoEstoque } = require("../src/routes/variacao-utils");
const { mesclarProdutosEstoque, filtrarEstadoPublico } = require("../src/routes/loja-utils");
const base = () => ([
    { id: 1, produto: "Cropped ALO", marca: "ALO", grupo:"Feminino", categoria: "Croppeds", cor:"Amarelo", tamanho:"Único", sku:"CRO-ALO-AMARELO", quantidade:1, foto:"ama" },
    { id: 2, produto: "Cropped ALO", marca: "ALO", grupo:"Feminino", categoria: "Croppeds", cor:"Bege", tamanho:"Único", sku:"CRO-ALO-BEGE", quantidade:1, foto:"bege" }
]);
const novo = { ...base()[0], id:undefined, cor:"Preto", sku:"CRO-ALO-PRETO", quantidade:2 };
test("Cadastro de outra cor mantém os SKUs antigos e só um modelo", () => {
    const res = mutacaoEstoque(base(), {acao:"salvar",variacao:novo});
    assert.equal(res.estoque.length, 3);
    assert.deepEqual(res.estoque.map(x=>x.cor), ["Amarelo","Bege","Preto"]);
    assert.equal(mesclarProdutosEstoque([],res.estoque).produtos.length, 1);
});
test("Não permite mesmo modelo/cor/tamanho duas vezes, mesmo com SKU diferente", () => {
    assert.throws(() => mutacaoEstoque(base(), {acao:"salvar",variacao:{...novo,cor:"bÉge"}}), /já existe uma variação/i);
});
test("Não permite SKU duplicado", () => {
    assert.throws(() => mutacaoEstoque(base(),{acao:"salvar",variacao:{...novo,sku:"cro-alo-bege"}}), /SKU já existe/i);
});
test("Alterar Amarelo nunca altera foto ou quantidade de Bege", () => {
    const res = mutacaoEstoque(base(), {acao:"salvar",id:1,variacao:{...base()[0],quantidade:4}});
    assert.equal(res.estoque[0].quantidade, 4);
    assert.deepEqual(res.estoque[1],base()[1]);
});
test("Atualização e exclusão são individuais por ID", () => {
    const qtd = mutacaoEstoque(base(),{acao:"quantidade",id:1,quantidade:5});
    assert.equal(qtd.estoque[0].quantidade,5);
    assert.equal(qtd.estoque[1].quantidade,1);
    const excluida = mutacaoEstoque(qtd.estoque,{acao:"excluir",id:1});
    assert.deepEqual(excluida.estoque.map(x=>x.cor),["Bege"]);
});
test("Publicação desativada esconde modelo mesmo que tenha estoque", () => {
    const produtos=mesclarProdutosEstoque([],base()).produtos;
    produtos[0].publicado=false;
    assert.equal(filtrarEstadoPublico({estoque:base(),produtos}).estoque.length,0);
});
test("Tela unificada mantém estoque e publicação com cor de capa, galeria continua separada", () => {
    const raiz=path.resolve(__dirname,"../..");
    const html=fs.readFileSync(path.join(raiz,"site/admin/produtos.html"),"utf8");
    const loja=fs.readFileSync(path.join(raiz,"backend/src/routes/loja.js"),"utf8");
    assert.match(html,/gf21Novo/);
    assert.match(html,/gf21CorCapa/);
    assert.match(loja,/router\.post\("\/variacao"/);
    assert.match(loja,/router\.post\("\/modelo"/);
    assert.match(loja,/pg_advisory_xact_lock/);
});
