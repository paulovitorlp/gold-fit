let estoque =
    goldFitCarregarEstoque();


let favoritos =
    carregarFavoritosCatalogo();


const params =
    new URLSearchParams(
        window.location.search
    );


const filtroGrupo =
    params.get(
        "grupo"
    );


const filtroCategoria =
    params.get(
        "categoria"
    );


const filtroProduto =
    params.get(
        "produto"
    );


const buscaInicial =
    params.get(
        "busca"
    )
    ||
    "";


const catalogProducts =
    document.getElementById(
        "catalogProducts"
    );


const catalogEmpty =
    document.getElementById(
        "catalogEmpty"
    );


const catalogSearch =
    document.getElementById(
        "catalogSearch"
    );


const catalogSort =
    document.getElementById(
        "catalogSort"
    );


const toastCatalogo =
    document.getElementById(
        "toastCatalogo"
    );


// ======================================================
// INICIAR
// ======================================================

iniciarCatalogo();


function iniciarCatalogo() {

    catalogSearch.value =
        buscaInicial;


    document
        .getElementById(
            "pesquisaTopoCatalogo"
        )
        .value =
        buscaInicial;


    configurarEventosCatalogo();


    renderizarMenusCatalogo();


    renderizarCabecalhoCatalogo();


    renderizarFiltrosAtivos();


    renderizarFiltrosRapidos();


    renderizarCatalogo();


    atualizarContaCatalogo();


    atualizarCarrinhoCatalogo();

}


// ======================================================
// EVENTOS
// ======================================================

function configurarEventosCatalogo() {


    document
        .getElementById(
            "btnMenu"
        )
        .addEventListener(
            "click",
            function () {

                document
                    .getElementById(
                        "mainNav"
                    )
                    .classList
                    .toggle(
                        "open"
                    );

            }
        );


    document
        .querySelectorAll(
            "[data-menu-toggle]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    function () {

                        if (
                            window.innerWidth >
                            780
                        ) {

                            return;

                        }


                        alternarMenuMobile(
                            botao.dataset.menuToggle
                        );

                    }
                );

            }
        );


    document
        .getElementById(
            "btnContaCatalogo"
        )
        .addEventListener(
            "click",
            function () {

                window.location.href =
                    "./login.html";

            }
        );


    document
        .getElementById(
            "btnCarrinhoCatalogo"
        )
        .addEventListener(
            "click",
            function () {

                window.location.href =
                    "./carrinho.html";

            }
        );


    document
        .getElementById(
            "btnFavoritosCatalogo"
        )
        .addEventListener(
            "click",
            function () {

                mostrarToastCatalogo(

                    favoritos.length
                        ?
                        `${favoritos.length} produto(s) favoritado(s).`
                        :
                        "Você ainda não possui favoritos."

                );

            }
        );


    catalogSearch.addEventListener(
        "input",
        renderizarCatalogo
    );


    catalogSort.addEventListener(
        "change",
        renderizarCatalogo
    );


    document
        .getElementById(
            "pesquisaTopoCatalogo"
        )
        .addEventListener(
            "keydown",
            function (
                event
            ) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    realizarBuscaGlobal();

                }

            }
        );


    document
        .getElementById(
            "btnPesquisaCatalogo"
        )
        .addEventListener(
            "click",
            realizarBuscaGlobal
        );


    catalogProducts.addEventListener(
        "click",
        tratarCliqueCatalogo
    );


    window.addEventListener(
        "storage",
        function (
            event
        ) {

            if (
                event.key ===
                GOLD_FIT_STOCK_KEY
            ) {

                estoque =
                    goldFitCarregarEstoque();


                renderizarMenusCatalogo();


                renderizarFiltrosRapidos();


                renderizarCatalogo();

            }


            if (
                event.key ===
                GOLD_FIT_CART_KEY
            ) {

                atualizarCarrinhoCatalogo();

            }


            if (
                event.key ===
                GOLD_FIT_SESSION_KEY
            ) {

                atualizarContaCatalogo();

            }

        }
    );

}


