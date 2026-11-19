"use strict";
/* GOLD FIT PRO V13 — Edicao por texto, sem selecao obrigatoria de area. */
(() => {
    const $ = id => document.getElementById(id);
    const modal = $("gf9Modal"), formulario = $("gf9Form");
    if (!modal || !formulario) return;
    const fotoBase = $("gf9FotoBase"), campoRaiz = $("gf10UsarRaiz");
    const EXEMPLOS = Object.freeze({
        alca_decote: "Ajuste apenas o contorno e as alças do top conforme a foto real. Mantenha rosto, pose, cor, tecido e demais detalhes.",
        costura: "Corrija somente a costura indicada conforme o produto real. Não adicione recortes que não existam na peça.",
        logo: "Corrija apenas o logo para corresponder ao tamanho, cor e posição da referência real, mantendo os demais detalhes.",
        cos: "Ajuste somente a largura e altura do cós conforme o produto verdadeiro. Preserve rosto, pose, cor e tecido.",
        tecido: "Preserve a modelagem, mas corrija apenas a textura do tecido para coincidir com a fotografia real.",
        calcado: "Corrija apenas os tênis. Preserve identidade, pose, roupa e fundo.",
        pose: "Ajuste delicadamente a pose da modelo mantendo a mesma identidade, roupa, iluminação e enquadramento coerentes.",
        fundo: "Ajuste somente o fundo de estúdio. Preserve identidade, roupa e detalhes do produto.",
        trocar_cor: "Troque SOMENTE a cor da roupa para [DIGITE A NOVA COR], preservando rosto, cabelo, pele, pose, fundo, logos, costuras, tecido e calçados.",
        aumentar_top: "Aumente o comprimento vertical do cropped/top até cobrir mais o abdômen, chegando ao cós da peça inferior. Mantenha decote, alças, logos, tecido, rosto, pose e fundo.",
        diminuir_top: "Diminua o comprimento vertical do cropped/top na proporção desejada, sem modificar decote, alças, logos, corpo, rosto e fundo.",
        aumentar_short: "Aumente o comprimento das pernas do short, deixando as barras mais baixas, sem alterar cós, corpo, tecido, logos, rosto ou pose.",
        diminuir_short: "Diminua o comprimento das pernas do short, deixando as barras mais altas, sem alterar cós, corpo, tecido, logos, rosto ou pose.",
        ajustar_caimento: "Ajuste somente o caimento da peça para ficar proporcional e natural, sem mudar corpo, pose, costuras, logos, tecido ou rosto.",
        outro: "Corrija apenas o detalhe a seguir, preservando o rosto, o restante da peça, pose, fundo, resolução e iluminação: [DESCREVA O DETALHE]."
    });
    let itemAtual=null, focoAnterior=null, preparando=false, urlExtra=null;
    let ultimoExemplo="";
    const estado = (texto, erro=false) => {
        const el=$("gf9Estado"); el.textContent=texto; el.classList.toggle("gf9-error",erro);
    };
    async function requisitar(url, opcoes={}) {
        const r=await fetch(url,{credentials:"same-origin",cache:"no-store",...opcoes});
        const body=await r.json().catch(()=>({}));
        if(r.status===401) throw new Error("Sessao administrativa expirada. Faca login novamente.");
        if(!r.ok) throw new Error(body.mensagem||`Falha HTTP ${r.status}.`);
        return body;
    }
    function atualizarBase(){
        if(!itemAtual) return;
        const raiz=campoRaiz.checked&&itemAtual.originalUrl;
        fotoBase.src=raiz?itemAtual.originalUrl:itemAtual.fotoUrl;
        $("gf10BaseInfo").textContent=raiz
            ? "Base: V1. Recomendada para evitar acumular borrões ou mudanças de rosto nas correções."
            : "Base: versão escolhida. Útil para manter ajustes anteriores, mas pode acumular perda de detalhes.";
    }
    campoRaiz?.addEventListener("change",atualizarBase);
    $("gf9Tipo").addEventListener("change",()=>{
        const valor=EXEMPLOS[$("gf9Tipo").value]||"";
        const campo=$("gf9Descricao");
        if(!campo.value.trim()||campo.value===ultimoExemplo){campo.value=valor;ultimoExemplo=valor;}
    });
    function fechar(){
        if(preparando) return;
        modal.hidden=true;document.body.classList.remove("gf9-modal-aberto");
        formulario.reset();$("gf9PreviewExtra").hidden=true;
        if(urlExtra) URL.revokeObjectURL(urlExtra);urlExtra=null;
        if(focoAnterior?.isConnected) focoAnterior.focus();
        itemAtual=null;
    }
    function criarVersao(v){
        const row=document.createElement("div");row.className="gf9-version-line";
        const div=document.createElement("div"),strong=document.createElement("strong"),small=document.createElement("small");
        strong.textContent=`Versão ${v.versao} · ${v.status==="concluida"?"Pronta":v.status==="erro"?"Erro":"Em andamento"}`;
        small.textContent=v.instrucoes||"";div.append(strong,small);row.append(div);
        if(v.imagem_resultado_id&&v.url){const a=document.createElement("a");a.href=`/api/correcoes-imagens/baixar/${v.imagem_resultado_id}`;a.textContent="Baixar";a.className="gf9-version-download";row.append(a);}
        return row;
    }
    async function listarVersoes(){
        const alvo=$("gf9Versoes");alvo.replaceChildren();
        try{
            const dados=await requisitar(`/api/correcoes-imagens/versoes/${itemAtual.imagemId}`);
            if(!dados.versoes?.length){alvo.textContent="Imagem original V1; nenhuma correção anterior.";return;}
            const titulo=document.createElement("p");titulo.textContent=`Histórico da imagem #${dados.imagem_raiz_id} (original preservada).`;
            alvo.append(titulo);for(const item of dados.versoes) alvo.append(criarVersao(item));
        }catch(e){alvo.textContent=`Histórico indisponível: ${e.message}`;}
    }
    async function abrir(botao){
        if(preparando)return;
        const loteId=String(botao.dataset.lote||""),imagemId=String(botao.dataset.imagem||""),fotoUrl=String(botao.dataset.foto||"");
        if(!/^[1-9]\d{0,15}$/.test(loteId)||!/^[1-9]\d{0,15}$/.test(imagemId)||!/^\/arquivos\/geradas\/[a-zA-Z0-9_.-]+\.png$/.test(fotoUrl))return;
        focoAnterior=botao;itemAtual={loteId,imagemId,fotoUrl,originalUrl:null};
        formulario.reset();campoRaiz.checked=true;ultimoExemplo="";
        $("gf9Descricao").value=EXEMPLOS[$("gf9Tipo").value]||"";ultimoExemplo=$("gf9Descricao").value;
        $("gf9PreviewExtra").hidden=true;$("gf9Versoes").textContent="Consultando versões...";
        $("gf9TituloImagem").textContent=`Corrigir foto #${imagemId} · lote #${loteId}`;
        estado("Descreva o ajuste no campo de texto. Nao e necessario selecionar nenhuma area.");
        atualizarBase();modal.hidden=false;document.body.classList.add("gf9-modal-aberto");$("gf9Tipo").focus();
        await listarVersoes();const atual=itemAtual;
        try{
            const base=await requisitar(`/api/correcoes-imagens/base/${imagemId}`);
            if(itemAtual===atual){itemAtual.originalUrl=base.url;atualizarBase();}
        }catch(e){if(itemAtual===atual){campoRaiz.checked=false;$("gf10BaseInfo").textContent=`V1 indisponível: ${e.message}`;}}
    }
    document.addEventListener("click",e=>{const botao=e.target.closest(".gf9-corrigir");if(botao)abrir(botao);});
    $("gf9Fechar").addEventListener("click",fechar);$("gf9Cancelar").addEventListener("click",fechar);
    modal.addEventListener("click",e=>{if(e.target===modal)fechar();});
    document.addEventListener("keydown",e=>{
        if(modal.hidden)return;
        if(e.key==="Escape"){e.preventDefault();fechar();}
        if(e.key==="Tab"){
            const focusable=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter(x=>x.getClientRects().length);
            if(!focusable.length)return;
            if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable.at(-1).focus();}
            if(!e.shiftKey&&document.activeElement===focusable.at(-1)){e.preventDefault();focusable[0].focus();}
        }
    });
    $("gf9Referencia").addEventListener("change",()=>{
        if(urlExtra) URL.revokeObjectURL(urlExtra);urlExtra=null;
        const arquivo=$("gf9Referencia").files[0],preview=$("gf9PreviewExtra");
        if(!arquivo){preview.hidden=true;preview.removeAttribute("src");return;}
        if(!["image/jpeg","image/png","image/webp"].includes(arquivo.type)||arquivo.size>10*1024*1024||arquivo.size<=0){
            $("gf9Referencia").value="";preview.hidden=true;estado("A referência extra deve ser JPG, PNG ou WEBP com até 10 MB.",true);return;
        }
        urlExtra=URL.createObjectURL(arquivo);preview.src=urlExtra;preview.hidden=false;
    });
    formulario.addEventListener("submit",async e=>{
        e.preventDefault();if(!itemAtual||preparando)return;
        const tipoAjuste=$("gf9Tipo").value,instrucoes=$("gf9Descricao").value.trim();
        if(instrucoes.length<8||instrucoes.length>1500)return estado("Informe uma descrição entre 8 e 1500 caracteres.",true);
        if(instrucoes.includes("[DIGITE")||instrucoes.includes("[DESCREVA"))return estado("Substitua o texto entre colchetes pela instrução real.",true);
        if(!window.confirm("Criar uma nova versão corrigida por TEXTO, sem marcação de área? A API utiliza créditos e pode redesenhar outros detalhes; a foto anterior será preservada."))return;
        const dados=new FormData();dados.set("tipoAjuste",tipoAjuste);dados.set("instrucoes",instrucoes);
        dados.set("usarRaiz",campoRaiz.checked?"true":"false");
        const extra=$("gf9Referencia").files[0];if(extra)dados.set("referenciaExtra",extra);
        preparando=true;for(const id of ["gf9Enviar","gf9Fechar","gf9Cancelar"]) $(id).disabled=true;
        estado("Enviando correção por texto à API. A versão anterior permanece salva.");
        try{
            const r=await requisitar(`/api/correcoes-imagens/${itemAtual.loteId}/${itemAtual.imagemId}`,{method:"POST",body:dados});
            estado(`Versão ${r.versao} salva! Revise rosto, nitidez e roupa antes de aprovar.`);
            await listarVersoes();window.dispatchEvent(new CustomEvent("goldfit:correcao-concluida",{detail:{loteId:itemAtual.loteId,imagemId:r.imagem_id,versao:r.versao}}));
        }catch(e){estado(`Correção não concluída: ${e.message}`,true);}
        finally{preparando=false;for(const id of ["gf9Enviar","gf9Fechar","gf9Cancelar"]) $(id).disabled=false;}
    });
})();
