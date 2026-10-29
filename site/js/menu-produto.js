
/*
 * GOLD FIT - Menu dinâmico da página de produto.
 *
 * Utiliza o estoque disponível da loja e abre
 * os mesmos filtros do catálogo da Home.
 */

(function () {
    "use strict";

    const nav = document.getElementById(
        "menuCategoriasProduto"
    );

    const botaoMobile = document.getElementById(
        "btnMenuProduto"
    );

    if (!nav || !botaoMobile) {
        return;
    }

    const departamentos = [
        "Feminino",
        "Masculino",
        "Calçados",
        "Acessórios"
    ];


    /* PROTEÇÃO DE TEXTO */

    function escapar(valor) {
        if (typeof goldFitEscapeHtml === "function") {
            return goldFitEscapeHtml(valor);
        }

        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* LINKS DO CATÁLOGO */

    function urlCatalogo(grupo, categoria, nome) {
        const parametros = new URLSearchParams();

        parametros.set("grupo", grupo);

        if (categoria) {
            parametros.set("categoria", categoria);
        }

        if (nome) {
            parametros.set("produto", nome);
        }

        return "./catalogo.html?" + parametros.toString();
    }


    /* CARREGAR ESTOQUE */

    function estoquePublico() {
        try {
            return typeof goldFitCarregarEstoque === "function"
                ? goldFitCarregarEstoque()
                : [];
        }
        catch (erro) {
            console.error(
                "Erro ao montar menu da página do produto:",
                erro
            );

            return [];
        }
    }


    /* MONTAR MENU */

    function renderizarMenu() {
        const estoque = estoquePublico();

        departamentos.forEach(grupo => {

            const panel = nav.querySelector(
                '[data-product-menu-panel="' + grupo + '"]'
            );

            if (!panel) {
                return;
            }

            const categorias = new Map();

            estoque.forEach(item => {

                if (
                    item.grupo !== grupo ||
                    Number(item.quantidade || 0) <= 0
                ) {
                    return;
                }

                const categoria = String(
                    item.categoria || "Produtos"
                ).trim();

                const nome = String(
                    item.produto || ""
                ).trim();

                if (!nome) {
                    return;
                }

                if (!categorias.has(categoria)) {
                    categorias.set(
                        categoria,
                        new Set()
                    );
                }

                categorias.get(categoria).add(nome);
            });


            /* LISTAR CATEGORIAS E PRODUTOS */

            const secoes = [...categorias.entries()]
                .sort(
                    ([a], [b]) =>
                        a.localeCompare(b, "pt-BR")
                )
                .map(([categoria, nomes]) => {

                    const produtos = [...nomes]
                        .sort(
                            (a, b) =>
                                a.localeCompare(b, "pt-BR")
                        )
                        .map(nome => `
                            <a href="${escapar(
                                urlCatalogo(
                                    grupo,
                                    categoria,
                                    nome
                                )
                            )}">
                                ${escapar(nome)}
                            </a>
                        `)
                        .join("");

                    return `
                        <div class="product-menu-category">

                            <a href="${escapar(
                                urlCatalogo(
                                    grupo,
                                    categoria
                                )
                            )}">
                                ${escapar(categoria)}
                            </a>

                            <div class="product-menu-category-items">
                                ${produtos}
                            </div>

                        </div>
                    `;
                })
                .join("");


            /* PREENCHER DROPDOWN */

            panel.innerHTML = `
                <div class="product-menu-head">

                    <strong>
                        ${escapar(grupo)}
                    </strong>

                    <a href="${escapar(
                        urlCatalogo(grupo)
                    )}">
                        VER TODOS
                    </a>

                </div>

                ${
                    secoes
                        ? `
                            <div class="product-menu-grid">
                                ${secoes}
                            </div>
                        `
                        : `
                            <p class="product-menu-empty">
                                Nenhum produto disponível no momento.
                            </p>
                        `
                }
            `;
        });
    }


    /* FECHAR DROPDOWNS */

    function fecharMenus() {
        nav.querySelectorAll(
            ".product-nav-department.open"
        ).forEach(item => {

            item.classList.remove("open");

            const botao = item.querySelector(
                ".product-nav-trigger"
            );

            if (botao) {
                botao.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        });
    }


    /* FECHAR MENU MOBILE */

    function fecharMobile() {
        nav.classList.remove("open");

        botaoMobile.setAttribute(
            "aria-expanded",
            "false"
        );

        fecharMenus();
    }


    /* BOTÃO MOBILE */

    botaoMobile.addEventListener("click", () => {

        const aberto = nav.classList.toggle("open");

        botaoMobile.setAttribute(
            "aria-expanded",
            String(aberto)
        );

        if (!aberto) {
            fecharMenus();
        }
    });


    /* BOTÕES DE CATEGORIAS */

    nav.querySelectorAll(
        ".product-nav-trigger"
    ).forEach(botao => {

        botao.addEventListener("click", () => {

            const departamento = botao.closest(
                ".product-nav-department"
            );

            const abrir = !departamento.classList.contains(
                "open"
            );

            fecharMenus();

            if (abrir) {
                departamento.classList.add("open");

                botao.setAttribute(
                    "aria-expanded",
                    "true"
                );
            }
        });
    });


    /* CLIQUE FORA DO MENU */

    document.addEventListener("click", evento => {

        if (
            !nav.contains(evento.target) &&
            !botaoMobile.contains(evento.target)
        ) {
            fecharMobile();
        }
    });


    /* TECLA ESC */

    document.addEventListener("keydown", evento => {

        if (evento.key === "Escape") {
            fecharMobile();
        }
    });


    /* REDIMENSIONAMENTO */

    window.addEventListener("resize", () => {

        if (window.innerWidth > 980) {
            fecharMobile();
        }
    });


    /* ATUALIZAÇÃO DO ESTOQUE */

    window.addEventListener("storage", evento => {

        const chaveEstoque =
            typeof GOLD_FIT_STOCK_KEY !== "undefined"
                ? GOLD_FIT_STOCK_KEY
                : "goldfit_estoque_demo_v4";

        const chaveProdutos =
            typeof GOLD_FIT_PRODUCTS_KEY !== "undefined"
                ? GOLD_FIT_PRODUCTS_KEY
                : "goldfit_produtos_site_v1";

        if (
            evento.key === chaveEstoque ||
            evento.key === chaveProdutos
        ) {
            renderizarMenu();
        }
    });


    /* INICIALIZAÇÃO */

    renderizarMenu();

})();
