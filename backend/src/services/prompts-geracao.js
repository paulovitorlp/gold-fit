"use strict";

/*
 * GOLD FIT PRO — ESTÚDIO IA / PROMPT V13
 * Instruções fixas de geração, NÃO treinamento de modelo.
 * Prioridade: fotografia do produto > identidade da modelo > pose sugerida.
 * Fotografia aprovada anteriormente pode sugerir POSE, jamais textura ou roupa.
 */

const ANGULOS = Object.freeze(["frente", "costas", "lado", "superior"]);
const VERSAO_PROMPT = "GF-ESTUDIO-V13";

const POSES = Object.freeze({
    frente: [
        "postura natural de catálogo, peso levemente apoiado em uma perna e braços relaxados",
        "posição em pé com uma mão apoiada suavemente na cintura e ombros naturais",
        "pequeno passo natural para a frente, postura ereta, braços em movimento discreto",
        "posição frontal em pé, braços em descanso, leve deslocamento de peso e expressão espontânea"
    ],
    costas: [
        "em pé de costas, ombros alinhados e braços na posição mais próxima da foto REAL do produto quando ela mostrar pessoa vestindo; sem descobrir regiões ocultas",
        "em pé de costas com leve deslocamento do peso do corpo para uma perna, apenas se a roupa e seus detalhes estiverem completamente visíveis na foto real",
        "pequeno passo de costas para a câmera, sem inventar detalhes traseiros ocultos por braços, mãos ou cabelo",
        "de costas, postura relaxada, sem abrir ou reposicionar os braços para revelar detalhes não documentados do produto"
    ],
    lado: [
        "perfil lateral completo com postura relaxada e braços soltos",
        "perfil lateral de corpo inteiro, peso em uma perna, cabeça neutra",
        "passo curto em perfil lateral, sem ocultar o contorno da peça",
        "perfil lateral estático com uma mão apoiada levemente na cintura"
    ],
    superior: [
        "retrato do tronco com ombros relaxados, rosto voltado para a câmera",
        "enquadramento do rosto e top com leve inclinação natural dos ombros",
        "retrato de três quartos dos ombros, mas mantendo a frente da peça legível",
        "retrato frontal com uma mão em postura discreta sem obstruir o produto"
    ]
});

function textoCurto(valor, limite = 500) {
    return String(valor ?? "").trim().slice(0, limite);
}

function poseSugerida(angulo, indice = 0) {
    if (!ANGULOS.includes(angulo)) throw new Error("Angulo de geracao invalido.");
    const indiceValido = Number.isFinite(Number(indice)) ? Math.abs(Math.trunc(Number(indice))) : 0;
    return POSES[angulo][indiceValido % POSES[angulo].length];
}

const INSTRUCOES_ANGULO = Object.freeze({
    frente: [
        "CAMERA: vista de frente, corpo inteiro, rosto visível; fotografar o produto com clareza.",
        "A peça frontal deve corresponder à PRIMEIRA imagem, que é a fotografia real do produto.",
        "Preserve toda a padronagem contrastante visível, inclusive viés branco do decote e das alças, linhas brancas do top, acabamento do cós e filetes brancos da legging; não simplificar os traços nem confundi-los com reflexos de luz.",
        "Copie logos frontalmente visíveis, incluindo bordado BRANCO SOBRE BRANCO; mantenha desenho, posição, escala e cor.",
        "Preserve decote, largura das alças, comprimento do top, altura do cós, bainhas, bolsos e recortes visíveis.",
        "LEGGING OU SHORT: a costura central frontal e os recortes da região frontal devem seguir EXATAMENTE o produto real. Se a frente da peça é lisa e sem costura central aparente, NÃO acrescente linha, curva, triângulo, emenda ou recorte nessa área.",
        "Não transfira a modelagem frontal ou qualquer costura da roupa que aparece nas referências da modelo.",
        "Quando os pés aparecerem, mostrar os dois com tênis esportivos brancos; nunca pés descalços."
    ].join("\n"),
    costas: [
        "CAMERA: vista traseira de corpo inteiro; deixar os detalhes posteriores visíveis.",
        "Referência traseira da modelo indica cabelo e proporções, NÃO as características da roupa que ela vestia.",
        "CONSERVAÇÃO DA POSE NAS COSTAS: se a fotografia REAL do produto mostrar uma pessoa de costas e braços, mãos ou cabelo ocultarem parte da roupa, preserve ao máximo a posição, sobreposição e oclusão originais. NÃO mova braço ou cabelo para revelar uma região que a referência não mostra. Pose criativa é subordinada à visibilidade real do produto.",
        "CONTORNOS E LINHAS BRANCAS: reproduza cuidadosamente TODAS as linhas e faixas brancas comprovadas na foto real da vista traseira: viés de gola, alças, bordas do top, cós, laterais e linhas da legging. Respeite número, espessura, direção, curvatura e pontos de continuidade observáveis, mesmo que parcialmente cobertos. NÃO apague, simplifique nem invente continuidade atrás dos braços.",
        "A logo frontal NÃO se transfere automaticamente para as costas. Não crie estampas, bolsos ou recortes traseiros não documentados.",
        "Não transplante costuras, desenhos ou acabamentos de leggings anteriores da mesma modelo.",
        "Se o produto enviado mostra só a frente, o verso é uma ESTIMATIVA VISUAL conservadora e deve passar por revisão humana.",
        "Quando visíveis, os dois pés devem usar tênis esportivos brancos."
    ].join("\n"),
    lado: [
        "CAMERA: perfil lateral VERDADEIRO, sem transformar o enquadramento em três quartos frontal.",
        "Observe o caimento lateral e o comprimento real das peças. Não copie recortes laterais da roupa da modelo-base.",
        "Se a foto real da roupa vestida mostrar um braço, mão ou cabelo ocultando a lateral, preserve posição e oclusão em vez de mudar a pose para desenhar linhas escondidas. Mantenha os filetes brancos, bordas e recortes VISÍVEIS do top e da legging, com a mesma espessura e direção.",
        "Não invente costuras centrais, divisões frontais, bolsos, barras ou acabamentos não identificados no produto.",
        "Quando visíveis, os dois pés devem usar tênis esportivos brancos."
    ].join("\n"),
    superior: [
        "CAMERA: parte superior do corpo, enquadramento aproximado, rosto incluído e foco em top ou camiseta.",
        "Priorizar textura, decote, alças, costuras e logo frontal quando efetivamente vistos na fotografia do produto.",
        "Cabelo ou mão sobrepostos ao top não autorizam inventar detalhes escondidos. Manter a sobreposição e os contornos brancos realmente visíveis conforme o produto.",
        "Se logo branco sobre branco existir, preservar sua cor e destacar somente pelo relevo e luz; não criar marca nova.",
        "Manter pose confortável sem cobrir a frente da roupa; caso os pés apareçam, nunca descalços."
    ].join("\n")
});

