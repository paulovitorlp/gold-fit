"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {TIPOS,VERSAO_PROMPT_CORRECAO,instrucoesCorrecao}=require("../src/services/prompts-correcao");
const raiz=path.resolve(__dirname,"../..");
const texto=arquivo=>fs.readFileSync(path.join(raiz,arquivo),"utf8");
test("V13: versao e novas categorias",()=>{
    assert.equal(VERSAO_PROMPT_CORRECAO,"GF-CORRECAO-V13");
    for(const tipo of ["trocar_cor","aumentar_top","diminuir_top","aumentar_short","diminuir_short","ajustar_caimento"])
        assert.equal(typeof TIPOS[tipo],"string");
});
test("aumentar top corresponde a comprimento, nao corpo",()=>{
    const p=instrucoesCorrecao({tipo:"aumentar_top",descricao:"Alongar o cropped ate encontrar o cos."});
    assert.match(p,/AUMENTAR o comprimento vertical/);
    assert.match(p,/Nao alterar seios, quadris/);
});
test("diminuir short preserva a modelagem",()=>{
    const p=instrucoesCorrecao({tipo:"diminuir_short",descricao:"Encurtar as pernas do short."});
    assert.match(p,/DIMINUIR o comprimento/);
    assert.match(p,/Nao alterar seios, quadris/);
});
test("correcao por texto nao obriga mascara",()=>{
    const p=instrucoesCorrecao({tipo:"trocar_cor",descricao:"Trocar a cor somente do conjunto para verde oliva."});
    assert.match(p,/SEM MASCARA/);
    const rota=texto("backend/src/routes/correcoes-imagens.js");
    assert.match(rota,/if \(mascara\) form\.append\("mask"/);
    assert.match(rota,/const mascara = area \?/);
    assert.match(rota,/const png = area \?/);
});
test("correcao antiga por area ainda aceita mascara, apenas para compatibilidade",()=>{
    const p=instrucoesCorrecao({tipo:"costura",descricao:"Corrigir costura frontal.",comMascara:true});
    assert.match(p,/CORRECAO LOCALIZADA/);
});
test("o campo texto e categoria de cor aparecem na pagina",()=>{
    const html=texto("site/admin/gerador-imagens.html");
    for(const tipo of ["trocar_cor","aumentar_top","diminuir_top","aumentar_short","diminuir_short"])
        assert.ok(html.includes(`value="${tipo}"`));
    assert.doesNotMatch(html,/id="gf10AreaLayer"/);
    assert.ok(html.includes('id="gf9Descricao"'));
});
test("JS do navegador envia somente prompt e arquivos, sem area",()=>{
    const js=texto("site/js/correcoes-imagens.js");
    assert.match(js,/dados\.set\("instrucoes"/);
    assert.doesNotMatch(js,/dados\.set\("area"/);
    assert.doesNotMatch(js,/pointerdown/);
});
test("versoes sao salvas sem sobrescrever PNG anterior",()=>{
    const rota=texto("backend/src/routes/correcoes-imagens.js");
    assert.match(rota,/randomUUID\(\)/);
    assert.match(rota,/INSERT INTO public\.imagens_geradas_ia/);
    assert.match(rota,/status_revisao: "pendente"/);
});
test("login administrativo na mesma pagina da loja usa a API com cookie",()=>{
    const html=texto("site/login.html"),js=texto("site/js/login.js"),server=texto("backend/src/server.js");
    assert.ok(html.includes('id="gf13AdminForm"'));
    assert.match(js,/"\/api\/admin\/login"/);
    assert.match(js,/credentials:"same-origin"/);
    assert.match(server,/redirect\("\/login\.html\?modo=admin"\)/);
    assert.match(server,/req\.session\?\.admin === true/);
});
test("migracao 20 somente amplia categorias e preserva fotos",()=>{
    const sql=texto("banco-de-dados/20_categorias_correcao_v13.sql");
    assert.match(sql,/ADD CONSTRAINT ck_correcao_tipo_v13/);
    assert.doesNotMatch(sql,/DROP TABLE|TRUNCATE|DELETE FROM/);
});
test("API de correção permanece protegida",()=>{
    const server=texto("backend/src/server.js");
    assert.match(server,/"\/api\/correcoes-imagens", exigirAdmin/);
});

// Regra de fidelidade da roupa parcialmente oculta, sem inventar o verso.
test("geracao costas preserva oclusao de bracos e todos os filetes brancos visiveis",()=>{
    const {criarPrompt,VERSAO_PROMPT}=require("../src/services/prompts-geracao");
    assert.equal(VERSAO_PROMPT,"GF-ESTUDIO-V13");
    const p=criarPrompt({nome:"Camila",angulo:"costas",variacao:2});
    assert.match(p,/REGRA DE OCLUSÃO/);
    assert.match(p,/CONSERVAÇÃO DA POSE NAS COSTAS/);
    assert.match(p,/NÃO mova braço ou cabelo/);
    assert.match(p,/CONTORNOS E LINHAS BRANCAS/);
    assert.match(p,/filetes longitudinais/);
    assert.match(p,/IGNORADA/);
});
test("geracao cores e poses nao revela detalhes ocultos de outra cor",()=>{
    const {criarPrompt}=require("../src/services/prompts-geracao");
    const p=criarPrompt({nome:"Camila",angulo:"costas",modoPose:"mesma_pose",referenciaAprovada:true});
    assert.match(p,/POSE DA IMAGEM-MÃE/);
    assert.match(p,/prevalece a visibilidade da roupa real/);
    assert.match(p,/NÃO inventar continuação em regiões ocultas/);
});
test("correcao por texto preserva a pose e filetes brancos comprovados",()=>{
    const p=instrucoesCorrecao({tipo:"costura",descricao:"Preservar as linhas brancas do top e da legging na vista de costas.",angulo:"costas"});
    assert.match(p,/POSE COM DETALHES OCULTOS/);
    assert.match(p,/CONTORNOS E FILETES BRANCOS/);
    assert.match(p,/sem mascara/i);
});
