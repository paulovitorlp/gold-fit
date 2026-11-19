
const parametros = new URLSearchParams(window.location.search);
const chaveProduto = parametros.get("produto");

let estoque = goldFitCarregarEstoque();
let configuracoesBanco = null;
let produto = null;
let corSelecionada = null;
let tamanhoSelecionado = null;
let quantidade = 1;
let favoritos = carregarFavoritos();
let galeriaFotosCor = new Map();
let fotosGaleria = [];
let bancoEstoqueConfirmado = false;
let carregandoEstoque = true;
const coresV11 = window.GoldFitGaleriaV11;

iniciarProduto();

async function iniciarProduto() {
    // O estoque persistido no PostgreSQL e consultado antes de exibir disponibilidade.
    await atualizarEstoqueDoBanco();
    localizarProduto();

    if (!produto) {
        window.location.href = "./index.html";
        return;
    }

    configurarEventos();
    preencherProduto();
    await carregarGaleriaPorCor();
    atualizarCarrinho();
    renderizarRelacionados();
}

async function atualizarEstoqueDoBanco() {
    try {
        const resposta = await fetch("/api/loja/estado?visao=publica", { credentials: "same-origin", cache: "no-store" });
        if (!resposta.ok) throw new Error("Estoque indisponível");
        const dados = await resposta.json();
        if (!Array.isArray(dados.estoque) || !Array.isArray(dados.produtos)) {
            throw new Error("Publicacao ainda nao disponivel no PostgreSQL");
        }
        configuracoesBanco = dados.produtos;
        bancoEstoqueConfirmado = true;
        // Não reutilizar cores antigas do localStorage: a API pública só devolve
        // variações com fotos aprovadas da cor correspondente.
        estoque = dados.estoque.map(item => ({
            ...item, quantidade: Math.max(0, Number(item.quantidade) || 0)
        }));
    } catch (erro) {
        console.warn("Não foi possível confirmar o estoque no PostgreSQL:", erro.message);
    } finally {
        carregandoEstoque = false;
    }
}

function agruparProdutos() {
    return goldFitAgruparModelosVitrine(
        estoque,
        Array.isArray(configuracoesBanco) ? configuracoesBanco : goldFitCarregarProdutosSite()
    );
}

function localizarProduto() {
    produto = agruparProdutos().find(
        item => item.chave === chaveProduto
    );
}

function preencherProduto() {
    document.title = `${produto.produto} | Gold Fit`;

    document.getElementById("breadcrumbProduto").textContent =
        produto.produto;

    document.getElementById("produtoMarca").textContent =
        produto.marca;

    document.getElementById("produtoNome").textContent =
        produto.produto;

    document.getElementById("produtoPreco").textContent =
        goldFitFormatarPreco(produto.preco);

    document.getElementById("infoMarca").textContent =
        produto.marca;

    document.getElementById("infoCategoria").textContent =
        produto.categoria;

    document.getElementById("infoGrupo").textContent =
        produto.grupo;

    renderizarGaleria();
    renderizarCores();
    atualizarFavorito();
}

/* CONTROLE DE IMAGENS */

function adicionarFoto(lista, valor) {
    if (!valor) {
        return;
    }

    if (Array.isArray(valor)) {
        valor.forEach(item => adicionarFoto(lista, item));
        return;
    }

    if (typeof valor !== "string") {
        return;
    }

    const limpa = valor.trim();

    if (!limpa) {
        return;
    }

    if (!lista.includes(limpa)) {
        lista.push(limpa);
    }
}

function obterConfiguracaoProduto() {
    if (typeof goldFitCarregarProdutosSite !== "function") {
        return null;
    }

    try {
        const configuracoes = Array.isArray(configuracoesBanco)
            ? configuracoesBanco : goldFitCarregarProdutosSite();

        return configuracoes.find(config => {
            if (config.chave === produto.chave) {
                return true;
            }

            return (
                config.produto === produto.produto &&
                (!config.marca || config.marca === produto.marca)
            );
        }) || null;
    }
    catch (erro) {
        console.warn(
            "Não foi possível carregar a configuração visual do produto.",
            erro
        );

        return null;
    }
}

