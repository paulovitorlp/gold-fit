
const parametros = new URLSearchParams(window.location.search);
const chaveProduto = parametros.get("produto");

let estoque = goldFitCarregarEstoque();
let produto = null;
let corSelecionada = null;
let tamanhoSelecionado = null;
let quantidade = 1;
let favoritos = carregarFavoritos();

iniciarProduto();

function iniciarProduto() {
    localizarProduto();

    if (!produto) {
        window.location.href = "./index.html";
        return;
    }

    configurarEventos();
    preencherProduto();
    atualizarCarrinho();
    renderizarRelacionados();
}

function agruparProdutos() {
    const mapa = new Map();

    estoque.forEach(item => {
        const chave = `${item.produto}|${item.marca}`;

        if (!mapa.has(chave)) {
            mapa.set(chave, {
                chave,
                produto: item.produto,
                marca: item.marca,
                grupo: item.grupo,
                categoria: item.categoria,
                preco: Number(
                    item.preco ||
                    goldFitPrecoProduto(item.produto) ||
                    0
                ),
                variacoes: []
            });
        }

        mapa.get(chave).variacoes.push(item);
    });

    return Array.from(mapa.values());
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
        const configuracoes = goldFitCarregarProdutosSite();

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

function obterFotosProduto() {
    const fotos = [];

    produto.variacoes.forEach(variacao => {
        adicionarFoto(fotos, variacao.foto);
        adicionarFoto(fotos, variacao.fotoPrincipal);
        adicionarFoto(fotos, variacao.fotoSecundaria);
        adicionarFoto(fotos, variacao.imagem);
        adicionarFoto(fotos, variacao.url_imagem);
        adicionarFoto(fotos, variacao.fotos);
        adicionarFoto(fotos, variacao.imagens);
    });

    const configuracao = obterConfiguracaoProduto();

    if (configuracao) {
        adicionarFoto(fotos, configuracao.fotoPrincipal);
        adicionarFoto(fotos, configuracao.fotoSecundaria);
        adicionarFoto(fotos, configuracao.fotoHover);
        adicionarFoto(fotos, configuracao.foto);
        adicionarFoto(fotos, configuracao.fotos);
        adicionarFoto(fotos, configuracao.imagens);
    }

    return fotos.length
        ? fotos
        : [goldFitPlaceholder(produto)];
}

function definirImagemComFallback(elemento, src) {
    const fallback = goldFitPlaceholder(produto);

    elemento.onerror = () => {
        elemento.onerror = null;
        elemento.src = fallback;
    };

    elemento.src = src || fallback;
}

function renderizarGaleria() {
    const fotos = obterFotosProduto();
    const principal = document.getElementById("imagemPrincipal");

    definirImagemComFallback(principal, fotos[0]);
    principal.alt = produto.produto;

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
    return produto.variacoes.find(
        item =>
            item.cor === cor &&
            item.tamanho === tamanho
    ) || null;
}

function corTemEstoque(cor) {
    return produto.variacoes.some(
        item =>
            item.cor === cor &&
            Number(item.quantidade) > 0
    );
}

function renderizarCores() {
    const opcoes = goldFitOpcoesProduto(
        produto.produto,
        produto.variacoes
    );

    const container = document.getElementById("coresProduto");

    container.innerHTML = opcoes.cores.map(cor => {
        const disponivel = corTemEstoque(cor);

        return `
            <button
                type="button"
                class="product-option-button ${
                    disponivel ? "" : "color-unavailable"
                }"
                data-cor="${goldFitEscapeHtml(cor)}"
            >
                ${goldFitEscapeHtml(cor)}
            </button>
        `;
    }).join("");

    container.querySelectorAll("[data-cor]").forEach(botao => {
        botao.addEventListener("click", () => {
            selecionarCor(botao.dataset.cor);
        });
    });

    const primeiraDisponivel =
        opcoes.cores.find(corTemEstoque) ||
        opcoes.cores[0];

    if (primeiraDisponivel) {
        selecionarCor(primeiraDisponivel);
    }
}

function selecionarCor(cor) {
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

    const variacaoComFoto = produto.variacoes.find(item => {
        if (item.cor !== corSelecionada) {
            return false;
        }

        return Boolean(
            item.foto ||
            item.fotoPrincipal ||
            item.imagem ||
            item.url_imagem
        );
    });

    if (variacaoComFoto) {
        const foto =
            variacaoComFoto.foto ||
            variacaoComFoto.fotoPrincipal ||
            variacaoComFoto.imagem ||
            variacaoComFoto.url_imagem;

        definirImagemComFallback(
            document.getElementById("imagemPrincipal"),
            foto
        );
    }

    renderizarTamanhos();
}

function renderizarTamanhos() {
    const opcoes = goldFitOpcoesProduto(
        produto.produto,
        produto.variacoes
    );

    const container = document.getElementById("tamanhosProduto");

    container.innerHTML = opcoes.tamanhos.map(tamanho => {
        const variacao = obterVariacao(
            corSelecionada,
            tamanho
        );

        const disponivel =
            variacao &&
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
            variacao &&
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
        variacao &&
        Number(variacao.quantidade) > 0;

    const status = document.getElementById("statusEstoque");

    status.textContent = disponivel
        ? `Disponível • ${variacao.quantidade} unidade(s)`
        : "Combinação indisponível";

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
        variacao.foto ||
        variacao.fotoPrincipal ||
        variacao.imagem ||
        variacao.url_imagem ||
        obterFotosProduto()[0] ||
        goldFitPlaceholder(produto)
    );
}

function adicionarCarrinho() {
    const variacao = variacaoAtual();

    if (
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

    document.getElementById("btnAvaliarProduto")
        .addEventListener("click", () => {
            const sessao = goldFitCarregarSessao();

            if (!sessao) {
                window.location.href =
                    `./login.html?next=${encodeURIComponent(window.location.href)}`;

                return;
            }

            mostrarToast(
                "Módulo de avaliações será conectado ao banco posteriormente."
            );
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
