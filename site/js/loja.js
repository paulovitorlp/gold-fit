let estoque =
    goldFitCarregarEstoque();


let grupoSelecionado =
    "Todos";


let favoritos =
    carregarFavoritos();


let slideAtual =
    0;


let intervaloSlider =
    null;


// ======================================================
// ELEMENTOS
// ======================================================

const listaProdutos =
    document.getElementById(
        "listaProdutos"
    );


const listaLancamentos =
    document.getElementById(
        "listaLancamentos"
    );


const listaFeminino =
    document.getElementById(
        "listaFeminino"
    );


const listaMasculino =
    document.getElementById(
        "listaMasculino"
    );


const listaCalcados =
    document.getElementById(
        "listaCalcados"
    );


const listaAcessorios =
    document.getElementById(
        "listaAcessorios"
    );


const pesquisaProduto =
    document.getElementById(
        "pesquisaProduto"
    );


const pesquisaTopo =
    document.getElementById(
        "pesquisaTopo"
    );


const contadorProdutos =
    document.getElementById(
        "contadorProdutos"
    );


const contadorCarrinho =
    document.getElementById(
        "contadorCarrinho"
    );


const toast =
    document.getElementById(
        "toast"
    );


// ======================================================
// INICIAR
// ======================================================

iniciar();


function iniciar() {

    configurarEventos();

    renderizarTudo();

    renderizarMenusCatalogo();

    atualizarContadorCarrinho();

    atualizarCabecalhoConta();

    iniciarSlider();

}


// ======================================================
// EVENTOS
// ======================================================

function configurarEventos() {


    document
        .querySelectorAll(
            ".filter-button"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    function () {

                        selecionarGrupo(
                            botao.dataset.grupo
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-scroll]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    function () {

                        rolarPara(
                            botao.dataset.scroll
                        );

                    }
                );

            }
        );


    pesquisaProduto.addEventListener(
        "input",
        function () {

            pesquisaTopo.value =
                pesquisaProduto.value;

            renderizarProdutos();

        }
    );


    pesquisaTopo.addEventListener(
        "input",
        function () {

            pesquisaProduto.value =
                pesquisaTopo.value;

            renderizarProdutos();

        }
    );


    pesquisaTopo.addEventListener(
        "keydown",
        function (
            event
        ) {

            if (
                event.key ===
                "Enter"
            ) {

                pesquisarNoCatalogo();

            }

        }
    );


    const btnPesquisaTopo =
        document.getElementById(
            "btnPesquisaTopo"
        );


    if (
        btnPesquisaTopo
    ) {

        btnPesquisaTopo.addEventListener(
            "click",
            pesquisarNoCatalogo
        );

    }


    document
        .getElementById(
            "navLancamentos"
        )
        .addEventListener(
            "click",
            function () {

                rolarPara(
                    "lancamentos"
                );

                fecharMenuMobile();

            }
        );


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
            "btnConta"
        )
        .addEventListener(
            "click",
            abrirConta
        );


    document
        .getElementById(
            "btnCarrinho"
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
            "btnFavoritos"
        )
        .addEventListener(
            "click",
            function () {

                mostrarToast(

                    favoritos.length
                        ?
                        `${favoritos.length} produto(s) favoritado(s).`
                        :
                        "Você ainda não possui favoritos."

                );

            }
        );


    [
        listaProdutos,
        listaLancamentos,
        listaFeminino,
        listaMasculino,
        listaCalcados,
        listaAcessorios
    ]
        .forEach(
            lista => {

                if (
                    !lista
                ) {

                    return;

                }


                lista.addEventListener(
                    "click",
                    tratarCliqueProduto
                );

            }
        );


    document
        .getElementById(
            "slideAnterior"
        )
        .addEventListener(
            "click",
            function () {

                mudarSlide(
                    slideAtual - 1
                );

                reiniciarSlider();

            }
        );


    document
        .getElementById(
            "slideProximo"
        )
        .addEventListener(
            "click",
            function () {

                mudarSlide(
                    slideAtual + 1
                );

                reiniciarSlider();

            }
        );


    document
        .querySelectorAll(
            ".slider-dot"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    function () {

                        mudarSlide(
                            Number(
                                botao.dataset.slideIndex
                            )
                        );

                        reiniciarSlider();

                    }
                );

            }
        );


    const hero =
        document.querySelector(
            ".hero"
        );


    if (
        hero
    ) {

        hero.addEventListener(
            "mouseenter",
            pararSlider
        );


        hero.addEventListener(
            "mouseleave",
            iniciarSlider
        );

    }


    const newsletterButton =
        document.querySelector(
            ".newsletter-form button"
        );


    if (
        newsletterButton
    ) {

        newsletterButton.addEventListener(
            "click",
            function () {

                const campo =
                    document.querySelector(
                        ".newsletter-form input"
                    );


                const email =
                    campo
                        .value
                        .trim();


                if (
                    !email
                    ||
                    !email.includes(
                        "@"
                    )
                ) {

                    mostrarToast(
                        "Informe um e-mail válido."
                    );


                    return;

                }


                campo.value =
                    "";


                mostrarToast(
                    "Cadastro registrado para demonstração."
                );

            }
        );

    }


    window.addEventListener(
        "storage",
        function (
            event
        ) {

            if (
                event.key ===
                GOLD_FIT_STOCK_KEY

                ||

                event.key ===
                GOLD_FIT_PRODUCTS_KEY
            ) {

                renderizarTudo();

                renderizarMenusCatalogo();

            }


            if (
                event.key ===
                GOLD_FIT_CART_KEY
            ) {

                atualizarContadorCarrinho();

            }


            if (
                event.key ===
                GOLD_FIT_SESSION_KEY
            ) {

                atualizarCabecalhoConta();

            }

        }
    );

}