async function carregarGaleriaPorCor() {
    try {
        const resposta = await fetch(`/api/galeria-produtos?visao=publica&chave=${encodeURIComponent(produto.chave)}`, {
            cache: "no-store"
        });
        if (!resposta.ok) throw new Error("Galeria indisponível");
        const dados = await resposta.json();
        if (dados.status !== "ok") throw new Error(dados.mensagem || "Galeria indisponível");
        fotosGaleria = Array.isArray(dados.fotos) ? dados.fotos : [];
        galeriaFotosCor = new Map();
        for (const foto of fotosGaleria) {
            const chave = coresV11.chaveCor(foto.cor);
            if (!galeriaFotosCor.has(chave)) galeriaFotosCor.set(chave, []);
            galeriaFotosCor.get(chave).push(foto);
        }
        for (const itens of galeriaFotosCor.values()) itens.sort((a, b) => a.ordem - b.ordem);
        renderizarCores();
    } catch (erro) {
        console.warn("Galeria por cor indisponível:", erro.message);
        renderizarGaleria();
    }
}

function obterFotosProduto() {
    // Somente fotografias pertencentes à cor selecionada.
    const album = coresV11.fotosDaCor(fotosGaleria, corSelecionada);
    if (album.length) return album.map(foto => foto.url);

    // Se a cor ainda não tem álbum, NUNCA utilizar a foto cadastrada para outra cor.
    // O legado possui uma mesma foto principal atribuída a todas as variações.
    const coresEstoque = coresV11.coresParaExibir([], produto.variacoes, []);
    const corDaCapaAntiga = coresEstoque[0];
    if (coresEstoque.length > 1 && !coresV11.mesmaCor(corSelecionada, corDaCapaAntiga)) {
        return [goldFitPlaceholder(produto)];
    }
    if (fotosGaleria.length) return [goldFitPlaceholder(produto)];
    // Sem galeria publicada, nenhuma cor pode ser considerada fotografada.
    // A capa antiga fica apenas como legado, sem associacao falsa a outras cores.
    if (!corSelecionada) return [goldFitPlaceholder(produto)];

    const fotos = [];
    for (const variacao of produto.variacoes.filter(v => !corSelecionada || coresV11.mesmaCor(v.cor, corSelecionada))) {
        for (const campo of ["foto", "fotoPrincipal", "fotoSecundaria", "imagem", "url_imagem", "fotos", "imagens"]) {
            adicionarFoto(fotos, variacao[campo]);
        }
    }
    if (!fotos.length && (!corSelecionada || coresV11.mesmaCor(corSelecionada, corDaCapaAntiga))) {
        const config = obterConfiguracaoProduto();
        if (config) adicionarFoto(fotos, config.fotoPrincipal || config.foto);
    }
    return fotos.length ? fotos.slice(0, 4) : [goldFitPlaceholder(produto)];
}

function informarFotosDaCor() {
    const aviso = document.getElementById("avisoFotosCor");
    if (!aviso) return;
    const album = coresV11.fotosDaCor(fotosGaleria, corSelecionada);
    if (album.length) {
        aviso.textContent = `${album.length} foto(s) cadastrada(s) da cor ${corSelecionada}.`;
        aviso.classList.remove("gf11-sem-foto");
    } else {
        aviso.textContent = corSelecionada
            ? `A cor ${corSelecionada} ainda nao tem foto de modelo aprovada.`
            : "Imagem ilustrativa. Cadastre uma foto de modelo vestindo o produto para habilitar as cores e a compra.";
        aviso.classList.add("gf11-sem-foto");
    }
}

function definirImagemComFallback(elemento, src) {
    const fallback = goldFitPlaceholder(produto);

    elemento.onerror = () => {
        elemento.onerror = null;
        elemento.src = fallback;
    };

    elemento.src = src || fallback;
}


// Tenta harmonizar o painel com a cor das bordas da fotografia sem distorcer ou recomprimir a imagem.
function harmonizarFundoFoto(img) {
    if (!img) return;
    const alvo = document.getElementById("areaImagemPrincipal");
    if (!alvo) return;
    const analisar = () => {
        try {
            if (!img.naturalWidth || !img.naturalHeight) return;
            const canvas = document.createElement("canvas");
            canvas.width = 4; canvas.height = 4;
            const ctx = canvas.getContext("2d", {willReadFrequently:true});
            ctx.drawImage(img,0,0,4,4);
            const d = ctx.getImageData(0,0,4,4).data;
            const indices = [0,3,12,15].map(i=>i*4);
            const canais = [0,1,2].map(c=>Math.round(indices.reduce((s,i)=>s+d[i+c],0)/4));
            if (indices.some(i=>d[i+3]<245)) return; // transparente: usar fundo neutro
            const dist = Math.max(...canais)-Math.min(...canais);
            if (dist > 27) return; // fundo colorido, nao tentar imitar
            alvo.style.backgroundColor = `rgb(${canais.join(",")})`;
        } catch (_) { /* Imagem nao legivel por politicas de origem: manter fundo neutro */ }
    };
    if (img.complete) analisar(); else img.addEventListener("load", analisar, {once:true});
}