// ======================================================
// AGRUPAMENTO
// ======================================================

function agruparProdutosCatalogo() {

    const mapa =
        new Map();


    estoque.forEach(
        item => {

            const chave =
                `${item.produto}|${item.marca}`;


            if (
                !mapa.has(
                    chave
                )
            ) {

                mapa.set(
                    chave,
                    {

                        chave:
                            chave,

                        produto:
                            item.produto,

                        marca:
                            item.marca,

                        grupo:
                            item.grupo,

                        categoria:
                            item.categoria,

                        preco:
                            Number(
                                item.preco
                                ||
                                goldFitPrecoProduto(
                                    item.produto
                                )
                                ||
                                0
                            ),

                        variacoes:
                            []

                    }
                );

            }


            mapa
                .get(
                    chave
                )
                .variacoes
                .push(
                    item
                );

        }
    );


    return Array.from(
        mapa.values()
    );

}


// ======================================================
// FILTRAGEM
// ======================================================

function obterProdutosFiltrados() {

    const busca =
        catalogSearch
            .value
            .trim()
            .toLowerCase();


    let produtos =
        agruparProdutosCatalogo()
            .filter(
                produto => {

                    const possuiEstoque =
                        produto.variacoes
                            .some(
                                item =>
                                    Number(
                                        item.quantidade
                                        ||
                                        0
                                    )
                                    >
                                    0
                            );


                    if (
                        !possuiEstoque
                    ) {

                        return false;

                    }


                    if (
                        filtroGrupo
                        &&
                        produto.grupo !==
                        filtroGrupo
                    ) {

                        return false;

                    }


                    if (
                        filtroCategoria
                        &&
                        produto.categoria !==
                        filtroCategoria
                    ) {

                        return false;

                    }


                    if (
                        filtroProduto
                        &&
                        produto.produto !==
                        filtroProduto
                    ) {

                        return false;

                    }


                    if (
                        busca
                    ) {

                        const texto =
                            `
                            ${produto.produto}
                            ${produto.marca}
                            ${produto.categoria}
                            ${produto.grupo}
                            `
                            .toLowerCase();


                        if (
                            !texto.includes(
                                busca
                            )
                        ) {

                            return false;

                        }

                    }


                    return true;

                }
            );


    const ordem =
        catalogSort.value;


    if (
        ordem ===
        "nome"
    ) {

        produtos.sort(
            (
                a,
                b
            ) =>
                a.produto.localeCompare(
                    b.produto,
                    "pt-BR"
                )
        );

    }


    if (
        ordem ===
        "menorPreco"
    ) {

        produtos.sort(
            (
                a,
                b
            ) =>
                Number(
                    a.preco
                )
                -
                Number(
                    b.preco
                )
        );

    }


    if (
        ordem ===
        "maiorPreco"
    ) {

        produtos.sort(
            (
                a,
                b
            ) =>
                Number(
                    b.preco
                )
                -
                Number(
                    a.preco
                )
        );

    }


    return produtos;

}


// ======================================================
// RENDER CATÁLOGO
// ======================================================

function renderizarCatalogo() {

    const produtos =
        obterProdutosFiltrados();


    document
        .getElementById(
            "catalogCount"
        )
        .textContent =
        produtos.length;


    if (
        produtos.length ===
        0
    ) {

        catalogProducts.innerHTML =
            "";


        catalogProducts.hidden =
            true;


        catalogEmpty.hidden =
            false;


        return;

    }


    catalogProducts.hidden =
        false;


    catalogEmpty.hidden =
        true;


    catalogProducts.innerHTML =
        produtos
            .map(
                criarCardCatalogo
            )
            .join("");

}


// ======================================================
// CARD
// ======================================================

