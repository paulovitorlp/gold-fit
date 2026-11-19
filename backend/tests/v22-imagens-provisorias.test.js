"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { aplicarGaleriaPublica } = require("../src/routes/vitrine-utils");
const raiz = path.resolve(__dirname, "../..");
const src = nome => fs.readFileSync(path.join(raiz, nome), "utf8");
const modelos = [
 {chave:"Meia Nike|Nike", produto:"Meia Nike",marca:"Nike",grupo:"Acessórios",categoria:"Meias",preco:40, publicado:true,destaque:true,ordem:10, fotoPrincipal:"velha"},
 {chave:"Tênis ON|ON", produto:"Tênis ON",marca:"ON",grupo:"Calçados",categoria:"Tênis",preco:250, publicado:true,destaque:true,ordem:20, fotoPrincipal:"velha"},
 {chave:"Cropped ALO|ALO", produto:"Cropped ALO",marca:"ALO",grupo:"Feminino",categoria:"Croppeds",preco:65, publicado:true,destaque:true,ordem:30, fotoPrincipal:"velha"},
 {chave:"Tênis Oculto|Nike",produto:"Tênis Oculto",marca:"Nike",grupo:"Calçados",categoria:"Tênis", publicado:false,destaque:true,ordem:40}
];
const estoque = [
 {produto:"Meia Nike",marca:"Nike",cor:"Branco",tamanho:"Único",quantidade:3,sku:"ME-NI-BR",foto:"foto-estoque"},
 {produto:"Tênis ON",marca:"ON",cor:"Preto",tamanho:"40",quantidade:2,sku:"TE-ON-PR",foto:"foto-estoque"},
 {produto:"Cropped ALO",marca:"ALO",cor:"Amarelo",tamanho:"Único",quantidade:1,sku:"CR-AMA",foto:"foto-ama"},
 {produto:"Cropped ALO",marca:"ALO",cor:"Bege",tamanho:"Único",quantidade:1,sku:"CR-BEI",foto:"foto-bege"},
 {produto:"Tênis Oculto",marca:"Nike",cor:"Preto",tamanho:"42",quantidade:1,sku:"OC-42"}
];
const foto = { chave_produto:"Cropped ALO|ALO",cor:"Amarelo",ordem:1,caminho_arquivo:"/midia/cropped-amarelo.jpg",tipo_foto:"modelo" };
test("Meias e tênis publicados permanecem como cards mesmo sem foto", () => {
 const resposta = aplicarGaleriaPublica({produtos:modelos,estoque},[foto]);
 assert.deepEqual(resposta.produtos.map(x => x.produto),["Meia Nike","Tênis ON","Cropped ALO"]);
 assert.deepEqual(resposta.estoque.map(x => x.sku), ["CR-AMA"]);
 assert.ok(resposta.produtos.every(x=>x.fotoPrincipal === ""));
});
test("Não expõe cores sem foto de modelo nem modelos despublicados", () => {
 const resposta = aplicarGaleriaPublica({produtos:modelos,estoque},[{...foto, tipo_foto:"produto"}]);
 assert.equal(resposta.estoque.length,0);
 assert.equal(resposta.produtos.length,3);
 assert.equal(resposta.produtos.some(x=>x.chave === "Tênis Oculto|Nike"),false);
});
test("Agrupador compartilha catálogo e home sem criar variantes artificiais", () => {
 const codigo = src("site/js/store-common.js");
 const inicio = codigo.indexOf("function goldFitAgruparModelosVitrine(");
 const fim = codigo.indexOf("function goldFitSalvarEstoque(",inicio);
 assert.ok(inicio>0 && fim>inicio);
 const contexto = {goldFitChaveProduto:(p,m)=>`${p}|${m}`};
 vm.createContext(contexto);
 vm.runInContext(codigo.slice(inicio,fim),contexto);
 const agrupar = contexto.goldFitAgruparModelosVitrine;
 const grupos = agrupar([{
  produto:"Cropped ALO",marca:"ALO",cor:"Amarelo",quantidade:1,sku:"CR-AMA"
 }],modelos);
 assert.equal(grupos.length,3);
 assert.equal(grupos.find(x=>x.produto==="Meia Nike").variacoes.length,0);
 assert.equal(grupos.find(x=>x.produto==="Cropped ALO").variacoes.length,1);
 assert.ok(!grupos.some(x=>x.produto==="Tênis Oculto"));
});
test("Site identifica prévias e bloqueia compra sem cores fotografadas", () => {
 const home = src("site/js/loja.js");
 const catalogo = src("site/js/catalogo.js");
 const detalhe = src("site/js/produto.js");
 assert.match(home,/FOTO EM BREVE/);
 assert.match(catalogo,/FOTO EM BREVE/);
 assert.match(home,/goldFitAgruparModelosVitrine/);
 assert.match(catalogo,/goldFitAgruparModelosVitrine/);
 assert.match(detalhe,/\.filter\(cor => coresV11\.fotosDaCor\(fotosGaleria, cor\)\.length > 0\)/);
 assert.match(detalhe,/!corSelecionada[\s\S]{0,200}Aguardando fotos/);
 assert.match(detalhe,/document\.getElementById\("btnAdicionar"\)\.disabled/);
});