function renderizarGaleria() {
    const fotos = obterFotosProduto();
    const principal = document.getElementById("imagemPrincipal");

    definirImagemComFallback(principal, fotos[0]);
    harmonizarFundoFoto(principal);
    principal.alt = `${produto.produto} — cor ${corSelecionada || "não selecionada"}`;
    informarFotosDaCor();

    document.getElementById("miniaturasProduto").innerHTML = fotos
        .map((foto, index) => `
            <button
                type="button"
                class="thumbnail-button ${index === 0 ? "active" : ""}"
                data-foto="${index}"
            >
                <img
                    src="${goldFitEscapeHtml(foto)}"
                    alt="${goldFitEscapeHtml(produto.produto)}"
                    data-miniatura="${index}"
                >
            </button>
        `)
        .join("");

    document.querySelectorAll("[data-miniatura]").forEach(img => {
        img.addEventListener(
            "error",
            () => {
                img.src = goldFitPlaceholder(produto);
            },
            { once: true }
        );
    });

    document.querySelectorAll("[data-foto]").forEach(botao => {
        botao.addEventListener("click", () => {
            trocarFoto(Number(botao.dataset.foto));
        });
    });
}

function trocarFoto(indice) {
    const fotos = obterFotosProduto();
    const principal = document.getElementById("imagemPrincipal");

    definirImagemComFallback(principal, fotos[indice]);
    harmonizarFundoFoto(principal);

    document.querySelectorAll(".thumbnail-button").forEach(
        (botao, index) => {
            botao.classList.toggle(
                "active",
                index === indice
            );
        }
    );
}

/* COR E TAMANHO */

function obterVariacao(cor, tamanho) {
    return coresV11.variacao(produto.variacoes, cor, tamanho);
}

function corTemEstoque(cor) {
    return coresV11.quantidadeCor(produto.variacoes, cor) > 0;
}

function renderizarCores() {
    const opcoes = goldFitOpcoesProduto(produto.produto, produto.variacoes);
    // Cores com fotografias cadastradas aparecem mesmo sem saldo em estoque.
    const cores = coresV11.coresParaExibir(opcoes.cores, produto.variacoes, fotosGaleria)
        .filter(cor => coresV11.fotosDaCor(fotosGaleria, cor).length > 0);
    const container = document.getElementById("coresProduto");
    if (!cores.length) {
        corSelecionada = null;
        tamanhoSelecionado = null;
        container.innerHTML = "";
        document.getElementById("corAtual").textContent = "Fotos em preparação";
        renderizarGaleria();
        renderizarTamanhos();
        return;
    }
    container.innerHTML = cores.map(cor => {
        const emEstoque = corTemEstoque(cor);
        const temFoto = coresV11.fotosDaCor(fotosGaleria, cor).length > 0;
        return `
            <button type="button"
                class="product-option-button ${temFoto ? (emEstoque ? "" : "gf11-cor-esgotada") : "unavailable gf14-cor-sem-foto"}"
                data-cor="${goldFitEscapeHtml(cor)}"
                title="${temFoto ? (emEstoque ? "Fotos publicadas; disponível" : "Fotos publicadas; esgotado") : "Sem fotografia cadastrada para esta cor"}"
                aria-label="Cor ${goldFitEscapeHtml(cor)}${temFoto ? (emEstoque ? "" : ", esgotada") : ", sem fotos disponíveis"}"
                ${temFoto ? "" : "disabled"}>
                ${goldFitEscapeHtml(cor)}
            </button>`;
    }).join("");
    container.querySelectorAll("[data-cor]").forEach(botao => {
        botao.addEventListener("click", () => selecionarCor(botao.dataset.cor));
    });
    const solicitada = new URLSearchParams(window.location.search).get("cor");
    const anterior = cores.find(cor => coresV11.mesmaCor(cor, corSelecionada));
    const corLink = cores.find(cor => coresV11.mesmaCor(cor, solicitada));
    const temGaleria = cor => coresV11.fotosDaCor(fotosGaleria, cor).length > 0;
    const primeira = cores.find(cor => temGaleria(cor) && corTemEstoque(cor)) || cores.find(temGaleria);
    // Link ?cor tem prioridade; sem cor no link, respeita a capa definida no painel.
    const capaConfigurada = obterConfiguracaoProduto()?.corCapa;
    const corCapa = cores.find(cor => coresV11.mesmaCor(cor, capaConfigurada));
    const selecionada = (corLink && temGaleria(corLink) ? corLink : null)
        || (anterior && temGaleria(anterior) ? anterior : null)
        || (corCapa && temGaleria(corCapa) ? corCapa : null)
        || primeira;
    if (selecionada) selecionarCor(selecionada);
}

