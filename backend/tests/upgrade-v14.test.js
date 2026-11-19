"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const gerar = require("../src/routes/geracao-imagens");
const { criarPrompt } = require("../src/services/prompts-geracao");
const { CAMPOS_REFS_PRODUTO, obterRefsProdutoAdicionais, ordenarRefsProdutoPorAngulo } = gerar.auxiliaresReferenciasV14;
const imagem = Buffer.from([137,80,78,71,13,10,26,10,1,2,3,4,5]);
const raiz = path.resolve(__dirname,"..","..");
const codigo = rel => fs.readFileSync(path.join(raiz,rel),"utf8");

test("campos permitem frente adicional, costas, lado e detalhes", () => {
    assert.deepEqual(CAMPOS_REFS_PRODUTO.map(x=>x.tipo), ["frente_adicional","costas","lado","detalhes"]);
});
test("validacao verifica o tipo real da imagem enviada", () => {
    const arquivos = { fotoCostas:[{buffer:imagem,size:imagem.length,mimetype:"image/png"}] };
    const resultado = obterRefsProdutoAdicionais(arquivos);
    assert.equal(resultado.length,1);
    assert.equal(resultado[0].tipo,"costas");
});
test("arquivos falsos nao sao aceitos", () => {
    assert.throws(()=>obterRefsProdutoAdicionais({fotoLado:[{buffer:Buffer.from("bad"),size:3,mimetype:"image/png"}]}),/invalida/i);
});
test("prioridade da fotografia das costas no angulo traseiro", () => {
    const itens=[{tipo:"frente_adicional"},{tipo:"detalhes"},{tipo:"costas"}];
    assert.equal(ordenarRefsProdutoPorAngulo(itens,"costas")[0].tipo,"costas");
});
test("prioridade lateral quando o angulo lateral e solicitado", () => {
    const itens=[{tipo:"frente_adicional"},{tipo:"lado"},{tipo:"costas"}];
    assert.equal(ordenarRefsProdutoPorAngulo(itens,"lado")[0].tipo,"lado");
});
test("prompt usa roupa real e nao confunde pessoas de referencias com a modelo", () => {
    const p=criarPrompt({nome:"Camila",angulo:"costas",referenciasProduto:["costas","detalhes"]});
    assert.match(p,/VISTAS ADICIONAIS DO PRODUTO/);
    assert.match(p,/Ignore rosto, corpo e pose/i);
});
test("interface inclui 4 entradas adicionais", () => {
    const html=codigo("site/admin/gerador-imagens.html");
    for(const campo of CAMPOS_REFS_PRODUTO) assert.match(html,new RegExp(`id="${campo.campo}"`));
});
test("login remove seletor de tipo e nao usa a sessao local como privilegio", () => {
    const html=codigo("site/login.html");
    const js=codigo("site/js/login.js");
    assert.doesNotMatch(html,/gf13ClienteLink|gf13AdminLink|gf13AdminArea/);
    assert.match(js,/\/api\/admin\/session/);
    assert.match(js,/\/api\/admin\/login/);
    assert.match(js,/perfil !== "cliente"/);
});
test("SQL 21 preserva lotes e fotos existentes",()=>{
    const sql=codigo("banco-de-dados/21_referencias_multiplas_produto_ia.sql");
    assert.match(sql,/CREATE TABLE IF NOT EXISTS/);
    assert.doesNotMatch(sql,/DROP TABLE|TRUNCATE|DELETE FROM/);
});

test("foto adicional com classificacao manual e aceita", () => {
    const arquivos={fotoCostas:[{buffer:imagem,size:imagem.length,mimetype:"image/png"}]};
    assert.equal(obterRefsProdutoAdicionais(arquivos,{origemFotoCostas:"vestida"})[0].origem,"vestida");
});
test("cores sem fotos publicadas ficam bloqueadas", () => {
    const js=codigo("site/js/produto.js");
    assert.match(js,/gf14-cor-sem-foto/);
    assert.match(js,/temFoto \? "" : "disabled"/);
});
test("loja permite usar foto de cor esgotada",()=>{
    const js=codigo("site/js/produto.js");
    assert.match(js,/const temFoto =/);
    assert.match(js,/gf11-cor-esgotada/);
});
test("capa antiga depende de confirmacao de cor do administrador",()=>{
    const js=codigo("site/js/galeria-produtos-admin.js");
    assert.match(js,/VINCULAR FOTO PRINCIPAL/);
    assert.match(js,/Confirmar: a foto principal realmente mostra/);
});
