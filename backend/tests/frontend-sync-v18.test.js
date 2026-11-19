"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function contexto(fetch) {
    const dados = new Map();
    const localStorage = {
        getItem: key => dados.has(key) ? dados.get(key) : null,
        setItem: (key, val) => dados.set(key, String(val)),
        removeItem: key => dados.delete(key)
    };
    const paginas = { reloads: 0 };
    const window = { location: {protocol: "http:", pathname: "/catalogo.html", reload() { paginas.reloads++; }}, addEventListener() {} };
    const sandbox = {window, document: {addEventListener() {}}, localStorage,
        sessionStorage: {getItem() {return null;},setItem() {}}, fetch, console,
        alert() { throw new Error("Nao deveria exibir aviso no catalogo"); },
        setTimeout, clearTimeout};
    vm.createContext(sandbox);
    const source = fs.readFileSync(path.resolve(__dirname, "../../site/js/store-common.js"), "utf8");
    vm.runInContext(source, sandbox);
    return {sandbox,localStorage,paginas};
}

test("o catalogo usa a lista atualizada pelo banco, sem reinserir dados demonstrativos", async () => {
    const estoque=[{id:345,produto:"Novo Produto",marca:"ALO",sku:"NOVO-01",grupo:"Feminino",cor:"Preto",tamanho:"P",quantidade:2}];
    const produtos=[{chave:"Novo Produto|ALO",produto:"Novo Produto",marca:"ALO",grupo:"Feminino",publicado:true}];
    const {sandbox, paginas} = contexto(async () => ({ok:true,json:async()=>({status:"ok",estoque,produtos})}));
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(paginas.reloads,1);
    const carregado = vm.runInContext("goldFitCarregarEstoqueBase()",sandbox);
    assert.equal(carregado.length,1);
    assert.equal(carregado[0].sku,"NOVO-01");
});

test("o salvamento nao confirma se a API respondeu sem permissao", async () => {
    const {sandbox} = contexto(async (url) => url === "/api/loja/estado"
        ? {ok:true,json:async()=>({status:"ok",estoque:null,produtos:null})}
        : {ok:false,status:401,json:async()=>({status:"erro",mensagem:"Sessao expirada"})});
    await assert.rejects(sandbox.window.goldFitSincronizarPro("estoque", [{sku:"NOVO-01"}]), /Sessao expirada/);
});
