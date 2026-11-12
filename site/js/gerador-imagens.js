
"use strict";

// ======================================================
// GOLD FIT — GERADOR DE IMAGENS V4
// Carrossel de modelos + preparação de imagens
// ======================================================

// SESSÃO ATUAL (DEMONSTRATIVA)

const sessaoGerador =
  typeof goldFitCarregarSessao === "function"
    ? goldFitCarregarSessao()
    : null;

if (!sessaoGerador || sessaoGerador.perfil !== "admin") {
  window.location.replace(
    "../login.html?next=admin/gerador-imagens.html"
  );
}

// ======================================================
// ELEMENTOS
// ======================================================

const elemento = (id) => document.getElementById(id);

const formGerador = elemento("formGerador");
const statusGerador = elemento("statusGerador");

const listaCores = elemento("listaCores");
const btnAdicionarCor = elemento("btnAdicionarCor");

const resultadosPrevistos =
  elemento("resultadosPrevistos");

const totalCores = elemento("totalCores");
const totalAngulos = elemento("totalAngulos");
const totalImagens = elemento("totalImagens");

const resumoPreparacao =
  elemento("resumoPreparacao");

const promptPreview = elemento("promptPreview");

// CARROSSEL

const modeloAnterior = elemento("modeloAnterior");
const modeloProximo = elemento("modeloProximo");

const modeloFotoPrincipal =
  elemento("modeloFotoPrincipal");

const modeloPlaceholder =
  elemento("modeloPlaceholder");

const modeloNome = elemento("modeloNome");

const modeloCodigoTexto =
  elemento("modeloCodigoTexto");

const modeloFotoStatus =
  elemento("modeloFotoStatus");

const statusModelos = elemento("statusModelos");

const miniaturasModelos =
  elemento("miniaturasModelos");

const modeloCodigoSelecionado =
  elemento("modeloCodigoSelecionado");

// ======================================================
// CONFIGURAÇÕES
// ======================================================

const MAX_CORES = 12;
const MAX_TAMANHO = 10 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const URL_MODELOS =
  "/api/modelos-virtuais?genero=feminino";

const previews = [
  ["fotoFrente", "previewFrente"],
  ["fotoCostas", "previewCostas"],
  ["fotoColecao", "previewColecao"],
  ["fotoModelo", "previewModelo"],
  ["fotoDetalhe", "previewDetalhe"]
];

const urlsTemporarias = new Map();

// Fallback visual, usado apenas se a API falhar.
// Não significa que a modelo exista no banco.

const MODELOS_LOCAIS = [
  { codigo: "F01", nome: "Helena" },
  { codigo: "F02", nome: "Camila" },
  { codigo: "F03", nome: "Beatriz" },
  { codigo: "F04", nome: "Rafaela" },
  { codigo: "F05", nome: "Isabela" }
].map((modelo) => ({
  ...modelo,
  id: null,
  fotoPrincipal: null
}));

let modelos = [];
let indiceModelo = 0;
let modelosVindosDoBanco = false;
let fotoPrincipalCarregada = false;

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function mostrarStatus(mensagem, erro = false) {
  statusGerador.textContent = mensagem;
  statusGerador.style.color = erro
    ? "#b32929"
    : "#23804a";
}

function invalidarPreparacao() {
  resumoPreparacao.hidden = true;
  resumoPreparacao.open = false;
  promptPreview.textContent = "";
}

function validarArquivo(arquivo) {
  if (!arquivo) return;

  if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
    throw new Error(
      "Utilize somente JPG, PNG ou WEBP."
    );
  }

  if (arquivo.size > MAX_TAMANHO) {
    throw new Error(
      "Cada fotografia deve ter no máximo 10 MB."
    );
  }
}

function obterArquivo(id) {
  return elemento(id).files[0] || null;
}

// ======================================================
// CARROSSEL — CONSULTAR MODELOS
// ======================================================

function obterModeloSelecionado() {
  return modelos[indiceModelo] || null;
}