function criarCardCatalogo(
    produto
) {

    const primeira =
        produto.variacoes[
            0
        ];


    const foto =

        primeira.foto

        ||

        goldFitPlaceholder(
            produto
        );


    const opcoes =
        goldFitOpcoesProduto(
            produto.produto,
            produto.variacoes
        );


    const favoritado =
        favoritos.includes(
            produto.chave
        );


    const quantidadeTotal =
        produto.variacoes
            .reduce(
                (
                    total,
                    item
                ) =>
                    total
                    +
                    Number(
                        item.quantidade
                        ||
                        0
                    ),
                0
            );


    return `

        <article class="product-card">

            <div class="product-image">

                <img
                    src="${foto}"
                    alt="${goldFitEscapeHtml(
                        produto.produto
                    )}"
                >


                <span class="stock-badge">
                    DISPONÍVEL
                </span>


                <button
                    type="button"
                    class="
                        favorite-button
                        ${
                            favoritado
                                ?
                                "active"
                                :
                                ""
                        }
                    "
                    data-favorito="${encodeURIComponent(
                        produto.chave
                    )}"
                >
                    ${
                        favoritado
                            ?
                            "♥"
                            :
                            "♡"
                    }
                </button>

            </div>


            <div class="product-info">

                <span class="product-brand">

                    ${goldFitEscapeHtml(
                        produto.marca
                    )}

                </span>


                <h3>

                    ${goldFitEscapeHtml(
                        produto.produto
                    )}

                </h3>


                <div class="product-meta">

                    ${opcoes.cores.length}

                    ${
                        opcoes.cores.length ===
                        1
                            ?
                            "cor"
                            :
                            "cores"
                    }

                    ·

                    ${opcoes.tamanhos.length}

                    ${
                        opcoes.tamanhos.length ===
                        1
                            ?
                            "tamanho"
                            :
                            "tamanhos"
                    }

                    ·

                    ${quantidadeTotal}
                    un.

                </div>


                <strong class="product-price">

                    ${goldFitFormatarPreco(
                        produto.preco
                    )}

                </strong>


                <button
                    type="button"
                    class="view-button"
                    data-produto="${encodeURIComponent(
                        produto.chave
                    )}"
                >
                    VER PRODUTO
                </button>

            </div>

        </article>

    `;

}


// ======================================================
// CLIQUES
// ======================================================

function tratarCliqueCatalogo(
    event
) {

    const produto =
        event.target.closest(
            "[data-produto]"
        );


    if (
        produto
    ) {

        const chave =
            decodeURIComponent(
                produto.dataset.produto
            );


        window.location.href =
            `./produto.html?produto=${
                encodeURIComponent(
                    chave
                )
            }`;


        return;

    }


    const favorito =
        event.target.closest(
            "[data-favorito]"
        );


    if (
        favorito
    ) {

        alternarFavoritoCatalogo(

            decodeURIComponent(
                favorito.dataset.favorito
            )

        );

    }

}


// ======================================================
// CABEÇALHO DA PÁGINA
// ======================================================

function renderizarCabecalhoCatalogo() {

    let titulo =
        "Todos os produtos";


    let descricao =
        "Explore os produtos disponíveis na Gold Fit.";


    if (
        filtroGrupo
    ) {

        titulo =
            filtroGrupo;


        descricao =
            `Produtos disponíveis no departamento ${filtroGrupo}.`;

    }


    if (
        filtroCategoria
    ) {

        titulo =
            filtroCategoria;


        descricao =
            `${filtroCategoria} disponíveis na Gold Fit.`;

    }


    if (
        filtroProduto
    ) {

        titulo =
            filtroProduto;


        descricao =
            "Confira as cores e tamanhos disponíveis deste modelo.";

    }


    if (
        buscaInicial
        &&
        !filtroProduto
    ) {

        titulo =
            `Resultados para "${buscaInicial}"`;


        descricao =
            "Produtos encontrados no estoque Gold Fit.";

    }


    document.title =
        `${titulo} | Gold Fit`;


    document
        .getElementById(
            "catalogTitle"
        )
        .textContent =
        titulo;


    document
        .getElementById(
            "catalogDescription"
        )
        .textContent =
        descricao;


    renderizarBreadcrumb();

}


// ======================================================
// BREADCRUMB
// ======================================================

