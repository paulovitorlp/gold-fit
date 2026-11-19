"use strict";
/* Troca visual de imagens nos cartões quando já existe galeria da cor.
 * Lista com 1 GET e acompanha filtros/renderizações sem mudar dados de estoque. */
(() => {
    let fotos = new Map();
    let agendamento = null;
    let executando = false;
    function aplicar() {
        if (executando) return;
        executando = true;
        try {
            document.querySelectorAll(".product-card").forEach(card => {
                let chave = null;
                const destaque = card.querySelector("[data-produto]");
                if (destaque) {
                    try { chave = decodeURIComponent(destaque.dataset.produto); } catch (_) { /* ignore */ }
                }
                if (!chave) {
                    const favorito = card.querySelector("[data-favorito]");
                    if (favorito) { try { chave = decodeURIComponent(favorito.dataset.favorito); } catch (_) { /* ignore */ } }
                }
                if (!chave) return;
                const item = fotos.get(chave);
                if (!item) return;
                const principal = card.querySelector(".product-image img");
                if (principal && principal.getAttribute("src") !== item) principal.setAttribute("src", item);
            });
        } finally { executando = false; }
    }
    const observer = new MutationObserver(() => {
        if (agendamento) return;
        agendamento = requestAnimationFrame(() => { agendamento = null; aplicar(); });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    fetch("/api/galeria-produtos?visao=publica", { credentials: "same-origin" })
        .then(resp => { if (!resp.ok) throw new Error("API de galeria indisponível"); return resp.json(); })
        .then(dados => {
            const grupos = new Map();
            for (const foto of dados.fotos || []) {
                if (!grupos.has(foto.chave)) grupos.set(foto.chave, []);
                grupos.get(foto.chave).push(foto);
            }
            for (const [chave, itens] of grupos) {
                // A capa é a cor escolhida no painel, caso tenha foto de modelo.
                const capaDefinida = typeof goldFitCarregarProdutosSite === "function"
                    ? goldFitCarregarProdutosSite().find(x => x.chave === chave)?.corCapa : null;
                const canonica = cor => String(cor || "").normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
                const primeiroNoEstoque = typeof goldFitCarregarEstoque === "function"
                    ? goldFitCarregarEstoque().find(x => `${x.produto}|${x.marca}` === chave)?.cor
                    : null;
                itens.sort((a,b) => {
                    const rank = f => canonica(f.cor) === canonica(capaDefinida) && capaDefinida ? 0
                        : canonica(f.cor) === canonica(primeiroNoEstoque) ? 1 : 2;
                    return rank(a) - rank(b) || a.cor.localeCompare(b.cor) || a.ordem - b.ordem;
                });
                fotos.set(chave, itens[0].url);
            }
            aplicar();
        }).catch(erro => console.warn("Fotos da galeria não carregaram:", erro.message));
})();