function validarCaminhoFoto(caminho) {
  if (typeof caminho !== "string") {
    return null;
  }

  // Somente arquivos servidos pelo backend local.
  if (
    /^\/arquivos\/modelos\/[a-z0-9-]+\.(jpg|png|webp)$/i
      .test(caminho)
  ) {
    return caminho;
  }

  return null;
}

function normalizarModelo(registro) {
  return {
    id: registro.id,
    codigo: String(registro.codigo),
    nome: String(registro.nome),

    fotoPrincipal: validarCaminhoFoto(
      registro.foto_principal
    )
  };
}

async function carregarModelos() {
  statusModelos.textContent = "Consultando banco...";

  try {
    const resposta = await fetch(URL_MODELOS, {
      cache: "no-store"
    });

    if (!resposta.ok) {
      throw new Error(
        `API indisponível (${resposta.status})`
      );
    }

    const dados = await resposta.json();

    if (
      dados.status !== "ok" ||
      !Array.isArray(dados.modelos)
    ) {
      throw new Error("Resposta inválida da API.");
    }

    const registrosValidos = dados.modelos.filter(
      (registro) =>
        registro &&
        /^F\d{2}$/.test(String(registro.codigo)) &&
        typeof registro.nome === "string" &&
        registro.nome.trim()
    );

    if (registrosValidos.length === 0) {
      throw new Error(
        "Nenhuma modelo feminina ativa foi encontrada."
      );
    }

    modelos = registrosValidos.map(normalizarModelo);
    modelosVindosDoBanco = true;

    statusModelos.textContent =
      `${modelos.length} modelos no banco`;

  } catch (erro) {
    console.warn(
      "Não foi possível carregar modelos do banco:",
      erro.message
    );

    modelos = MODELOS_LOCAIS.map(
      (modelo) => ({ ...modelo })
    );

    modelosVindosDoBanco = false;

    statusModelos.textContent =
      "Prévia local — API indisponível";
  }

  indiceModelo = 0;

  renderizarModelo();
}

// ======================================================
// CARROSSEL — EXIBIR MODELO
// ======================================================

function mostrarPlaceholderModelo() {
  modeloFotoPrincipal.hidden = true;
  modeloPlaceholder.hidden = false;
}

function renderizarModelo() {
  invalidarPreparacao();

  const modelo = obterModeloSelecionado();

  modeloAnterior.disabled = modelos.length < 2;
  modeloProximo.disabled = modelos.length < 2;

  miniaturasModelos.replaceChildren();

  fotoPrincipalCarregada = false;

  modeloFotoPrincipal.hidden = true;
  modeloFotoPrincipal.removeAttribute("src");

  if (!modelo) {
    modeloNome.textContent = "Nenhuma modelo";
    modeloCodigoTexto.textContent = "";
    modeloFotoStatus.textContent = "";
    modeloCodigoSelecionado.value = "";

    mostrarPlaceholderModelo();
    return;
  }

  modeloNome.textContent = modelo.nome;
  modeloCodigoTexto.textContent = modelo.codigo;
  modeloCodigoSelecionado.value = modelo.codigo;

  mostrarPlaceholderModelo();

  if (modelo.fotoPrincipal) {
    modeloFotoStatus.textContent =
      "Carregando fotografia cadastrada...";

    const caminhoEsperado = modelo.fotoPrincipal;

    modeloFotoPrincipal.onload = () => {
      if (
        obterModeloSelecionado()?.fotoPrincipal !==
        caminhoEsperado
      ) {
        return;
      }

      fotoPrincipalCarregada = true;
      modeloFotoPrincipal.hidden = false;
      modeloPlaceholder.hidden = true;

      modeloFotoStatus.textContent =
        "Fotografia cadastrada no banco";
    };

    modeloFotoPrincipal.onerror = () => {
      if (
        obterModeloSelecionado()?.fotoPrincipal !==
        caminhoEsperado
      ) {
        return;
      }

      fotoPrincipalCarregada = false;
      mostrarPlaceholderModelo();

      modeloFotoStatus.textContent =
        "Não foi possível carregar a fotografia.";
    };

    modeloFotoPrincipal.src = caminhoEsperado;

  } else {
    modeloFotoStatus.textContent =
      "Sem fotografia cadastrada";
  }

  // Construir miniaturas.
  modelos.forEach((item, indice) => {
    const botao = document.createElement("button");

    botao.type = "button";
    botao.className = "gf-model-miniatura";

    botao.setAttribute(
      "aria-pressed",
      String(indice === indiceModelo)
    );

    botao.setAttribute(
      "aria-label",
      `Selecionar modelo ${item.nome}`
    );

    const areaFoto = document.createElement("span");
    areaFoto.className = "gf-model-mini-foto";

    if (item.fotoPrincipal) {
      const imagem = document.createElement("img");

      imagem.src = item.fotoPrincipal;
      imagem.alt = "";

      imagem.onerror = () => {
        areaFoto.textContent = "👤";
      };

      areaFoto.appendChild(imagem);
    } else {
      areaFoto.textContent = "👤";
    }

    const nome = document.createElement("strong");
    nome.textContent = item.nome;

    const codigo = document.createElement("small");
    codigo.textContent = item.codigo;

    botao.append(areaFoto, nome, codigo);

    botao.addEventListener("click", () => {
      selecionarModelo(indice);
    });

    miniaturasModelos.appendChild(botao);
  });
}

