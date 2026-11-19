"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { mesclarProdutosEstoque, filtrarEstadoPublico } = require("../src/routes/loja-utils");

const variacao = (produto, cor, extra = {}) => ({produto, marca:"ALO", grupo:"Feminino", categoria:"Croppeds", cor, tamanho:"Unico", sku:`${produto}-${cor}`, quantidade:2, ...extra});

test("produto novo ganha uma configuracao publica no mesmo salvamento de estoque", () => {
    const base = [{chave:"Cropped ALO|ALO", produto:"Cropped ALO", marca:"ALO", publicado:true, ordem:10}];
    const {produtos,novos}= mesclarProdutosEstoque(base,[variacao("Cropped ALO","Bege"),variacao("Jaqueta Nova","Preto")]);
    assert.equal(novos,1);
    assert.equal(produtos.length,2);
    assert.equal(produtos[1].chave,"Jaqueta Nova|ALO");
    assert.equal(produtos[1].publicado,true);
    assert.equal(produtos[1].lancamento,true);
    assert.equal(produtos[1].destaque,false);
    assert.deepEqual(base,[{chave:"Cropped ALO|ALO",produto:"Cropped ALO",marca:"ALO",publicado:true,ordem:10}]);
});

test("novas cores nao duplicam o produto no catalogo", () => {
    const fotos = [variacao("Cropped ALO","Amarelo"),variacao("Cropped ALO","Preto"),variacao("Cropped ALO","Bege")];
    assert.equal(mesclarProdutosEstoque([],fotos).produtos.length,1);
    assert.equal(mesclarProdutosEstoque([],fotos).novos,1);
});

test("configuracao despublicada e preservada e bloqueada da loja", () => {
    const config = [{chave:"Modelo Oculto|ALO",produto:"Modelo Oculto",marca:"ALO",publicado:false,ordem:20}];
    const estoque = [variacao("Modelo Oculto","Preto"),variacao("Modelo Novo","Azul")];
    const merge = mesclarProdutosEstoque(config, estoque);
    assert.equal(merge.produtos[0].publicado,false);
    const publico=filtrarEstadoPublico({estoque,produtos:merge.produtos});
    assert.equal(publico.estoque.length,1);
    assert.equal(publico.estoque[0].produto,"Modelo Novo");
    assert.equal(publico.produtos.length,1);
});

test("clientes legados: estoque novo sem configuracao nao e apagado do GET", () => {
    const publico=filtrarEstadoPublico({
        estoque:[variacao("Cropped ALO","Preto"),variacao("Modelo Novo","Verde")],
        produtos:[{chave:"Cropped ALO|ALO",grupo:"Feminino",publicado:true}]
    });
    assert.equal(publico.estoque.length,2);
});

test("modelos do grupo Masculino seguem ocultos, como na versao original", () => {
    const publico = filtrarEstadoPublico({
        estoque:[variacao("Camiseta", "Preto", {grupo:"Masculino"}),variacao("Jaqueta", "Preto")],
        produtos:null
    });
    assert.equal(publico.estoque.length,1);
});
