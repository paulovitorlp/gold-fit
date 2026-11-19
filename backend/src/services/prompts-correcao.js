"use strict";
/* GOLD FIT PRO V13 — Correção por texto. Instruções configuradas no backend;
 * não são treinamento de pesos. Fotos do produto definem a roupa; referências
 * das modelos definem identidade. Máscara é opcional para clientes antigos. */
const TIPOS = Object.freeze({
    alca_decote: "Ajustar alças, viés, acabamento do decote e contorno da peça conforme produto real",
    costura: "Ajustar costuras e recortes reais sem inventar divisões, painéis e emendas",
    logo: "Corrigir localização, dimensão e cor da marca apenas se documentada na referência",
    cos: "Ajustar altura, largura e acabamento do cós conforme a peça verdadeira",
    tecido: "Ajustar a trama, textura e material (liso, canelado ou dry fit) conforme referência",
    calcado: "Corrigir apenas calçado; manter tênis em ambos os pés quando visíveis",
    pose: "Alterar somente a pose solicitada, mantendo identidade, roupa e enquadramento coerentes",
    fundo: "Ajustar fundo ou iluminação sem descaracterizar a pessoa nem a peça",
    trocar_cor: "Trocar a cor da roupa para a tonalidade escrita na instrução, conservando tecido, costuras e logos; usar foto real da nova cor quando disponível",
    aumentar_top: "AUMENTAR o comprimento vertical do top/cropped para baixo, cobrindo mais abdômen, sem aumentar busto, cintura ou alças",
    diminuir_top: "DIMINUIR o comprimento vertical do top/cropped para cima, sem mexer em decote, alças e proporções do corpo",
    aumentar_short: "AUMENTAR o comprimento das pernas do short, com barra mais baixa, sem alterar cintura ou volume do corpo",
    diminuir_short: "DIMINUIR o comprimento das pernas do short, com barra mais alta, sem alterar cós ou proporções do corpo",
    ajustar_caimento: "Ajustar discretamente o caimento e o comprimento da peça solicitada; preservar anatomia e detalhes",
    outro: "Alterar apenas o detalhe indicado pelo administrador"
});
const VERSAO_PROMPT_CORRECAO = "GF-CORRECAO-V13";
function instrucoesCorrecao({tipo,descricao,angulo="frente",nome="modelo",comOriginal=false,comExtra=false,comRosto=false,comMascara=false}={}) {
    if(!Object.hasOwn(TIPOS,tipo)) throw new Error("Tipo de correcao invalido.");
    const texto=String(descricao??"").trim();
    if(texto.length<8 || texto.length>1500) throw new Error("Explique a correcao em 8 a 1500 caracteres.");
    return [
        comMascara
            ? "TAREFA: CORRECAO LOCALIZADA. A MASCARA e somente um guia para a regiao a alterar. Nao redesenhar o restante da imagem."
            : "TAREFA: EDICAO POR TEXTO SEM MASCARA. O ADMINISTRADOR NAO SELECIONOU AREA. Modifique SOMENTE A PECA ou o detalhe pedido, preservando visualmente todo o restante da imagem. O modelo pode recriar pixels; conferir o resultado antes de aprovar.",
        "PRIMEIRA IMAGEM: fotografia existente e base prioritária. Mantenha rosto, identidade, expressao, cabelo, anatomia, pose, pele, tenis, fundo, luz, perspectiva e enquadramento. Nao refaca o rosto nem melhore cosmeticamente o rosto.",
        comOriginal ? "SEGUNDA IMAGEM: fotografia ORIGINAL do produto. Ela determina comprimentos reais, cor, textura, costuras, logos, modelagem e caimento. Nunca copiar o fundo desta foto." : "Sem fotografia original disponivel: nao inventar detalhes ausentes.",
        comExtra ? "REFERENCIA EXTRA: mostra um detalhe real da ROUPA, possivelmente em outra pessoa. NAO copiar rosto, cabelo, pose ou corpo da referencia extra." : "Sem referencia extra: editar conservadoramente.",
        comRosto ? `REFERENCIA DE IDENTIDADE: fotografia da modelo ${String(nome).slice(0,80)}. Preservar seus tracos faciais; nunca importar a roupa da referencia facial.` : "Preserve o rosto da primeira imagem com a maior fidelidade possivel.",
        `ANGULO: ${String(angulo).slice(0,20)}. Nao alterar perspectiva ou angulo, exceto se o pedido for especificamente mudar pose.`,
        `TIPO DE EDICAO: ${TIPOS[tipo]}.`,
        `INSTRUCAO DO ADMINISTRADOR: ${texto}`,
        "COMPRIMENTO E TAMANHO: alongar ou encurtar top e short diz respeito SOMENTE ao comprimento do tecido, salvo se o administrador pedir explicitamente ajuste de largura. Nao alterar seios, quadris, pernas ou anatomia para ajustar o tamanho da roupa.",
        "COSTURAS: o produto real determina costura central frontal, linhas de acabamento e divisorias. Se nao ha uma costura evidente na frente da peça real, nao adicionar. Nao herdar costuras de fotografias anteriores da modelo.",
        "POSE COM DETALHES OCULTOS: se um braco, mao, cabelo ou parte do corpo cobre a roupa na foto base ou na referencia do produto, mantenha a pose e a sobreposicao o mais fielmente possivel. Nao reposicione membros para mostrar a regiao oculta, nao invente o que nao esta visivel e nao altere o angulo para fabricar detalhes. Caso o ajuste seja de pose, ele nao autoriza inventar recortes ocultos.",
        "CONTORNOS E FILETES BRANCOS: se o produto tiver vies branco no top, linhas brancas nas alcas, gola, cos, recortes ou na lateral da legging, preservar e restaurar todos os trechos comprovadamente visiveis, com a mesma cor, quantidade, espessura, direcao e trajetoria. Nao copiar linhas de outra peca nem desenhar continuidade invisivel atras de um braco.",
        "LOGOS: nao criar marcas novas, nao reposicionar logos sem solicitacao; conservar cores e escala originais. Se pedir trocar cor, preserve estampa e logotipos, sem colorir pele, cabelos, tenis e fundo.",
        "QUALIDADE: preservar nitidez original do rosto, fios de cabelo e textura da pele. Evitar suavizacao artificial, desfoque, plastificacao, artefatos, reamostragem desnecessaria ou mudanca de resolucao. Nunca usar edicao anterior como referencia de produto.",
        "RESULTADO: somente uma fotografia realista e detalhada sem texto de publicidade, sem nova moldura, sem recorte de cabeca ou pes. Cada nova versao ficara pendente de aprovacao."
    ].join("\n\n");
}
module.exports={TIPOS,VERSAO_PROMPT_CORRECAO,instrucoesCorrecao};