function selecionarModelo(indice) {
  if (modelos.length === 0) return;

  indiceModelo =
    (indice + modelos.length) % modelos.length;

  renderizarModelo();
}

modeloAnterior.addEventListener("click", () => {
  selecionarModelo(indiceModelo - 1);
});

modeloProximo.addEventListener("click", () => {
  selecionarModelo(indiceModelo + 1);
});

// ======================================================
// PRÉVIAS DAS FOTOGRAFIAS ENVIADAS
// ======================================================

function configurarPreview(idInput, idImagem) {
  const input = elemento(idInput);
  const imagem = elemento(idImagem);

  input.addEventListener("change", () => {
    invalidarPreparacao();

    const anterior = urlsTemporarias.get(idInput);

    if (anterior) {
      URL.revokeObjectURL(anterior);
      urlsTemporarias.delete(idInput);
    }

    imagem.hidden = true;
    imagem.removeAttribute("src");

    const arquivo = input.files[0];

    if (!arquivo) return;

    try {
      validarArquivo(arquivo);

      const url = URL.createObjectURL(arquivo);

      urlsTemporarias.set(idInput, url);

      imagem.src = url;
      imagem.hidden = false;

      mostrarStatus(
        "Fotografia carregada para conferência."
      );

    } catch (erro) {
      input.value = "";
      mostrarStatus(erro.message, true);
    }
  });
}

previews.forEach(([input, imagem]) => {
  configurarPreview(input, imagem);
});

// ======================================================
// PALETA DE CORES
// ======================================================

function obterLinhasCores() {
  return Array.from(
    listaCores.querySelectorAll(".gf-color-row")
  );
}