function selecionarCor(cor) {
    if (!coresV11.fotosDaCor(fotosGaleria, cor).length) return;
    corSelecionada = cor;
    tamanhoSelecionado = null;
    quantidade = 1;

    document.getElementById("quantidadeProduto").textContent =
        quantidade;

    document.getElementById("corAtual").textContent =
        corSelecionada;

    document.querySelectorAll("[data-cor]").forEach(botao => {
        botao.classList.toggle(
            "active",
            botao.dataset.cor === corSelecionada
        );
    });

    renderizarGaleria();
    renderizarTamanhos();
    // A cor pode ser compartilhada por link sem interferir na disponibilidade.
    try {
        const endereco = new URL(window.location.href);
        endereco.searchParams.set("cor", cor);
        history.replaceState(null, "", endereco.pathname + endereco.search + endereco.hash);
    } catch (_) { /* compatibilidade com testes locais */ }
}

function renderizarTamanhos() {
    const opcoes = goldFitOpcoesProduto(
        produto.produto,
        produto.variacoes
    );

    const container = document.getElementById("tamanhosProduto");
    if (!corSelecionada) {
        container.innerHTML = "";
        document.getElementById("tamanhoAtual").textContent = "Aguardando fotos";
        atualizarStatus();
        return;
    }

    container.innerHTML = opcoes.tamanhos.map(tamanho => {
        const variacao = obterVariacao(
            corSelecionada,
            tamanho
        );

        const disponivel =
            bancoEstoqueConfirmado && variacao &&
            Number(variacao.quantidade) > 0;

        return `
            <button
                type="button"
                class="product-option-button ${
                    disponivel ? "" : "unavailable"
                }"
                data-tamanho="${goldFitEscapeHtml(tamanho)}"
                ${disponivel ? "" : "disabled"}
            >
                ${goldFitEscapeHtml(tamanho)}
            </button>
        `;
    }).join("");

    container
        .querySelectorAll("[data-tamanho]:not(:disabled)")
        .forEach(botao => {
            botao.addEventListener("click", () => {
                selecionarTamanho(botao.dataset.tamanho);
            });
        });

    const primeiraDisponivel = opcoes.tamanhos.find(tamanho => {
        const variacao = obterVariacao(
            corSelecionada,
            tamanho
        );

        return (
            bancoEstoqueConfirmado && variacao &&
            Number(variacao.quantidade) > 0
        );
    });

    if (primeiraDisponivel) {
        selecionarTamanho(primeiraDisponivel);
    }
    else {
        document.getElementById("tamanhoAtual").textContent =
            "Nenhum disponível";

        atualizarStatus();
    }
}

function selecionarTamanho(tamanho) {
    tamanhoSelecionado = tamanho;
    quantidade = 1;

    document.getElementById("quantidadeProduto").textContent =
        quantidade;

    document.getElementById("tamanhoAtual").textContent =
        tamanhoSelecionado;

    document.querySelectorAll("[data-tamanho]").forEach(botao => {
        botao.classList.toggle(
            "active",
            botao.dataset.tamanho === tamanhoSelecionado
        );
    });

    atualizarStatus();
}

function variacaoAtual() {
    return obterVariacao(
        corSelecionada,
        tamanhoSelecionado
    );
}

/* DISPONIBILIDADE */

