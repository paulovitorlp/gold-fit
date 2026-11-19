"use strict";
// O painel público é deliberadamente INDEPENDENTE da API e do banco.
(() => {
  const $ = id => document.getElementById(id);
  if (sessionStorage.getItem("gf_static_demo_access") !== "1") {
    location.replace(new URL("../login.html?modo=admin", location.href).href); return;
  }
  const key="gf_static_stock_v28";
  const publishedKey="gf_static_published_v28";
  const source=Array.isArray(window.GOLD_FIT_ESTOQUE_EXEMPLO)?window.GOLD_FIT_ESTOQUE_EXEMPLO:[];
  const defaults=()=>source.map(x=>({...x}));
  function get(k, fallback){try {const v=JSON.parse(localStorage.getItem(k));return v&&typeof v==='object'?v:fallback} catch{return fallback}}
  let estoque=get(key,defaults()); if(!Array.isArray(estoque))estoque=defaults();
  let published=get(publishedKey,{});
  const chave=x=>[String(x.produto).trim().toLowerCase(),String(x.marca).trim().toLowerCase()].join('::');
  const save=()=>{localStorage.setItem(key,JSON.stringify(estoque));localStorage.setItem(publishedKey,JSON.stringify(published))};
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let editId=null; const modal=$('editor'), form=$('form');
  function render(){
    const q=$('busca').value.trim().toLowerCase(),grupo=$('filtro').value;
    const modelos=new Map();
    estoque.forEach(x=>{const k=chave(x); if(!modelos.has(k))modelos.set(k,{k,base:x,variacoes:[]});modelos.get(k).variacoes.push(x)});
    const todos=[...modelos.values()].sort((a,b)=>a.base.produto.localeCompare(b.base.produto,'pt-BR'));
    $('modelosTotal').textContent=todos.length;$('variacoesTotal').textContent=estoque.length;
    $('unidadesTotal').textContent=estoque.reduce((n,x)=>n+(Number(x.quantidade)||0),0);
    $('publicadosTotal').textContent=todos.filter(m=>published[m.k]!==false).length;
    const vis=todos.filter(m=>(!grupo||m.base.grupo===grupo)&&(!q||m.variacoes.some(x=>[x.produto,x.marca,x.cor,x.sku].some(v=>String(v).toLowerCase().includes(q)))));
    $('vazio').hidden=vis.length>0; const lista=$('lista');lista.replaceChildren();
    vis.forEach(m=>{
      const node=document.createElement('article');node.className='modelo';
      const pub=published[m.k]!==false;
      node.innerHTML=`<div class="modelo-head"><div><strong>${escape(m.base.produto)}</strong><small>${escape(m.base.marca)} · ${escape(m.base.grupo)} / ${escape(m.base.categoria)} · ${m.variacoes.length} variação(ões)</small></div><span class="tag ${pub?'':'off'}">${pub?'PUBLICADO':'NÃO PUBLICADO'}</span><label><input type="checkbox" class="publicar" ${pub?'checked':''}> Publicar (demo)</label><button class="abrir" type="button">CORES / ESTOQUE ▾</button></div>`;
      node.querySelector('.publicar').onchange=e=>{published[m.k]=e.target.checked;save();render()};
      const body=document.createElement('div');body.className='variacoes';body.hidden=true;
      const bot=document.createElement('button');bot.className='primary';bot.textContent='+ COR / TAMANHO';bot.type='button';bot.onclick=()=>openEditor(null,m.base);body.append(bot);
      m.variacoes.forEach(x=>{let row=document.createElement('div');row.className='variacao';row.innerHTML=`<span><strong>${escape(x.cor)}</strong><small>Cor</small></span><span>${escape(x.tamanho)}<small>Tamanho</small></span><span>${escape(x.sku)}<small>SKU</small></span><span><strong>${Number(x.quantidade)||0}</strong><small>Unidades</small></span><span>${Number(x.quantidade)>0?'Em estoque':'Esgotado'}</span>`;const bt=document.createElement('button');bt.type='button';bt.textContent='EDITAR';bt.onclick=()=>openEditor(x);row.append(bt);body.append(row)});
      node.append(body);node.querySelector('.abrir').onclick=()=>{body.hidden=!body.hidden};lista.append(node);
    });
  }
  function openEditor(item,modelo){
    editId=item?.id??null;form.reset();$('erroForm').textContent='';
    for(const k of ['produto','marca','grupo','categoria','cor','tamanho','sku','quantidade'])form.elements[k].value=item?.[k]??modelo?.[k]??'';
    $('tituloModal').textContent=item?'Editar variação':'Novo produto / variação';modal.showModal();
  }
  form.onsubmit=e=>{
    e.preventDefault();$('erroForm').textContent='';
    const novo=Object.fromEntries(['produto','marca','grupo','categoria','cor','tamanho','sku','quantidade'].map(k=>[k,form.elements[k].value.trim()]));
    novo.quantidade=Number(novo.quantidade);
    if(!Number.isInteger(novo.quantidade)||novo.quantidade<0){$('erroForm').textContent='Quantidade inválida.';return}
    if(estoque.some(x=>String(x.sku).toLowerCase()===novo.sku.toLowerCase()&&String(x.id)!==String(editId))){$('erroForm').textContent='Já existe uma variação com esse SKU.';return}
    if(editId===null){novo.id=Math.max(0,...estoque.map(x=>Number(x.id)||0))+1;estoque.push(novo)}
    else {const i=estoque.findIndex(x=>String(x.id)===String(editId));if(i<0)return;estoque[i]={...estoque[i],...novo}}
    save();modal.close();render();
  };
  $('novo').onclick=()=>openEditor(null);$('fechar').onclick=()=>modal.close();$('cancelar').onclick=()=>modal.close();
  $('busca').oninput=render;$('filtro').onchange=render;
  $('restaurar').onclick=()=>{if(confirm('Restaurar os dados de exemplo deste navegador? As edições demonstrativas serão perdidas.')){estoque=defaults();published={};save();render()}};
  $('sair').onclick=()=>{sessionStorage.removeItem('gf_static_demo_access');location.replace(new URL('../login.html?modo=admin',location.href))};
  render();
})();