function adicionarCor(
  nome = "",
  hex = "#D6B5C3",
  posicao = ""
) {
  if (obterLinhasCores().length >= MAX_CORES) {
    mostrarStatus(
      `O limite é de ${MAX_CORES} cores.`,
      true
    );
    return;
  }

  const linha = document.createElement("div");
  linha.className = "gf-color-row";

  linha.innerHTML = `
    <label>
      Paleta
      <input
        type="color"
        class="cor-paleta"
        aria-label="Selecionar tonalidade"
      >
    </label>

    <label>
      Nome da cor
      <input
        type="text"
        class="cor-nome"
        maxlength="60"
        placeholder="Ex.: Rosa-bebê"
        required
      >
    </label>

    <label>
      Código HEX
      <input
        type="text"
        class="cor-hex"
        maxlength="7"
        placeholder="#D6B5C3"
        spellcheck="false"
      >
    </label>

    <label class="gf-position">
      Posição na foto (opcional)
      <input
        type="text"
        class="cor-posicao"
        maxlength="120"
        placeholder="Ex.: 1º conjunto da esquerda"
      >
    </label>

    <button
      type="button"
      class="gf-remove-color"
    >
      Remover
    </button>
  `;

  const paleta =
    linha.querySelector(".cor-paleta");

  const campoNome =
    linha.querySelector(".cor-nome");

  const campoHex =
    linha.querySelector(".cor-hex");

  const campoPosicao =
    linha.querySelector(".cor-posicao");

  paleta.value = hex;
  campoNome.value = nome;
  campoHex.value = hex.toUpperCase();
  campoPosicao.value = posicao;

  paleta.addEventListener("input", () => {
    campoHex.value = paleta.value.toUpperCase();
    atualizarPrevisao();
  });

  campoHex.addEventListener("input", () => {
    const codigo = campoHex.value.trim();

    if (/^#[0-9a-fA-F]{6}$/.test(codigo)) {
      paleta.value = codigo;
    }

    atualizarPrevisao();
  });

  campoNome.addEventListener(
    "input",
    atualizarPrevisao
  );

  campoPosicao.addEventListener(
    "input",
    atualizarPrevisao
  );

  linha
    .querySelector(".gf-remove-color")
    .addEventListener("click", () => {
      if (obterLinhasCores().length <= 1) return;

      linha.remove();
      atualizarPrevisao();
    });

  listaCores.appendChild(linha);

  atualizarPrevisao();
}

function coletarCores(validar = false) {
  const cores = obterLinhasCores().map((linha) => {
    const nome = linha
      .querySelector(".cor-nome")
      .value.trim();

    const hex = linha
      .querySelector(".cor-hex")
      .value.trim()
      .toUpperCase();

    const posicao = linha
      .querySelector(".cor-posicao")
      .value.trim();

    if (validar) {
      if (!nome) {
        throw new Error(
          "Informe o nome de todas as cores."
        );
      }

      if (!/^#[0-9A-F]{6}$/.test(hex)) {
        throw new Error(
          `Código HEX inválido para ${nome}.`
        );
      }
    }

    return { nome, hex, posicao };
  });

  if (validar) {
    const nomes = cores.map(
      (cor) => cor.nome.toLocaleLowerCase("pt-BR")
    );

    if (new Set(nomes).size !== nomes.length) {
      throw new Error(
        "Existem nomes de cores repetidos."
      );
    }
  }

  return cores;
}

// ======================================================
// SAÍDAS E PRÉVIA
// ======================================================

function obterSaidas() {
  return Array.from(
    document.querySelectorAll(
      'input[name="saida"]:checked'
    )
  ).map((input) => input.value);
}

function atualizarPrevisao() {
  invalidarPreparacao();

  const cores = coletarCores();
  const saidas = obterSaidas();

  const quantidade = cores.length * saidas.length;

  totalCores.textContent = cores.length;
  totalAngulos.textContent = saidas.length;
  totalImagens.textContent = quantidade;

  resultadosPrevistos.replaceChildren();

  if (quantidade === 0) {
    const aviso = document.createElement("p");
    aviso.className = "gf-note";

    aviso.textContent =
      "Selecione pelo menos um tipo de fotografia.";

    resultadosPrevistos.appendChild(aviso);
  }

  for (const cor of cores) {
    for (const saida of saidas) {
      const card = document.createElement("div");
      card.className = "gf-result-card";

      const amostra = document.createElement("div");
      amostra.className = "gf-result-swatch";

      if (/^#[0-9a-fA-F]{6}$/.test(cor.hex)) {
        amostra.style.backgroundColor = cor.hex;
      }

      const titulo = document.createElement("strong");

      titulo.textContent =
        `${cor.nome || "Cor sem nome"} — ${saida.toUpperCase()}`;

      const descricao = document.createElement("small");

      descricao.textContent =
        "Imagem ainda não gerada";

      card.append(
        amostra,
        titulo,
        descricao
      );

      resultadosPrevistos.appendChild(card);
    }
  }

  obterLinhasCores().forEach((linha) => {
    linha.querySelector(".gf-remove-color").disabled =
      cores.length === 1;
  });

  btnAdicionarCor.disabled =
    cores.length >= MAX_CORES;
}