function atualizarStatus() {
    const variacao = variacaoAtual();

    const disponivel =
        bancoEstoqueConfirmado && variacao &&
        Number(variacao.quantidade) > 0;

    const status = document.getElementById("statusEstoque");

    status.textContent = !bancoEstoqueConfirmado
        ? "Estoque ainda não confirmado. Consulte a loja."
        : !corSelecionada
            ? "Produto publicado para demonstração. Fotos em preparação; compra indisponível até cadastrar foto de modelo para a cor."
            : disponivel
                ? `Disponível • ${variacao.quantidade} unidade(s)`
                : `Cor ${corSelecionada} sem estoque no tamanho escolhido.`;

    status.classList.toggle("out", !disponivel);

    document.getElementById("btnAdicionar").disabled =
        !disponivel;

    document.getElementById("btnComprarAgora").disabled =
        !disponivel;
}

/* QUANTIDADE */

function aumentarQuantidade() {
    const variacao = variacaoAtual();

    if (!variacao) {
        return;
    }

    if (quantidade < Number(variacao.quantidade)) {
        quantidade++;
        atualizarQuantidade();
    }
    else {
        mostrarToast(
            "Quantidade máxima disponível atingida."
        );
    }
}

function diminuirQuantidade() {
    if (quantidade > 1) {
        quantidade--;
        atualizarQuantidade();
    }
}

function atualizarQuantidade() {
    document.getElementById("quantidadeProduto").textContent =
        quantidade;
}

/* CARRINHO */

function obterFotoCarrinho(variacao) {
    return (
        obterFotosProduto()[0] ||
        variacao.foto ||
        variacao.fotoPrincipal ||
        variacao.imagem ||
        variacao.url_imagem ||
        goldFitPlaceholder(produto)
    );
}

function adicionarCarrinho() {
    const variacao = variacaoAtual();

    if (
        !bancoEstoqueConfirmado ||
        !variacao ||
        Number(variacao.quantidade) <= 0
    ) {
        mostrarToast("Selecione uma opção disponível.");
        return false;
    }

    const carrinho = goldFitCarregarCarrinho();

    const existente = carrinho.find(
        item => item.sku === variacao.sku
    );

    if (existente) {
        const novaQuantidade =
            Number(existente.quantidade) +
            quantidade;

        if (novaQuantidade > Number(variacao.quantidade)) {
            mostrarToast(
                "Quantidade maior que o estoque disponível."
            );

            return false;
        }

        existente.quantidade = novaQuantidade;

        existente.estoqueDisponivel =
            Number(variacao.quantidade);
    }
    else {
        carrinho.push({
            sku: variacao.sku,
            produto: produto.produto,
            marca: produto.marca,
            grupo: produto.grupo,
            categoria: produto.categoria,
            cor: variacao.cor,
            tamanho: variacao.tamanho,
            preco: produto.preco,
            quantidade,
            estoqueDisponivel: Number(variacao.quantidade),
            foto: obterFotoCarrinho(variacao)
        });
    }

    goldFitSalvarCarrinho(carrinho);
    atualizarCarrinho();

    return true;
}

function atualizarCarrinho() {
    document.getElementById(
        "contadorCarrinhoProduto"
    ).textContent = goldFitQuantidadeCarrinho();
}

/* FAVORITOS */

function carregarFavoritos() {
    try {
        return JSON.parse(
            localStorage.getItem(GOLD_FIT_FAVORITES_KEY)
        ) || [];
    }
    catch {
        return [];
    }
}

function atualizarFavorito() {
    const botao = document.getElementById(
        "btnFavoritarProduto"
    );

    const favoritado = favoritos.includes(produto.chave);

    botao.textContent = favoritado ? "♥" : "♡";

    botao.classList.toggle(
        "active",
        favoritado
    );
}

function alternarFavorito() {
    const indice = favoritos.indexOf(produto.chave);

    if (indice >= 0) {
        favoritos.splice(indice, 1);
    }
    else {
        favoritos.push(produto.chave);
    }

    localStorage.setItem(
        GOLD_FIT_FAVORITES_KEY,
        JSON.stringify(favoritos)
    );

    atualizarFavorito();

    mostrarToast(
        indice >= 0
            ? "Produto removido dos favoritos."
            : "Produto adicionado aos favoritos."
    );
}

/* PRODUTOS RELACIONADOS */

function obterFotoProdutoRelacionado(item) {
    const primeira = item.variacoes[0] || {};

    return (
        primeira.foto ||
        primeira.fotoPrincipal ||
        primeira.imagem ||
        primeira.url_imagem ||
        goldFitPlaceholder(item)
    );
}