// ======================================================
// MENU DINÂMICO
// ======================================================

function renderizarMenusCatalogo() {

    const grupos = [
        "Feminino",
        "Masculino",
        "Calçados",
        "Acessórios"
    ];


    grupos.forEach(
        grupo => {

            const painel =
                document.querySelector(
                    `[data-menu-panel="${grupo}"]`
                );


            if (
                !painel
            ) {

                return;

            }


            painel.innerHTML =
                criarConteudoMenu(
                    grupo
                );

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
                Nenhum produto disponível
                neste departamento.
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
                        produto => {

                            return `

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

                            `;

                        }
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
// MOBILE MENU
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
// BUSCA
// ======================================================

function pesquisarNoCatalogo() {

    const busca =
        pesquisaTopo
            .value
            .trim();


    if (
        !busca
    ) {

        rolarPara(
            "produtos"
        );


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
// RENDERIZAR
// ======================================================

function renderizarTudo() {

    estoque =
        goldFitCarregarEstoque();


    renderizarProdutos();

    renderizarLancamentos();


    renderizarDepartamento(
        "Feminino",
        listaFeminino
    );


    renderizarDepartamento(
        "Masculino",
        listaMasculino
    );


    renderizarDepartamento(
        "Calçados",
        listaCalcados
    );


    renderizarDepartamento(
        "Acessórios",
        listaAcessorios
    );

}


// ======================================================
// AGRUPAR
// ======================================================

function agruparProdutos() {

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

                        destaque:
                            Boolean(
                                item.destaque
                            ),

                        lancamento:
                            Boolean(
                                item.lancamento
                            ),

                        ordem:
                            Number(
                                item.ordem
                                ||
                                9999
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
    )
    .sort(
        (
            a,
            b
        ) =>
            a.ordem -
            b.ordem
    );

}


// ======================================================
// DESTAQUES
// ======================================================

function renderizarProdutos() {

    const busca =
        pesquisaProduto
            .value
            .trim()
            .toLowerCase();


    const filtrados =
        agruparProdutos()
            .filter(
                produto => {

                    if (
                        !produto.destaque
                    ) {

                        return false;

                    }


                    const grupoOk =

                        grupoSelecionado ===
                            "Todos"

                        ||

                        produto.grupo ===
                            grupoSelecionado;


                    const texto =
                        `
                        ${produto.produto}
                        ${produto.marca}
                        ${produto.categoria}
                        ${produto.grupo}
                        `
                        .toLowerCase();


                    return (
                        grupoOk
                        &&
                        texto.includes(
                            busca
                        )
                    );

                }
            );


    contadorProdutos.textContent =
        `${filtrados.length} produto(s)`;


    listaProdutos.innerHTML =

        filtrados.length

            ?

            filtrados
                .map(
                    criarCardProduto
                )
                .join("")

            :

            `
            <div class="empty-state">
                Nenhum produto em destaque
                com estes filtros.
            </div>
            `;

}


// ======================================================
// DEPARTAMENTOS
// ======================================================

function renderizarDepartamento(
    grupo,
    container
) {

    if (
        !container
    ) {

        return;

    }


    const produtos =
        agruparProdutos()
            .filter(
                produto =>
                    produto.grupo ===
                    grupo
            )
            .slice(
                0,
                8
            );


    container.innerHTML =

        produtos.length

            ?

            produtos
                .map(
                    criarCardProduto
                )
                .join("")

            :

            `
            <div class="empty-state">
                Nenhum produto disponível
                nesta seção.
            </div>
            `;

}


// ======================================================
// LANÇAMENTOS
// ======================================================

function renderizarLancamentos() {

    const lancamentos =
        agruparProdutos()
            .filter(
                produto =>
                    produto.lancamento
            );


    listaLancamentos.innerHTML =

        lancamentos.length

            ?

            lancamentos
                .map(
                    criarCardProduto
                )
                .join("")

            :

            `
            <div class="empty-state">
                Nenhum lançamento selecionado.
            </div>
            `;

}


// ======================================================
// CARD
// ======================================================

function criarCardProduto(
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


    const disponivel =
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


    const opcoes =
        goldFitOpcoesProduto(
            produto.produto,
            produto.variacoes
        );


    const favoritado =
        favoritos.includes(
            produto.chave
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


                <span
                    class="
                        stock-badge
                        ${
                            disponivel
                                ?
                                ""
                                :
                                "out"
                        }
                    "
                >

                    ${
                        disponivel
                            ?
                            "DISPONÍVEL"
                            :
                            "INDISPONÍVEL"
                    }

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

function tratarCliqueProduto(
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

        alternarFavorito(

            decodeURIComponent(
                favorito.dataset.favorito
            )

        );

    }

}


// ======================================================
// FILTRO HOME
// ======================================================

function selecionarGrupo(
    grupo
) {

    grupoSelecionado =
        grupo;


    document
        .querySelectorAll(
            ".filter-button"
        )
        .forEach(
            botao => {

                botao.classList.toggle(

                    "active",

                    botao.dataset.grupo ===
                    grupo

                );

            }
        );


    renderizarProdutos();

}


// ======================================================
// FAVORITOS
// ======================================================

function carregarFavoritos() {

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


function alternarFavorito(
    chave
) {

    const indice =
        favoritos.indexOf(
            chave
        );


    const estavaFavoritado =
        indice >=
        0;


    if (
        estavaFavoritado
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


    renderizarTudo();


    mostrarToast(

        estavaFavoritado
            ?
            "Produto removido dos favoritos."
            :
            "Produto adicionado aos favoritos."

    );

}


// ======================================================
// CARRINHO
// ======================================================

function atualizarContadorCarrinho() {

    contadorCarrinho.textContent =
        goldFitQuantidadeCarrinho();

}


// ======================================================
// CONTA
// ======================================================

function atualizarCabecalhoConta() {

    const sessao =
        goldFitCarregarSessao();


    const textoConta =
        document.getElementById(
            "textoConta"
        );


    if (
        !textoConta
    ) {

        return;

    }


    if (
        !sessao
    ) {

        textoConta.textContent =
            "Entrar";

        return;

    }


    if (
        sessao.perfil ===
        "admin"
    ) {

        textoConta.textContent =
            "Admin";

        return;

    }


    textoConta.textContent =
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


function abrirConta() {

    window.location.href =
        "./login.html";

}


// ======================================================
// SCROLL
// ======================================================

function rolarPara(
    id
) {

    const elemento =
        document.getElementById(
            id
        );


    if (
        elemento
    ) {

        elemento.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"

        });

    }

}


// ======================================================
// MENU MOBILE
// ======================================================

function fecharMenuMobile() {

    document
        .getElementById(
            "mainNav"
        )
        .classList
        .remove(
            "open"
        );


    document
        .querySelectorAll(
            ".nav-dropdown"
        )
        .forEach(
            dropdown => {

                dropdown.classList.remove(
                    "open"
                );

            }
        );

}


// ======================================================
// SLIDER
// ======================================================

function iniciarSlider() {

    if (
        intervaloSlider
    ) {

        return;

    }


    intervaloSlider =
        setInterval(
            function () {

                mudarSlide(
                    slideAtual + 1
                );

            },
            6000
        );

}


function pararSlider() {

    clearInterval(
        intervaloSlider
    );


    intervaloSlider =
        null;

}


function reiniciarSlider() {

    pararSlider();

    iniciarSlider();

}


function mudarSlide(
    indice
) {

    const slides =
        document.querySelectorAll(
            ".hero-slide"
        );


    const dots =
        document.querySelectorAll(
            ".slider-dot"
        );


    if (
        indice >=
        slides.length
    ) {

        indice =
            0;

    }


    if (
        indice <
        0
    ) {

        indice =
            slides.length - 1;

    }


    slideAtual =
        indice;


    slides.forEach(
        (
            slide,
            index
        ) => {

            slide.classList.toggle(

                "active",

                index ===
                slideAtual

            );

        }
    );


    dots.forEach(
        (
            dot,
            index
        ) => {

            dot.classList.toggle(

                "active",

                index ===
                slideAtual

            );

        }
    );

}


// ======================================================
// TOAST
// ======================================================

let toastTimer;


function mostrarToast(
    mensagem
) {

    clearTimeout(
        toastTimer
    );


    toast.textContent =
        mensagem;


    toast.classList.add(
        "show"
    );


    toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}

// ======================================================
// REDESIGN HOME - CARROSSEIS / CATEGORIAS / HOVER
// ======================================================

function goldFitFotosDoProduto(produto) {
    const fotos = [];
    (produto.variacoes || []).forEach(item => {
        const candidatos = [
            item.fotoPrincipal,
            item.foto,
            item.fotoHover,
            item.fotoSecundaria
        ];
        if (Array.isArray(item.fotos)) candidatos.push(...item.fotos);
        candidatos.filter(Boolean).forEach(f => fotos.push(f));
    });
    return [...new Set(fotos)];
}

function criarCardProduto(produto) {
    const fotos = goldFitFotosDoProduto(produto);
    const fotoPrincipal = fotos[0] || goldFitPlaceholder(produto);
    const fotoHover = fotos[1] || "";
    const disponivel = produto.variacoes.some(item => Number(item.quantidade || 0) > 0);
    const favoritado = favoritos.includes(produto.chave);

    return `
        <article class="product-card ${fotoHover ? "has-hover" : ""}">
            <div class="product-image" data-produto="${encodeURIComponent(produto.chave)}">
                <img class="product-img-main" src="${fotoPrincipal}" alt="${goldFitEscapeHtml(produto.produto)}">
                ${fotoHover ? `<img class="product-img-hover" src="${fotoHover}" alt="${goldFitEscapeHtml(produto.produto)} - segunda foto">` : ""}
                <span class="stock-badge ${disponivel ? "" : "out"}">${disponivel ? "DISPONÍVEL" : "INDISPONÍVEL"}</span>
                <button type="button" class="favorite-button ${favoritado ? "active" : ""}" data-favorito="${encodeURIComponent(produto.chave)}" aria-label="Favoritar">${favoritado ? "♥" : "♡"}</button>
            </div>
            <div class="product-info">
                <span class="product-brand">${goldFitEscapeHtml(produto.marca)}</span>
                <h3 data-produto="${encodeURIComponent(produto.chave)}">${goldFitEscapeHtml(produto.produto)}</h3>
                <strong class="product-price" data-produto="${encodeURIComponent(produto.chave)}">${goldFitFormatarPreco(produto.preco)}</strong>
            </div>
        </article>`;
}

function renderizarCategoriasVisuais() {
    const container = document.getElementById("categoriasVisuais");
    if (!container) return;

    const mapa = new Map();
    estoque
        .filter(item => Number(item.quantidade || 0) > 0)
        .forEach(item => {
            const chave = `${item.grupo}|${item.categoria}`;
            if (!mapa.has(chave)) {
                mapa.set(chave, {
                    grupo: item.grupo,
                    categoria: item.categoria,
                    item
                });
            } else {
                const atual = mapa.get(chave).item;
                if (!atual.foto && item.foto) mapa.get(chave).item = item;
            }
        });

    const prioridade = ["Conjuntos", "Croppeds", "Tops", "Jaquetas", "Shorts", "Macaquinhos", "Saias", "Tênis", "Meias"];
    const categorias = [...mapa.values()].sort((a,b) => {
        const ai = prioridade.indexOf(a.categoria);
        const bi = prioridade.indexOf(b.categoria);
        return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.categoria.localeCompare(b.categoria, "pt-BR");
    });

    container.innerHTML = categorias.map(cat => {
        const produtoFake = { produto: cat.item.produto, marca: cat.item.marca };
        const foto = cat.item.fotoPrincipal || cat.item.foto || goldFitPlaceholder(produtoFake);
        return `
            <a class="visual-category" href="${criarUrlCatalogo({grupo: cat.grupo, categoria: cat.categoria})}">
                <span class="visual-category-image"><img src="${foto}" alt="${goldFitEscapeHtml(cat.categoria)}"></span>
                <strong>${goldFitEscapeHtml(cat.categoria)}</strong>
            </a>`;
    }).join("");
}

function goldFitMoverCarrossel(id, direcao) {
    const el = document.getElementById(id);
    if (!el) return;
    const passo = Math.max(el.clientWidth * .88, 260);
    el.scrollBy({left: passo * direcao, behavior: "smooth"});
}

function configurarCarrosseisHome() {
    document.querySelectorAll("[data-carousel-prev]").forEach(btn => {
        btn.addEventListener("click", () => goldFitMoverCarrossel(btn.dataset.carouselPrev, -1));
    });
    document.querySelectorAll("[data-carousel-next]").forEach(btn => {
        btn.addEventListener("click", () => goldFitMoverCarrossel(btn.dataset.carouselNext, 1));
    });
    const categorias = document.getElementById("categoriasVisuais");
    document.querySelector(".category-prev")?.addEventListener("click", () => categorias?.scrollBy({left:-520,behavior:"smooth"}));
    document.querySelector(".category-next")?.addEventListener("click", () => categorias?.scrollBy({left:520,behavior:"smooth"}));
}

function configurarBuscaMobileGoldFit() {
    const header = document.querySelector(".header");
    const botao = document.getElementById("btnPesquisaTopo");
    if (!header || !botao || !pesquisaTopo) return;

    botao.addEventListener("click", event => {
        if (window.innerWidth <= 780 && !header.classList.contains("search-open")) {
            event.preventDefault();
            event.stopImmediatePropagation();
            header.classList.add("search-open");
            setTimeout(() => pesquisaTopo.focus(), 60);
        }
    }, true);

    pesquisaTopo.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            header.classList.remove("search-open");
            pesquisaTopo.blur();
        }
    });
}

function configurarWhatsAppGoldFit() {
    document.getElementById("btnWhatsApp")?.addEventListener("click", () => {
        mostrarToast("O WhatsApp oficial da Gold Fit será conectado aqui.");
    });
}

// Atualiza recursos adicionados depois da inicialização original.
renderizarCategoriasVisuais();
configurarCarrosseisHome();
configurarBuscaMobileGoldFit();
configurarWhatsAppGoldFit();

// Prioriza o clique no favorito antes do clique de navegação do card.
function tratarCliqueProduto(event) {
    const favorito = event.target.closest("[data-favorito]");
    if (favorito) {
        event.preventDefault();
        event.stopPropagation();
        alternarFavorito(decodeURIComponent(favorito.dataset.favorito));
        return;
    }

    const produtoAlvo = event.target.closest("[data-produto]");
    if (produtoAlvo) {
        const chave = decodeURIComponent(produtoAlvo.dataset.produto);
        window.location.href = `./produto.html?produto=${encodeURIComponent(chave)}`;
    }
}