document
  .querySelectorAll('input[name="saida"]')
  .forEach((checkbox) => {
    checkbox.addEventListener(
      "change",
      atualizarPrevisao
    );
  });

btnAdicionarCor.addEventListener("click", () => {
  adicionarCor();
});

// ======================================================
// COLETAR CONFIGURAÇÃO
// ======================================================

function obterConfiguracao() {
  const frente = obterArquivo("fotoFrente");
  const costas = obterArquivo("fotoCostas");
  const colecao = obterArquivo("fotoColecao");

  const fotoModeloExtra = obterArquivo("fotoModelo");
  const detalheFoto = obterArquivo("fotoDetalhe");

  [
    frente,
    costas,
    colecao,
    fotoModeloExtra,
    detalheFoto
  ].filter(Boolean).forEach(validarArquivo);

  if (!frente && !costas && !colecao) {
    throw new Error(
      "Envie pelo menos uma fotografia real do produto."
    );
  }

  const modelo = obterModeloSelecionado();

  if (!modelo) {
    throw new Error(
      "Selecione uma modelo feminina."
    );
  }

  if (
    !fotoPrincipalCarregada &&
    !fotoModeloExtra
  ) {
    throw new Error(
      "Esta modelo não possui uma foto principal " +
      "disponível. Envie uma foto adicional da modelo."
    );
  }

  const produto = elemento("produto").value.trim();

  if (!produto) {
    throw new Error(
      "Informe o nome do produto."
    );
  }

  const cores = coletarCores(true);
  const saidas = obterSaidas();

  if (saidas.length === 0) {
    throw new Error(
      "Selecione pelo menos uma saída: " +
      "frente, costas, lado ou detalhes."
    );
  }

  return {
    produto,
    categoria: elemento("categoria").value,
    tecido: elemento("tecido").value,
    logo: elemento("logo").value,
    detalhes: elemento("detalhes").value.trim(),

    modelo: {
      id: modelo.id,
      codigo: modelo.codigo,
      nome: modelo.nome,
      fotoPrincipal:
        fotoPrincipalCarregada
          ? modelo.fotoPrincipal
          : null,
      origem: modelosVindosDoBanco
        ? "postgresql"
        : "prévia-local"
    },

    cores,
    saidas,
    quantidade: cores.length * saidas.length,

    referencias: {
      frente: frente?.name || null,
      costas: costas?.name || null,
      colecao: colecao?.name || null,
      modeloAdicional:
        fotoModeloExtra?.name || null,
      detalhe: detalheFoto?.name || null
    }
  };
}

// ======================================================
// AVISOS DE FIDELIDADE
// ======================================================

function criarAvisos(config) {
  const avisos = [];

  if (
    config.saidas.includes("frente") &&
    !config.referencias.frente
  ) {
    avisos.push(
      "A frente não tem uma foto específica. " +
      "Verifique se aparece nas outras referências."
    );
  }

  if (
    config.saidas.includes("costas") &&
    !config.referencias.costas
  ) {
    avisos.push(
      "Sem referência traseira: os detalhes " +
      "das costas não podem ser garantidos."
    );
  }

  if (
    config.saidas.includes("detalhes") &&
    !config.referencias.detalhe
  ) {
    avisos.push(
      "Sem close do tecido: conferir textura, " +
      "costuras e logotipo."
    );
  }

  if (
    config.cores.length > 1 &&
    config.referencias.colecao &&
    config.cores.some((cor) => !cor.posicao)
  ) {
    avisos.push(
      "Informe a posição de cada cor na foto " +
      "da coleção para evitar misturar conjuntos."
    );
  }

  if (!modelosVindosDoBanco) {
    avisos.push(
      "O carrossel está em modo local. " +
      "Confirme a conexão com o PostgreSQL."
    );
  }

  return avisos;
}

