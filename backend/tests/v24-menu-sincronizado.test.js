"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const raiz = path.resolve(__dirname,"../..");
const ler = nome => fs.readFileSync(path.join(raiz, nome), "utf8");
const configs = [
 {chave:"Tênis ON|ON",produto:"Tênis ON",marca:"ON",grupo:"Calçados",categoria:"Tênis",publicado:true,ordem:20},
 {chave:"Meia Nike|Nike",produto:"Meia Nike",marca:"Nike",grupo:"Acessórios",categoria:"Meias",publicado:true,ordem:30},
 {chave:"Cropped ALO|ALO",produto:"Cropped ALO",marca:"ALO",grupo:"Feminino",categoria:"Croppeds",publicado:true,ordem:10},
 {chave:"Tênis Oculto|Nike",produto:"Tênis Oculto",marca:"Nike",grupo:"Calçados",categoria:"Tênis",publicado:false,ordem:40}
];
const resultado = {produtos:configs, estoque:[{produto:"Cropped ALO",marca:"ALO",cor:"Amarelo",quantidade:1,sku:"CRO-ALO-AMA",foto:"/midia/amarelo.jpg"}]};
function montarContexto() {
 const codigo=ler("site/js/store-common.js");
 const inicio=codigo.indexOf("function goldFitAgruparModelosVitrine(");
 const fim=codigo.indexOf("function goldFitSalvarEstoque(",inicio);
 const chamados=[];
 const contexto={
    goldFitChaveProduto:(p,m)=>`${p}|${m}`,
    goldFitCarregarEstoque:()=>[],
    goldFitCarregarProdutosSite:()=>[],
    fetch:(url,opts)=>{
      chamados.push([url,opts]);
      return Promise.resolve({ok:true,json:()=>Promise.resolve(resultado)});
    }
 };
 vm.createContext(contexto);
 vm.runInContext(codigo.slice(inicio,fim),contexto);
 return {contexto,chamados};
}
test("a API pública alimenta os menus com produtos publicados mesmo sem foto",async()=>{
 const {contexto,chamados}=montarContexto();
 const itens=await contexto.goldFitConsultarModelosPublicados();
 assert.deepEqual(Array.from(itens, i=>i.produto),["Cropped ALO","Tênis ON","Meia Nike"]);
 assert.equal(itens.find(x=>x.produto==="Tênis ON").variacoes.length,0);
 assert.equal(itens.find(x=>x.produto==="Meia Nike").variacoes.length,0);
 assert.equal(itens.find(x=>x.produto==="Cropped ALO").variacoes.length,1);
 assert.equal(chamados[0][0],"/api/loja/estado?visao=publica");
 assert.equal(chamados[0][1].cache,"no-store");
});
test("menu de produto mostra Calçados e Acessórios mesmo com estoque local vazio",async()=>{
 const {contexto}=montarContexto();
 const painels={};
 const grupos=["Feminino","Calçados","Acessórios"];
 for (const g of grupos) painels[g]={innerHTML:""};
 const nav={
  querySelector: seletor => {
    const encontrada=/^\[data-menu-panel="(.+)"\]$/.exec(seletor);
    return encontrada? painels[encontrada[1]]: null;
  },
  querySelectorAll:()=>[],contains:()=>false, classList:{remove(){},toggle(){return false}}
 };
 const botao={addEventListener(){},setAttribute() {},contains:()=>false};
 const document={
  getElementById:id=>id==="mainNavProduto"?nav:id==="btnMenuProduto"?botao:null,
  addEventListener() {},activeElement:{blur(){}}
 };
 const window={innerWidth:1000, addEventListener(){}, location:{href:""}};
 Object.assign(contexto,{document,window,URLSearchParams,goldFitEscapeHtml:s=>String(s)});
 vm.runInContext(ler("site/js/menu-produto.js"),contexto);
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(painels["Calçados"].innerHTML,/Tênis ON/);
 assert.match(painels["Acessórios"].innerHTML,/Meia Nike/);
 assert.match(painels.Feminino.innerHTML,/Cropped ALO/);
 assert.doesNotMatch(painels["Calçados"].innerHTML,/Tênis Oculto/);
 assert.doesNotMatch(painels["Calçados"].innerHTML,/Nenhum produto disponível/);
});
test("Home e Catálogo consultam a mesma lista pública do banco",()=>{
 for(const arquivo of ["site/js/loja.js","site/js/catalogo.js"]){
   const codigo=ler(arquivo);
   assert.match(codigo,/goldFitConsultarModelosPublicados\(\)\.then\(renderizar\)/);
   assert.match(codigo,/function criarConteudoMenu\(grupo, modelos = goldFitAgruparModelosVitrine\(estoque\)\)/);
   assert.match(codigo,/goldFitGrupoMenu\(item.grupo\) === grupo/);
 }
 const detalhe=ler("site/js/produto.js");
 assert.match(detalhe,/configuracoesBanco = dados.produtos/);
 assert.match(detalhe,/Array\.isArray\(configuracoesBanco\) \? configuracoesBanco : goldFitCarregarProdutosSite\(\)/);
 assert.match(detalhe,/\.filter\(cor => coresV11\.fotosDaCor\(fotosGaleria, cor\)\.length > 0\)/);
});
