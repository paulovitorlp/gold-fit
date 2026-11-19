/* GOLD FIT PRO — menu compartilhado com a Home e o Catálogo.
 * A estrutura visual usa as mesmas classes/efeitos de loja.css;
 * este módulo mantém somente os dados e os eventos exclusivos da página de produto.
 */
(function () {
    "use strict";

    const nav = document.getElementById("mainNavProduto");
    const botaoMobile = document.getElementById("btnMenuProduto");
    if (!nav || !botaoMobile) return;

    const departamentos = ["Feminino", "Calçados", "Acessórios"];
    const escapar = valor => typeof goldFitEscapeHtml === "function"
        ? goldFitEscapeHtml(valor)
        : String(valor ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

    function urlCatalogo(grupo, categoria, nome) {
        const params = new URLSearchParams({grupo});
        if (categoria) params.set("categoria", categoria);
        if (nome) params.set("produto", nome);
        return `./catalogo.html?${params.toString()}`;
    }

    // Modelos publicados, e nao apenas variantes com fotos: tênis e meias
    // precisam constar no menu mesmo quando a galeria ainda esta vazia.
    function renderizarMenu(modelos = goldFitAgruparModelosVitrine()) {
        for (const grupo of departamentos) {
            const painel = nav.querySelector(`[data-menu-panel="${grupo}"]`);
            if (!painel) continue;
            const categorias = new Map();
            for (const item of modelos) {
                if (goldFitGrupoMenu(item.grupo) !== grupo || item.publicado === false) continue;
                const categoria = String(item.categoria || "Produtos").trim();
                const nome = String(item.produto || "").trim();
                if (!nome) continue;
                if (!categorias.has(categoria)) categorias.set(categoria, new Set());
                categorias.get(categoria).add(nome);
            }
            const secoes = [...categorias.entries()]
                .sort(([a], [b]) => a.localeCompare(b,"pt-BR"))
                .map(([categoria, nomes]) => `
                    <div class="mega-menu-category">
                        <a class="mega-menu-category-title" href="${escapar(urlCatalogo(grupo,categoria))}">${escapar(categoria)}</a>
                        <div class="mega-menu-products">${[...nomes].sort((a,b)=>a.localeCompare(b,"pt-BR"))
                            .map(nome => `<a class="mega-menu-product" href="${escapar(urlCatalogo(grupo,categoria,nome))}">${escapar(nome)}</a>`).join("")}</div>
                    </div>`).join("");
            painel.innerHTML = secoes ? `
                <div class="mega-menu-header">
                    <div class="mega-menu-label"><span>GOLD FIT</span><strong>${escapar(grupo)}</strong></div>
                    <a class="mega-menu-all" href="${escapar(urlCatalogo(grupo))}">VER TODO ${escapar(grupo.toUpperCase())} →</a>
                </div>
                <div class="mega-menu-grid">${secoes}</div>`
                : `<div class="mega-menu-empty">Nenhum produto disponível neste departamento.</div>`;
        }
    }

    function fecharSubmenus() {
        nav.querySelectorAll(".nav-dropdown.open").forEach(item => {
            item.classList.remove("open");
            item.querySelector(".nav-dropdown-trigger")?.setAttribute("aria-expanded", "false");
        });
    }

    function fecharMobile() {
        nav.classList.remove("open");
        botaoMobile.setAttribute("aria-expanded", "false");
        fecharSubmenus();
    }

    botaoMobile.addEventListener("click", () => {
        const aberto = nav.classList.toggle("open");
        botaoMobile.setAttribute("aria-expanded", String(aberto));
        if (!aberto) fecharSubmenus();
    });

    nav.querySelectorAll("[data-menu-toggle]").forEach(botao => {
        botao.setAttribute("aria-expanded", "false");
        botao.addEventListener("click", () => {
            if (window.innerWidth > 780) return; // No desktop abre por hover, igual à Home.
            const dropdown = botao.closest(".nav-dropdown");
            const abrir = !dropdown.classList.contains("open");
            fecharSubmenus();
            if (abrir) {
                dropdown.classList.add("open");
                botao.setAttribute("aria-expanded", "true");
            }
        });
    });

    document.addEventListener("click", event => {
        if (!nav.contains(event.target) && !botaoMobile.contains(event.target)) fecharMobile();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            fecharMobile();
            document.activeElement?.blur?.();
        }
    });
    window.addEventListener("resize", () => {
        if (window.innerWidth > 780) fecharMobile();
    });

    const pesquisa = document.getElementById("pesquisaTopoProduto");
    function buscar() {
        const termo = pesquisa?.value.trim();
        window.location.href = `./catalogo.html${termo ? `?busca=${encodeURIComponent(termo)}` : ""}`;
    }
    document.getElementById("btnPesquisaTopoProduto")?.addEventListener("click", buscar);
    pesquisa?.addEventListener("keydown", e => { if (e.key === "Enter") buscar(); });
    document.getElementById("navLancamentosProduto")?.addEventListener("click", () => {
        window.location.href = "./index.html#lancamentos";
    });
    document.getElementById("btnFavoritosProduto")?.addEventListener("click", () => {
        const total = typeof favoritos !== "undefined" && Array.isArray(favoritos) ? favoritos.length : 0;
        if (typeof mostrarToast === "function") {
            mostrarToast(total ? `${total} produto(s) favoritado(s).` : "Você ainda não possui favoritos.");
        }
    });
    // O produto.js continua responsável pela conta e pelo carrinho da página.
    function sincronizarMenu() {
        if (typeof goldFitConsultarModelosPublicados !== "function") return;
        goldFitConsultarModelosPublicados().then(renderizarMenu)
            .catch(erro => console.warn("Menu publico nao sincronizado:", erro.message));
    }
    window.addEventListener("storage", event => {
        const chaves = [
            typeof GOLD_FIT_STOCK_KEY !== "undefined" ? GOLD_FIT_STOCK_KEY : "goldfit_estoque_demo_v4",
            typeof GOLD_FIT_PRODUCTS_KEY !== "undefined" ? GOLD_FIT_PRODUCTS_KEY : "goldfit_produtos_site_v1"
        ];
        if (chaves.includes(event.key)) {
            renderizarMenu();
            sincronizarMenu();
        }
    });
    window.addEventListener("pageshow", () => {
        renderizarMenu();
        sincronizarMenu();
    });
    // V27: manter os departamentos atualizados sem navegação extra.
    window.addEventListener("goldfit:estado-atualizado", () => {
        renderizarMenu();
        sincronizarMenu();
    });
    renderizarMenu();
    sincronizarMenu();
})();