function criarPrompt({
    nome,
    angulo = "frente",
    detalhes = "",
    calcado = "tenis branco",
    identidade = "",
    variacao = 0,
    referenciaAprovada = false,
    referenciasProduto = [],
    origemPrincipal = "auto",
    modoPose = "variavel"
} = {}) {
    if (!ANGULOS.includes(angulo)) throw new Error("Angulo de geracao invalido.");
    return [
        "TAREFA: fotografia fotorrealista de catálogo fitness feminino, vertical 2:3, estúdio clean, fundo cinza muito claro, luz suave, anatomia realista e caimento natural. Sem texto publicitário nem moldura.",
        "ORDEM DAS REFERENCIAS (REGRA CRITICA): A PRIMEIRA imagem é a foto REAL do PRODUTO. SOMENTE ELA determina tecido, textura (liso, canelado ou outro), tipo de peça, cor, recortes, costuras, cós, bainhas, bolsos e logos. Não copiar o fundo da fotografia do produto.",
        `As imagens seguintes identificam a MODELO ${textoCurto(nome, 80)}: preservar rosto, cabelo, tom de pele e proporções corporais, sem copiar a roupa usada nas fotos de referência.`,
        "REFERENCIAS MULTIPLAS DO PRODUTO: se houver fotos adicionais, elas aparecem APOS a imagem principal e ANTES das fotos da modelo. Todas as fotos adicionais documentam A MESMA ROUPA: frente, costas, lateral ou detalhes. Copie fielmente costuras, filetes, logos, alcas, comprimentos, tecido e recortes demonstrados em cada vista. Ignore rosto, corpo e pose de qualquer pessoa que esteja usando a roupa nas fotos do produto.",
        "IDENTIFICACAO VISUAL DO TIPO DE FOTO: examine cada referencia do produto. Se houver pessoa vestindo a peca, use a fotografia EXCLUSIVAMENTE para observar tecido, logos, modelagem, recortes, acabamentos e como a roupa veste. NAO COPIE o rosto, cabelo, anatomia ou pose dessa pessoa; a identidade e da modelo Gold Fit selecionada. Se a roupa estiver sobre tapete, arara, cabide ou manequim, ignore totalmente o suporte e o fundo; reconstrua somente a peca. Nao trate um corpo estranho como identidade da modelo.",
        `FOTO PRINCIPAL — CATEGORIA: ${origemPrincipal}. Se auto, identifique visualmente nesta geracao; se vestida, ignore a identidade da pessoa do produto; se exposta, ignore fundo/suporte. A categoria informada e uma orientacao, nao uma garantia de reconhecimento automatico.`,
        referenciasProduto.length
            ? `VISTAS ADICIONAIS DO PRODUTO (tipo, origem): ${referenciasProduto.map(x=>typeof x==="string"?x: `${x.tipo} (${x.origem})`).join(", ")}. A vista do angulo solicitado tem prioridade para detalhes comprovados, sem inventar costuras ocultas.`
            : "Se nao houver foto de um angulo, nao invente acabamentos ocultos; use estimativa conservadora.",
        "IMPORTANTE: referencias históricas e fotos da modelo são referências de IDENTIDADE E COMPOSIÇÃO, NUNCA um molde para vestir roupa nova. Apague mentalmente o vestuário antigo antes de recriar o produto real.",
        "SE A PRIMEIRA FOTO MOSTRAR A PEÇA VESTIDA: além de definir a roupa, ela é a referência prioritária de POSICIONAMENTO RELATIVO dos braços, mãos e cabelos que COBREM o produto. NÃO inventar ou revelar recortes, logos, bordas ou linhas ocultos. Se a PRIMEIRA foto for do produto sem pessoa, não há pose a reproduzir: respeite apenas os detalhes efetivamente visíveis da peça.",
        "REGRA DE OCLUSÃO: detecte visualmente se qualquer braço, mão, corpo ou cabelo esconde parte da peça. NESSE CASO, manter a pose e a oclusão o mais próximo possível da referência real do mesmo ângulo. NÃO remover o elemento que encobre a roupa só para mostrar uma costura, não substituir por nova pose e não completar desenhos escondidos com suposições. Se outro ângulo solicitado não estiver documentado, gerar apenas interpretação conservadora, para revisão do administrador.",
        "LINHAS BRANCAS/CONTRASTANTES: identificar uma a uma as linhas reais visíveis no produto, principalmente bordas claras do top (gola, alças, acabamento inferior) e filetes longitudinais, curvas e acabamentos da legging. Reproduzir cor, número, largura, espaçamento, posição e extensão APENAS ONDE VISÍVEIS. Não remover linhas reais, não trocar por reflexo e NÃO inventar continuação em regiões ocultas.",
        "CONTROLE DE MODELAGEM: a legging/short deve apresentar exatamente as divisões e costuras visíveis do produto original. Em uma peça com frente lisa, não acrescente costura central frontal, painel extra, recorte curvo, triângulo ou marcação decorativa. Se houver costura real, preserve-a fielmente. Não padronize todos os conjuntos com a mesma modelagem.",
        "TEXTURA: tecido canelado continua canelado; poliamida lisa continua lisa. Não transformar um tecido em outro por influência das roupas presentes nas fotos-base.",
        "LOGOS: preservar logotipo frontal apenas onde comprovado, inclusive BRANCO SOBRE BRANCO, na posição, cor e dimensão originais. Não deslocar logo para as costas nem duplicar marcas.",
        `CALCADO: ${textoCurto(calcado, 80) || "tenis branco"}. Quando os pés estiverem visíveis, usar tênis esportivos brancos nos dois pés, NUNCA descalça.`,
        "POSE: somente variar a postura quando a peça na fotografia REAL estiver suficientemente visível e nenhuma mudança puder exigir adivinhar detalhes ocultos. Se houver partes encobertas por braços, mãos, cabelo ou corpo, manter o mais fielmente possível a pose e as sobreposições visíveis da foto REAL do produto no mesmo ângulo. Preservar identidade da modelo, independentemente da pessoa na foto do produto.",
        modoPose === "mesma_pose"
            ? "POSE DA IMAGEM-MÃE: reproduzir aproximadamente a postura, os braços e o enquadramento da última imagem, MAS, se a fotografia REAL da nova cor apresentar sobreposições ou detalhes ocultos, NÃO mudar a pose para inventar linhas, costuras e bordas escondidas; prevalece a visibilidade da roupa real. Trocar SOMENTE o produto pela cor real da PRIMEIRA fotografia, sem copiar detalhes da roupa antiga."
            : `VARIAÇÃO DE POSE PARA ESTA GERAÇÃO (SOMENTE se não houver detalhes ocultos na foto real): ${poseSugerida(angulo, variacao)}. Se houver oclusão, esta sugestão de pose deve ser IGNORADA.`,
        referenciaAprovada
            ? (modoPose === "mesma_pose"
                ? "IMAGEM-MÃE APROVADA: a última imagem traz a identidade e a pose de referência. MANTER essa postura em termos gerais, mas SUBSTITUIR INTEGRALMENTE a roupa pela PRIMEIRA imagem real da cor de destino; não copiar textura, cor, logo ou costura da imagem-mãe."
                : "IMAGEM-MÃE APROVADA: use-a EXCLUSIVAMENTE como inspiração de postura, enquadramento e continuidade facial. Criar uma NOVA pose natural do ângulo solicitado. IGNORE totalmente a roupa, suas logos, seu tecido e suas costuras.")
            : "Não usar características do vestuário das fotos de referência como base para o novo produto.",
        "Não adicionar acessórios, objetos, estampa, bolsos ou costuras ausentes da foto do produto. Em ângulos que a foto original não revela, manter uma estimativa conservadora, sujeita à aprovação humana.",
        INSTRUCOES_ANGULO[angulo],
        identidade ? `IDENTIDADE DA MODELO (apoio secundário às fotos): ${textoCurto(identidade, 700)}` : "",
        detalhes ? `OBSERVAÇÕES DO ADMINISTRADOR SOBRE O PRODUTO: ${textoCurto(detalhes, 500)}` : "",
        "RESULTADO: apenas uma fotografia profissional do produto na modelo selecionada, sem texto sobreposto."
    ].filter(Boolean).join("\n\n");
}

module.exports = { ANGULOS, VERSAO_PROMPT, criarPrompt, poseSugerida };