function renderizarBreadcrumb() {

    const partes =
        [
            `
            <a href="./index.html">
                Início
            </a>
            `
        ];


    if (
        filtroGrupo
    ) {

        partes.push(
            `
            <span>/</span>

            <a
                href="${
                    criarUrlCatalogo(
                        {
                            grupo:
                                filtroGrupo
                        }
                    )
                }"
            >
                ${goldFitEscapeHtml(
                    filtroGrupo
                )}
            </a>
            `
        );

    }


    if (
        filtroCategoria
    ) {

        partes.push(
            `
            <span>/</span>

            <a
                href="${
                    criarUrlCatalogo(
                        {
                            grupo:
                                filtroGrupo,

                            categoria:
                                filtroCategoria
                        }
                    )
                }"
            >
                ${goldFitEscapeHtml(
                    filtroCategoria
                )}
            </a>
            `
        );

    }


    if (
        filtroProduto
    ) {

        partes.push(
            `
            <span>/</span>

            <strong>
                ${goldFitEscapeHtml(
                    filtroProduto
                )}
            </strong>
            `
        );

    }


    if (
        !filtroGrupo
        &&
        !filtroCategoria
        &&
        !filtroProduto
    ) {

        partes.push(
            `
            <span>/</span>

            <strong>
                Catálogo
            </strong>
            `
        );

    }


    document
        .getElementById(
            "catalogBreadcrumb"
        )
        .innerHTML =
        partes.join("");

}


// ======================================================
// FILTROS ATIVOS
// ======================================================

function renderizarFiltrosAtivos() {

    const container =
        document.getElementById(
            "activeFilters"
        );


    const filtros =
        [];


    if (
        filtroGrupo
    ) {

        filtros.push(
            `
            <span class="active-filter">
                ${goldFitEscapeHtml(
                    filtroGrupo
                )}
            </span>
            `
        );

    }


    if (
        filtroCategoria
    ) {

        filtros.push(
            `
            <span class="active-filter">
                ${goldFitEscapeHtml(
                    filtroCategoria
                )}
            </span>
            `
        );

    }


    if (
        filtroProduto
    ) {

        filtros.push(
            `
            <span class="active-filter">
                ${goldFitEscapeHtml(
                    filtroProduto
                )}
            </span>
            `
        );

    }


    if (
        buscaInicial
    ) {

        filtros.push(
            `
            <span class="active-filter">
                Busca: ${goldFitEscapeHtml(
                    buscaInicial
                )}
            </span>
            `
        );

    }


    if (
        filtros.length
    ) {

        filtros.push(
            `
            <a
                href="./catalogo.html"
                class="clear-filter"
            >
                Limpar filtros
            </a>
            `
        );

    }


    container.innerHTML =
        filtros.join("");

}


// ======================================================
// FILTROS RÁPIDOS
// ======================================================