// ======================================================
// PREPARAR PROMPT
// ======================================================

function prepararPrompt(config, avisos) {
  const cores = config.cores.map((cor) => {
    const posicao = cor.posicao
      ? ` | posição: ${cor.posicao}`
      : "";

    return `- ${cor.nome} | ${cor.hex}${posicao}`;
  }).join("\n");

  return `
GOLD FIT — PREPARAÇÃO DE GERAÇÃO
Versão: GOLD-FIT-IMAGE-V1

PRODUTO:
${config.produto}

CATEGORIA:
${config.categoria}

TECIDO:
${config.tecido}

LOGOTIPO:
${config.logo}

MODELO SELECIONADA:
${config.modelo.nome} (${config.modelo.codigo})

ORIGEM DO CADASTRO:
${config.modelo.origem}

FOTO PRINCIPAL DA MODELO:
${config.modelo.fotoPrincipal || "Não disponível"}

CORES:
${cores}

SAÍDAS:
${config.saidas.join(", ")}

QUANTIDADE:
${config.quantidade} imagens

DETALHES DA ROUPA:
${config.detalhes || "Não informados"}

REGRAS DA FUTURA GERAÇÃO:

1. Utilizar a fotografia real do produto
   como referência principal do vestuário.
2. Utilizar a fotografia da modelo
   como referência de identidade visual.
3. Preservar tecido, recortes e caimento.
4. Preservar alças, decotes, cós e barras.
5. Não inventar bolsos, zíperes ou logos.
6. Separar corretamente cada conjunto por cor.
7. Utilizar a paleta apenas como especificação
   de tonalidade, sem substituir a foto real.
8. Gerar um arquivo por cor e saída selecionada.
9. Não produzir montagens sem solicitação.
10. Usar cenário de estúdio e pose natural.
11. Não presumir detalhes ocultos.
12. Exigir revisão humana antes de publicar.

REFERÊNCIAS:
${JSON.stringify(config.referencias, null, 2)}

AVISOS:
${avisos.length ? avisos.join("\n") : "Nenhum aviso adicional."}

STATUS:
Somente validação local.
Nenhuma imagem foi gerada ou publicada.
`.trim();
}

// ======================================================
// VALIDAR FORMULÁRIO
// ======================================================

formGerador.addEventListener("submit", (evento) => {
  evento.preventDefault();

  try {
    const configuracao = obterConfiguracao();

    const avisos = criarAvisos(configuracao);

    promptPreview.textContent =
      prepararPrompt(configuracao, avisos);

    resumoPreparacao.hidden = false;
    resumoPreparacao.open = true;

    let mensagem =
      `Preparação validada! Modelo: ` +
      `${configuracao.modelo.nome}. ` +
      `${configuracao.quantidade} imagem(ns), ` +
      `${configuracao.cores.length} cor(es) e ` +
      `${configuracao.saidas.length} tipo(s) de saída.`;

    if (avisos.length) {
      mensagem +=
        " Atenção: " + avisos.join(" ");
    }

    mensagem +=
      " Nenhuma fotografia foi gerada ou publicada.";

    mostrarStatus(mensagem);

  } catch (erro) {
    invalidarPreparacao();
    mostrarStatus(erro.message, true);
  }
});

// Modificações invalidam a última configuração.

[
  "produto",
  "categoria",
  "tecido",
  "logo",
  "detalhes"
].forEach((id) => {
  elemento(id).addEventListener(
    "input",
    invalidarPreparacao
  );
});

// ======================================================
// INICIALIZAÇÃO
// ======================================================

// Cor inicial apenas ilustrativa.
adicionarCor("", "#D6B5C3", "");

// Buscar modelos cadastradas no PostgreSQL.
carregarModelos();

// Liberar prévias de upload ao sair da página.
window.addEventListener("pagehide", () => {
  for (const url of urlsTemporarias.values()) {
    URL.revokeObjectURL(url);
  }
});
