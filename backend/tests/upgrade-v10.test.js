"use strict";
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {lerPNG,salvarPNG,normalizarArea,mascaraPNG,composicaoLocalizada}=require('../src/services/edicao-localizada');
const {VERSAO_PROMPT_CORRECAO,instrucoesCorrecao}=require('../src/services/prompts-correcao');
const raiz=path.resolve(__dirname,'..','..');
function ler(p){return fs.readFileSync(path.join(raiz,p),'utf8')}
function imagem(w=120,h=180,valor=180){const pixels=Buffer.alloc(w*h*4);for(let i=0;i<pixels.length;i+=4){pixels[i]=valor;pixels[i+1]=valor;pixels[i+2]=valor;pixels[i+3]=255;}return {largura:w,altura:h,pixels};}
test('01 — prompt de correcao V13, preservando compatibilidade com area antiga',()=>assert.equal(VERSAO_PROMPT_CORRECAO,'GF-CORRECAO-V13'));
test('02 — prompt preserva pixels fora da selecao',()=>assert.match(instrucoesCorrecao({tipo:'alca_decote',descricao:'Corrigir apenas o contorno da alca do top.',comMascara:true}),/MASCARA/));
test('03 — decodificacao e exportacao PNG sem alterar pixels',()=>{const i=imagem();assert.deepEqual(lerPNG(salvarPNG(i)).pixels,i.pixels)});
test('04 — mascara tem transparencia apenas na selecao',()=>{const i=imagem();const area=normalizarArea({x:.3,y:.3,w:.2,h:.2},i.largura,i.altura);const mask=lerPNG(mascaraPNG({...i,area}));const alpha=(x,y)=>mask.pixels[(y*i.largura+x)*4+3];assert.equal(alpha(1,1),255);assert.equal(alpha(50,70),0)});
test('05 — pixels fora da area ficam IDENTICOS mesmo se a IA alterar toda a foto',()=>{const a=imagem(),b=imagem(120,180,50);const area=normalizarArea({x:.30,y:.35,w:.25,h:.20},a.largura,a.altura);const out=lerPNG(composicaoLocalizada(salvarPNG(a),salvarPNG(b),area));const px=(img,x,y)=>img.pixels.subarray((y*img.largura+x)*4,(y*img.largura+x)*4+4);assert.deepEqual(px(out,60,10),px(a,60,10));assert.deepEqual(px(out,8,100),px(a,8,100));assert.notDeepEqual(px(out,46,80),px(a,46,80));});
test('06 — recusa area maior que 36%',()=>assert.throws(()=>normalizarArea({x:.1,y:.1,w:.8,h:.8},120,180),/menor/i));
test('07 — recusa PNG de dimensoes diferentes',()=>{const base=salvarPNG(imagem()),out=salvarPNG(imagem(130,180));const area=normalizarArea({x:.2,y:.2,w:.2,h:.2},120,180);assert.throws(()=>composicaoLocalizada(base,out,area),/diferente/)});
test('08 — mascara antiga so e enviada quando existir area',()=>assert.match(ler('backend/src/routes/correcoes-imagens.js'),/if \(mascara\) form\.append\("mask"/));
test('09 — imagem composta salva no banco, sem alterar anterior',()=>{const js=ler('backend/src/routes/correcoes-imagens.js');assert.match(js,/composicaoLocalizada/);assert.match(js,/INSERT INTO public\.imagens_geradas_ia/)});
test('10 — interface dispensa selecao e permite reverter para V1',()=>{const html=ler('site/admin/gerador-imagens.html'),js=ler('site/js/correcoes-imagens.js');assert.doesNotMatch(html,/id="gf10AreaLayer"/);assert.match(html,/id="gf10UsarRaiz"/);assert.doesNotMatch(js,/pointerdown/);assert.match(js,/dados\.set\("usarRaiz"/)});

// Testes da interface e do bloqueio de exclusao de historico aprovado (V10).
test('11 — exclusao completa remove correcoes antes das imagens (FK RESTRICT)',()=>{const js=ler('backend/src/routes/geracoes-historico.js');assert.match(js,/router\.delete\("\/:id"/);assert.ok(js.indexOf('DELETE FROM public.correcoes_imagens_ia WHERE lote_id') < js.indexOf('DELETE FROM public.geracoes_imagens_ia WHERE lote_id'));});
test('12 — bloqueia remocao de geracoes aprovadas e processando',()=>{const js=ler('backend/src/routes/geracoes-historico.js');assert.match(js,/status_revisao==='aprovada'/);assert.match(js,/status==='processando'/);assert.match(js,/referencias_aprovadas_modelo_ia/);});
test('13 — historico exibe botao excluir geracao nao aprovada',()=>{const js=ler('site/js/gerador-imagens.js');assert.match(js,/Excluir geração/);assert.match(js,/excluirLote\(lote, excluir\)/);});