function renderizarFiltrosRapidos() {

    const container =
        document.getElementById(
            "quickFilters"
        );


    const disponiveis =
        estoque.filter(
            item =>
                Number(
                    item.quantidade
                    ||
                    0
                )
                >
                0
        );


    let links =
        [];


    // Se estamos dentro de uma categoria,
    // mostra os modelos daquela categoria.

    if (
        filtroGrupo
        &&
        filtroCategoria
    ) {

        const produtos =
            [
                ...new Set(

                    disponiveis
                        .filter(
                            item =>
                                item.grupo ===
                                filtroGrupo

                                &&

                                item.categoria ===
                                filtroCategoria
                        )
                        .map(
                            item =>
                                item.produto
                        )

                )
            ];


        links =
            produtos.map(
                produto => {

                    return `

                        <a
                            href="${
                                criarUrlCatalogo(
                                    {
                                        grupo:
                                            filtroGrupo,

                                        categoria:
                                            filtroCategoria,

                                        produto:
                                            produto
                                    }
                                )
                            }"
                            class="
                                quick-filter-link
                                ${
                                    filtroProduto ===
                                    produto
                                        ?
                                        "active"
                                        :
                                        ""
                                }
                            "
                        >
                            ${goldFitEscapeHtml(
                                produto
                            )}
                        </a>

                    `;

                }
            );

    }

    // Se estamos apenas no grupo,
    // mostra as categorias disponíveis.

    else if (
        filtroGrupo
    ) {

        const categorias =
            [
                ...new Set(

                    disponiveis
                        .filter(
                            item =>
                                item.grupo ===
                                filtroGrupo
                        )
                        .map(
                            item =>
                                item.categoria
                        )

                )
            ];


        links =
            categorias.map(
                categoria => {

                    return `

                        <a
                            href="${
                                criarUrlCatalogo(
                                    {
                                        grupo:
                                            filtroGrupo,

                                        categoria:
                                            categoria
                                    }
                                )
                            }"
                            class="quick-filter-link"
                        >
                            ${goldFitEscapeHtml(
                                categoria
                            )}
                        </a>

                    `;

                }
            );

    }

    // Catálogo completo:
    // mostra os departamentos.

    else {

        [
            "Feminino",
            "Masculino",
            "Calçados",
            "Acessórios"
        ]
        .forEach(
            grupo => {

                if (
                    disponiveis.some(
                        item =>
                            item.grupo ===
                            grupo
                    )
                ) {

                    links.push(
                        `
                        <a
                            href="${
                                criarUrlCatalogo(
                                    {
                                        grupo:
                                            grupo
                                    }
                                )
                            }"
                            class="quick-filter-link"
                        >
                            ${goldFitEscapeHtml(
                                grupo
                            )}
                        </a>
                        `
                    );

                }

            }
        );

    }


    container.innerHTML =
        links.join("");

}


// ======================================================
// MENU SUPERIOR DINÂMICO
// ======================================================

function renderizarMenusCatalogo() {

    [
        "Feminino",
        "Masculino",
        "Calçados",
        "Acessórios"
    ]
    .forEach(
        grupo => {

            const painel =
                document.querySelector(
                    `[data-menu-panel="${grupo}"]`
                );


            if (
                painel
            ) {

                painel.innerHTML =
                    criarConteudoMenu(
                        grupo
                    );

            }

        }
    );

}


function criarConteudoMenu(
    grupo
) {

    const disponiveis =
        estoque.filter(
            item =>

                item.grupo ===
                grupo

                &&

                Number(
                    item.quantidade
                    ||
                    0
                )
                >
                0
        );


    if (
        disponiveis.length ===
        0
    ) {

        return `
            <div class="mega-menu-empty">
                Nenhum produto disponível.
            </div>
        `;

    }


    const categorias =
        new Map();


    disponiveis.forEach(
        item => {

            if (
                !categorias.has(
                    item.categoria
                )
            ) {

                categorias.set(
                    item.categoria,
                    new Set()
                );

            }


            categorias
                .get(
                    item.categoria
                )
                .add(
                    item.produto
                );

        }
    );


    const categoriasHtml =
        Array.from(
            categorias.entries()
        )
        .map(
            (
                [
                    categoria,
                    produtos
                ]
            ) => {

                const produtosHtml =
                    Array.from(
                        produtos
                    )
                    .map(
                        produto => `
                            <a
                                href="${
                                    criarUrlCatalogo(
                                        {
                                            grupo:
                                                grupo,

                                            categoria:
                                                categoria,

                                            produto:
                                                produto
                                        }
                                    )
                                }"
                                class="mega-menu-product"
                            >
                                ${goldFitEscapeHtml(
                                    produto
                                )}
                            </a>
                        `
                    )
                    .join("");


                return `

                    <div class="mega-menu-category">

                        <a
                            href="${
                                criarUrlCatalogo(
                                    {
                                        grupo:
                                            grupo,

                                        categoria:
                                            categoria
                                    }
                                )
                            }"
                            class="mega-menu-category-title"
                        >
                            ${goldFitEscapeHtml(
                                categoria
                            )}
                        </a>


                        <div class="mega-menu-products">

                            ${produtosHtml}

                        </div>

                    </div>

                `;

            }
        )
        .join("");


    return `

        <div class="mega-menu-header">

            <div class="mega-menu-label">

                <span>
                    GOLD FIT
                </span>

                <strong>
                    ${goldFitEscapeHtml(
                        grupo
                    )}
                </strong>

            </div>


            <a
                href="${
                    criarUrlCatalogo(
                        {
                            grupo:
                                grupo
                        }
                    )
                }"
                class="mega-menu-all"
            >
                VER TODO ${goldFitEscapeHtml(
                    grupo.toUpperCase()
                )} →
            </a>

        </div>


        <div class="mega-menu-grid">

            ${categoriasHtml}

        </div>

    `;

}


