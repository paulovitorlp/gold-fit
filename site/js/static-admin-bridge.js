"use strict";
/* Gold Fit V29 - interface real com servicos de demonstração no navegador.
 * Não autentica acesso ao banco; nunca envia dados à API privada.
 */
(() => {
  const dockerLocal = ["127.0.0.1", "localhost"].includes(location.hostname) && ["8080", "3001"].includes(location.port);
  if (dockerLocal) return;
  window.GoldFitDemoStatic = true;
  const K={stock:"goldfit_estoque_demo_v4",prod:"goldfit_produtos_site_v1",sess:"goldfit_sessao_demo_v1",photos:"gf_static_gallery_v29"};
  const access=()=>sessionStorage.getItem("gf_static_demo_access")==="1";
  if (location.pathname.includes('/admin/') && !access()) {
    location.replace(new URL('../login.html?modo=admin',location.href));return;
  }
  if (access()) {
    localStorage.setItem(K.sess,JSON.stringify({id:"demo",nome:"Administrador Gold Fit",email:"admin@goldfit.demo",perfil:"admin"}));
  }
  let el=document.getElementById("gf29Indicator");if(el)el.hidden=false;
  const get=(key,fb)=>{try {const v=JSON.parse(localStorage.getItem(key));return v??fb}catch{return fb}};
  const set=(key,val)=>localStorage.setItem(key,JSON.stringify(val));
  const normalize=x=>String(x??'').trim().toLocaleLowerCase('pt-BR');
  const key=x=>`${x.produto}|${x.marca}`;
  const seed=Array.isArray(window.GOLD_FIT_ESTOQUE_EXEMPLO)?window.GOLD_FIT_ESTOQUE_EXEMPLO:[];
  // V28 demo editions are imported once when possible.
  if(!localStorage.getItem(K.stock))set(K.stock,get('gf_static_stock_v28',seed));
  const stock=()=>get(K.stock,seed);
  const modelDefault=(s,idx)=>({chave:key(s),produto:s.produto,marca:s.marca,grupo:s.grupo,categoria:s.categoria,preco:Number(s.preco)||({"Cropped ALO":65,"Tênis Nike":280,"Meia ALO":40}[s.produto]||160),fotoPrincipal:'',corCapa:'',publicado:true,destaque:true,lancamento:false,ordem:idx*10+10});
  function products(){
    let prods=get(K.prod,[]);if(!Array.isArray(prods))prods=[];
    const mapa=new Map(prods.map(p=>[p.chave,p]));
    for(const s of stock())if(!mapa.has(key(s)))mapa.set(key(s),modelDefault(s,mapa.size));
    prods=[...mapa.values()];set(K.prod,prods);return prods;
  }
  if(!localStorage.getItem(K.prod)){
    const pub=get('gf_static_published_v28',{});
    set(K.prod,products().map(p=>({...p,publicado:pub[normalize(p.produto)+'::'+normalize(p.marca)]!==false})));
  }
  const photos=()=>get(K.photos,[]);
  const persistPhotos=items=>set(K.photos,items);
  // keep public site in sync with local changes in THIS browser only
  function state(publicView){
    const prods=products(),items=stock();
    if(!publicView)return {status:'ok',estoque:items,produtos:prods};
    const pub=new Map(prods.filter(p=>p.publicado!==false).map(p=>[p.chave,p]));
    const approved=photos().filter(f=>f.tipoFoto==='modelo');
    // Unphotographed products still have cards; unapproved colors cannot be bought.
    return {status:'ok',produtos:[...pub.values()],estoque:items.filter(s=>pub.has(key(s))).map(s=>{
      const a=approved.filter(f=>f.chave===key(s)&&normalize(f.cor)===normalize(s.cor)).sort((x,y)=>x.ordem-y.ordem);
      return {...s, foto:a[0]?.url||'',quantidade:a.length?Number(s.quantidade)||0:0,semFotoModelo:!a.length};
    })};
  }
  const response=(data,code=200)=>new Response(JSON.stringify(data),{status:code,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  const error=(msg,code=400)=>response({status:'erro',mensagem:msg},code);
  const orig=window.fetch.bind(window);
  window.fetch=async (input,options={})=>{
    const url=typeof input==='string'?input:input.url;
    const u=new URL(url,location.href),path=u.pathname;
    if(!path.startsWith('/api/')&&!path.includes('/api/'))return orig(input,options);
    const method=(options.method||'GET').toUpperCase();
    const body=()=>{try{return JSON.parse(options.body||'{}')}catch{return {}}};
    if(path.endsWith('/api/admin/session'))return error('API privada nao disponivel neste ambiente',404);
    if(path.endsWith('/api/admin/logout')){sessionStorage.removeItem('gf_static_demo_access');localStorage.removeItem(K.sess);return response({status:'ok'})}
    if(path.endsWith('/api/loja/estado')&&method==='GET')return response(state(u.searchParams.get('visao')==='publica'||!access()));
    if(/\/api\/loja\/estado\/(estoque|produtos)$/.test(path)&&method==='PUT'){
      if(!access())return error('Demonstração não iniciada',401);
      const d=body(),tipo=path.split('/').pop();if(!Array.isArray(d.dados))return error('Dados inválidos');
      set(tipo==='estoque'?K.stock:K.prod,d.dados);return response({status:'ok'});
    }
    if(path.endsWith('/api/loja/modelo')&&method==='POST'){
      if(!access())return error('Entre na demonstração',401);
      const {chave,alteracoes}=body();const ps=products(),i=ps.findIndex(p=>p.chave===chave);
      if(i<0)return error('Modelo não encontrado',404);
      const novo={...ps[i],...alteracoes};
      if(novo.corCapa&&!photos().some(f=>f.chave===chave&&normalize(f.cor)===normalize(novo.corCapa)&&f.tipoFoto==='modelo'))return error('Cadastre foto de modelo vestindo para usar como capa.');
      ps[i]=novo;set(K.prod,ps);
      if(['grupo','categoria','preco'].some(k=>k in alteracoes))set(K.stock,stock().map(x=>key(x)===chave?{...x,grupo:novo.grupo,categoria:novo.categoria,preco:novo.preco}:x));
      return response({status:'ok',modelo:novo});
    }
    if(path.endsWith('/api/loja/variacao')&&method==='POST'){
      if(!access())return error('Entre na demonstração',401);
      const req=body(),ss=stock(),idx=ss.findIndex(x=>String(x.id)===String(req.id));let changed='';
      if(req.acao==='quantidade'){if(idx<0||!Number.isInteger(Number(req.quantidade))||Number(req.quantidade)<0)return error('Quantidade inválida');ss[idx].quantidade=Number(req.quantidade);changed=key(ss[idx]);}
      else if(req.acao==='excluir'){if(idx<0)return error('Variação não encontrada',404);changed=key(ss[idx]);ss.splice(idx,1)}
      else if(req.acao==='salvar'){
        const v=req.variacao||{};if(!v.produto||!v.marca||!v.cor||!v.sku||!Number.isInteger(Number(v.quantidade))||Number(v.quantidade)<0)return error('Dados da variação inválidos');
        if(ss.some(x=>normalize(x.sku)===normalize(v.sku)&&String(x.id)!==String(req.id)))return error('SKU já cadastrado');
        if(req.id!=null&&idx<0)return error('Variação não encontrada',404);
        const novo={...v,quantidade:Number(v.quantidade),id:req.id!=null?req.id:Math.max(0,...ss.map(x=>Number(x.id)||0))+1};
        if(idx>=0)ss[idx]={...ss[idx],...novo};else ss.push(novo);changed=key(novo);
      }else return error('Ação desconhecida');
      set(K.stock,ss);products();return response({status:'ok',chave:changed});
    }
    if(path.endsWith('/api/galeria-produtos')&&method==='GET'){
      const subset=photos().filter(f=>(!u.searchParams.get('chave')||f.chave===u.searchParams.get('chave'))&&(!u.searchParams.has('visao')||u.searchParams.get('visao')!=='publica'||f.tipoFoto==='modelo'));
      return response({status:'ok',fotos:subset});
    }
    if(path.endsWith('/api/galeria-produtos/ordem')&&method==='PUT'){
      const {chave,cor,ids}=body(),fs=photos();for(const f of fs)if(f.chave===chave&&normalize(f.cor)===normalize(cor)){const i=ids.indexOf(f.id);if(i>=0)f.ordem=i+1}persistPhotos(fs);return response({status:'ok'});
    }
    if(path.endsWith('/api/galeria-produtos/fotos')&&method==='POST'){
      const d=options.body;if(!(d instanceof FormData))return error('Envie a fotografia por formulário');
      const chave=d.get('chave'),cor=d.get('cor'),file=d.get('foto'),tipoFoto=d.get('tipoFoto')==='modelo'?'modelo':'produto',fs=photos();
      const same=fs.filter(f=>f.chave===chave&&normalize(f.cor)===normalize(cor));
      if(same.length>=4)return error('Limite de quatro fotos por cor');
      if(!(file instanceof File)||!/^image\/(jpeg|png|webp)$/.test(file.type))return error('Formato de imagem não aceito');
      if(file.size>2_500_000)return error('No modo demonstrativo, envie imagens de até 2,5 MB');
      const data=await new Promise((ok,bad)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=bad;r.readAsDataURL(file)});
      const novo={id:Math.max(0,...fs.map(x=>Number(x.id)||0))+1,chave,cor,ordem:same.length+1,tipoFoto,url:data};
      fs.push(novo);try{persistPhotos(fs)}catch{return error('Armazenamento do navegador cheio. Use imagens menores ou remova outras fotos.',507)};
      return response({status:'ok',foto:novo},201);
    }
    const mtipo=path.match(/\/api\/galeria-produtos\/fotos\/(\d+)\/tipo$/);
    if(mtipo&&method==='PATCH'){
      const fs=photos(),f=fs.find(f=>String(f.id)===mtipo[1]);if(!f)return error('Foto não encontrada',404);
      f.tipoFoto=body().tipoFoto==='modelo'?'modelo':'produto';persistPhotos(fs);return response({status:'ok',foto:f});
    }
    const del=path.match(/\/api\/galeria-produtos\/fotos\/(\d+)$/);
    if(del&&method==='DELETE'){
      const fs=photos().filter(f=>String(f.id)!==del[1]);persistPhotos(fs);return response({status:'ok'});
    }
    const studio=window.GoldFitEstudioDemo||{modelos:[],imagens:[]};
    if(path.endsWith('/api/modelos-virtuais')){
      return response({status:'ok',modelos:studio.modelos.map((m,i)=>({codigo:m.codigo,nome:m.nome,foto_principal:m.imagem,total_referencias:5,total_aprovadas:0,total_geradas:studio.imagens.filter(x=>x.modelo===m.codigo).length})),total_referencias:studio.modelos.length*5});
    }
    if(path.endsWith('/api/geracao-imagens/status'))return response({status:'ok',disponivel:false});
    if(path.endsWith('/api/geracao-imagens')&&method==='POST')return error('Geração IA desativada: API privada',403);
    function lotes(){return studio.modelos.map((m,i)=>{
      const imgs=studio.imagens.filter(x=>x.modelo===m.codigo);
      return {id:i+1,modelo_codigo:m.codigo,modelo_nome:m.nome,nome_produto:'Fotografias já geradas',status:'concluida',criado_em:'2026-11-19T10:00:00-03:00',capa:imgs[0]?.imagem||m.imagem, total_imagens:imgs.length,angulos_solicitados:['frente','costas','lado'],imagens:imgs.map((x,j)=>({url:x.imagem,angulo:normalize(x.angulo).includes('costas')?'costas':normalize(x.angulo).includes('lado')?'lado':'frente',imagem_id:null}))};
    }).filter(l=>l.total_imagens>0)}
    if(path.endsWith('/api/geracoes-imagens')&&method==='GET'){
      return response({status:'ok',lotes:lotes(),geracoes_antigas:studio.imagens.filter(x=>!studio.modelos.some(m=>m.codigo===x.modelo)).map((x,i)=>({geracao_id:100+i,modelo_nome:'Arquivo exportado',url:x.imagem,angulo:'frente'}))});
    }
    const lote=path.match(/\/api\/geracoes-imagens\/(\d+)$/);
    if(lote&&method==='GET')return response({status:'ok',lote:lotes().find(l=>String(l.id)===lote[1])||null});
    // All other private services stay unavailable in static demonstrations.
    return error('Função disponível somente na versão Docker com API privada.',403);
  };
  window.addEventListener('DOMContentLoaded',()=>{
    const b=document.getElementById('gf29Indicator');if(b)b.hidden=false;
  });
})();