function renderizarRelacionados() {
    const produtos = agruparProdutos().filter(
        item => item.chave !== produto.chave
    );

    let relacionados = produtos.filter(
        item => item.grupo === produto.grupo
    );

    if (relacionados.length < 4) {
        relacionados = produtos;
    }

    relacionados = relacionados.slice(0, 4);

    const container = document.getElementById(
        "produtosRelacionados"
    );

    container.innerHTML = relacionados.map(item => {
        const foto = obterFotoProdutoRelacionado(item);

        return `
            <article
                class="related-card"
                data-related="${encodeURIComponent(item.chave)}"
            >
                <div class="related-image">
                    <img
                        src="${goldFitEscapeHtml(foto)}"
                        alt="${goldFitEscapeHtml(item.produto)}"
                        onerror="this.onerror=null;this.src='${goldFitEscapeHtml(goldFitPlaceholder(item))}'"
                    >
                </div>

                <span>
                    ${goldFitEscapeHtml(item.marca)}
                </span>

                <h3>
                    ${goldFitEscapeHtml(item.produto)}
                </h3>

                <strong>
                    ${goldFitFormatarPreco(item.preco)}
                </strong>
            </article>
        `;
    }).join("");

    container
        .querySelectorAll("[data-related]")
        .forEach(card => {
            card.addEventListener("click", () => {
                const chave = decodeURIComponent(
                    card.dataset.related
                );

                window.location.href =
                    `./produto.html?produto=${encodeURIComponent(chave)}`;
            });
        });
}

/* ZOOM */

function abrirZoom() {
    const src = document.getElementById(
        "imagemPrincipal"
    ).src;

    document.getElementById("imagemZoom").src = src;

    document.getElementById("zoomModal")
        .classList.remove("hidden");

    document.body.style.overflow = "hidden";
}

function fecharZoom() {
    document.getElementById("zoomModal")
        .classList.add("hidden");

    document.body.style.overflow = "";
}

/* EVENTOS */

function configurarEventos() {
    document.getElementById("btnAumentar")
        .addEventListener("click", aumentarQuantidade);

    document.getElementById("btnDiminuir")
        .addEventListener("click", diminuirQuantidade);

    document.getElementById("btnAdicionar")
        .addEventListener("click", () => {
            if (adicionarCarrinho()) {
                mostrarToast("Produto adicionado à sacola.");
            }
        });

    document.getElementById("btnComprarAgora")
        .addEventListener("click", () => {
            if (adicionarCarrinho()) {
                window.location.href = "./carrinho.html";
            }
        });

    document.getElementById("btnFavoritarProduto")
        .addEventListener("click", alternarFavorito);

    document.getElementById("btnCarrinhoProduto")
        .addEventListener("click", () => {
            window.location.href = "./carrinho.html";
        });

    document.getElementById("btnContaProduto")
        .addEventListener("click", () => {
            const sessao = goldFitCarregarSessao();

            window.location.href =
                sessao && sessao.perfil === "admin"
                    ? "./admin/estoque.html"
                    : "./login.html";
        });

    document.getElementById("btnGuiaMedidas")
        .addEventListener("click", () => {
            mostrarToast(
                "Guia de medidas será adicionado posteriormente."
            );
        });

    document.getElementById("btnCalcularCep")
        .addEventListener("click", () => {
            const cep = document
                .getElementById("campoCep")
                .value
                .replace(/\D/g, "");

            mostrarToast(
                cep.length === 8
                    ? "Frete real será integrado posteriormente."
                    : "Informe um CEP válido."
            );
        });

    document.getElementById("btnZoom")
        .addEventListener("click", abrirZoom);

    document.getElementById("areaImagemPrincipal")
        .addEventListener("dblclick", abrirZoom);

    document.getElementById("btnFecharZoom")
        .addEventListener("click", fecharZoom);

    document.getElementById("zoomModal")
        .addEventListener("click", event => {
            if (
                event.target.id === "zoomModal" ||
                event.target.id === "imagemZoom"
            ) {
                fecharZoom();
            }
        });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            fecharZoom();
        }
    });
}

/* NOTIFICAÇÕES */

let toastTimer;

function mostrarToast(mensagem) {
    const toast = document.getElementById("toastProduto");

    clearTimeout(toastTimer);

    toast.textContent = mensagem;
    toast.classList.add("show");

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}