// ======================================================
// URL
// ======================================================

function criarUrlCatalogo(
    filtros
) {

    const parametros =
        new URLSearchParams();


    Object.entries(
        filtros
    )
    .forEach(
        (
            [
                chave,
                valor
            ]
        ) => {

            if (
                valor
            ) {

                parametros.set(
                    chave,
                    valor
                );

            }

        }
    );


    return (
        `./catalogo.html?${parametros.toString()}`
    );

}


// ======================================================
// MOBILE
// ======================================================

function alternarMenuMobile(
    grupo
) {

    document
        .querySelectorAll(
            ".nav-dropdown"
        )
        .forEach(
            dropdown => {

                const atual =
                    dropdown.dataset.menuDropdown ===
                    grupo;


                if (
                    atual
                ) {

                    dropdown.classList.toggle(
                        "open"
                    );

                }

                else {

                    dropdown.classList.remove(
                        "open"
                    );

                }

            }
        );

}


// ======================================================
// BUSCA GLOBAL
// ======================================================

function realizarBuscaGlobal() {

    const busca =
        document
            .getElementById(
                "pesquisaTopoCatalogo"
            )
            .value
            .trim();


    if (
        !busca
    ) {

        window.location.href =
            "./catalogo.html";


        return;

    }


    window.location.href =
        `./catalogo.html?busca=${
            encodeURIComponent(
                busca
            )
        }`;

}


// ======================================================
// FAVORITOS
// ======================================================

function carregarFavoritosCatalogo() {

    try {

        return (
            JSON.parse(
                localStorage.getItem(
                    GOLD_FIT_FAVORITES_KEY
                )
            )
            ||
            []
        );

    }

    catch {

        return [];

    }

}


function alternarFavoritoCatalogo(
    chave
) {

    const indice =
        favoritos.indexOf(
            chave
        );


    if (
        indice >=
        0
    ) {

        favoritos.splice(
            indice,
            1
        );

    }

    else {

        favoritos.push(
            chave
        );

    }


    localStorage.setItem(

        GOLD_FIT_FAVORITES_KEY,

        JSON.stringify(
            favoritos
        )

    );


    renderizarCatalogo();

}


// ======================================================
// CONTA
// ======================================================

function atualizarContaCatalogo() {

    const sessao =
        goldFitCarregarSessao();


    const elemento =
        document.getElementById(
            "textoContaCatalogo"
        );


    if (
        !sessao
    ) {

        elemento.textContent =
            "Entrar";


        return;

    }


    if (
        sessao.perfil ===
        "admin"
    ) {

        elemento.textContent =
            "Admin";


        return;

    }


    elemento.textContent =
        String(
            sessao.nome
            ||
            "Conta"
        )
        .split(
            " "
        )[
            0
        ];

}


// ======================================================
// CARRINHO
// ======================================================

function atualizarCarrinhoCatalogo() {

    document
        .getElementById(
            "contadorCarrinhoCatalogo"
        )
        .textContent =
        goldFitQuantidadeCarrinho();

}


// ======================================================
// TOAST
// ======================================================

let toastTimerCatalogo;


function mostrarToastCatalogo(
    mensagem
) {

    clearTimeout(
        toastTimerCatalogo
    );


    toastCatalogo.textContent =
        mensagem;


    toastCatalogo.classList.add(
        "show"
    );


    toastTimerCatalogo =
        setTimeout(
            function () {

                toastCatalogo.classList.remove(
                    "show"
                );

            },
            3000
        );

}