"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const raiz = path.resolve(__dirname,"../..");
const cores = require(path.join(raiz,"site/js/variacoes-galeria-v11.js"));

test("fotografias por cor, sem misturar preto e verde", () => {
    const fotos = [
        {cor:"Preto",ordem:1,url:"preto.png"},
        {cor:"Verde",ordem:3,url:"verde3.png"},
        {cor:"Verde",ordem:1,url:"verde1.png"},
        {cor:"Verde",ordem:2,url:"verde2.png"},
        {cor:"Verde",ordem:4,url:"verde4.png"}
    ];
    assert.deepEqual(cores.fotosDaCor(fotos," verde ").map(x=>x.url),["verde1.png","verde2.png","verde3.png","verde4.png"]);
    assert.deepEqual(cores.fotosDaCor(fotos,"Preto").map(x=>x.url),["preto.png"]);
    assert.deepEqual(cores.fotosDaCor(fotos,"Rosa"),[]);
});

test("cor pode ser exibida mesmo com estoque zero", () => {
    const variacoes=[{cor:"Preto",tamanho:"P",quantidade:2},{cor:"Verde",tamanho:"P",quantidade:0}];
    const fotos=[{cor:"Verde",ordem:1,url:"verde.png"},{cor:"Rosa bebé",ordem:1,url:"rosa.png"}];
    assert.deepEqual(cores.coresParaExibir(["Preto","Verde"],variacoes,fotos),["Preto","Verde","Rosa bebé"]);
    assert.equal(cores.quantidadeCor(variacoes,"verde"),0);
    assert.equal(cores.quantidadeCor(variacoes,"preto"),2);
    assert.equal(cores.variacao(variacoes,"Verde","P").quantidade,0);
    assert.equal(cores.variacao(variacoes,"Rosa bebé","P"),null);
});

test("normalização de cor ignora acentos e caixa", () => {
    assert.equal(cores.mesmaCor("Rosa Bebê", "rosa bebe"),true);
    assert.equal(cores.mesmaCor("Preto", "Verde"),false);
});

test("tela serve a biblioteca de cor antes do código do produto", () => {
    const html=fs.readFileSync(path.join(raiz,"site/produto.html"),"utf8");
    assert.ok(html.includes("variacoes-galeria-v11.js?v=11"));
    assert.ok(html.indexOf("variacoes-galeria-v11.js?v=11") < html.indexOf("produto.js?v=11"));
    assert.ok(html.includes('id="avisoFotosCor"'));
});

test("site separa fotos da cor da disponibilidade no banco", () => {
    const js=fs.readFileSync(path.join(raiz,"site/js/produto.js"),"utf8");
    assert.ok(js.includes("/api/loja/estado"));
    assert.ok(js.includes("/api/galeria-produtos"));
    assert.ok(js.includes("coresV11.fotosDaCor"));
    assert.ok(js.includes("bancoEstoqueConfirmado"));
});

test("admin permite cadastrar cor mesmo sem variação no estoque", () => {
    const html=fs.readFileSync(path.join(raiz,"site/admin/produtos.html"),"utf8");
    const js=fs.readFileSync(path.join(raiz,"site/js/galeria-produtos-admin.js"),"utf8");
    assert.ok(html.includes("gf11AdicionarCor"));
    assert.ok(js.includes("adicionarNovaCor"));
    assert.ok(js.includes("...coresFotos"));
});

"use strict";
const vm = require("node:vm");

const helpers = cores;
function criarContexto(){
 const codigo=fs.readFileSync(path.join(raiz,'site/js/produto.js'),'utf8').replace('iniciarProduto();','// iniciarProduto() omitido neste teste de funções isoladas');
 const window={GoldFitGaleriaV11:helpers,location:{search:'?produto=Top%7CALO&cor=Verde',href:'http://127.0.0.1/produto.html?produto=Top%7CALO'},history:{replaceState(){}}};
 const ctx={window,document:{},URLSearchParams,URL,console,localStorage:{getItem(){return null},setItem(){}},
  goldFitCarregarEstoque(){return []},goldFitCarregarProdutosSite(){return []},
  goldFitPlaceholder(){return 'placeholder.svg'}, goldFitOpcoesProduto(){return {cores:['Preto','Verde'],tamanhos:['P','M']}},goldFitEscapeHtml:x=>x};
 vm.createContext(ctx); vm.runInContext(codigo,ctx); return ctx;
}
test('produto real: Verde mostra apenas verdes, Preto apenas preto',()=>{
 const c=criarContexto();
 vm.runInContext(`produto={chave:'Top|ALO',produto:'Top',marca:'ALO',variacoes:[{cor:'Preto',tamanho:'P',quantidade:3,foto:'capa-preta.jpg'},{cor:'Verde',tamanho:'P',quantidade:0,foto:'capa-preta.jpg'}]}; fotosGaleria=[{cor:'Verde',ordem:2,url:'verde2'},{cor:'Preto',ordem:1,url:'preto1'},{cor:'Verde',ordem:1,url:'verde1'}]; corSelecionada='Verde'`,c);
 assert.deepEqual(Array.from(vm.runInContext('obterFotosProduto()',c)),['verde1','verde2']);
 vm.runInContext('corSelecionada="Preto"',c);
 assert.deepEqual(Array.from(vm.runInContext('obterFotosProduto()',c)),['preto1']);
});
test('produto real: sem foto da cor Verde nao mostra capa Preta',()=>{
 const c=criarContexto();
 vm.runInContext(`produto={chave:'Top|ALO',produto:'Top',marca:'ALO',variacoes:[{cor:'Preto',tamanho:'P',quantidade:3,foto:'preto.jpg'},{cor:'Verde',tamanho:'P',quantidade:0,foto:'preto.jpg'}]}; fotosGaleria=[]; corSelecionada='Verde'`,c);
 assert.deepEqual(Array.from(vm.runInContext('obterFotosProduto()',c)),['placeholder.svg']);
 vm.runInContext('corSelecionada="Preto"',c);
 assert.deepEqual(Array.from(vm.runInContext('obterFotosProduto()',c)),['preto.jpg']);
});
