"use strict";
/* Gold Fit Pro V11 — funções puras para fotografia por cor e estoque independente. */
(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.GoldFitGaleriaV11 = api;
})(typeof window === "undefined" ? null : window, function () {
    function chaveCor(valor) {
        return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
    }
    function mesmaCor(a, b) { return Boolean(chaveCor(a)) && chaveCor(a) === chaveCor(b); }
    function coresParaExibir(coresConfiguradas, variacoes, fotos) {
        const resultado = [];
        const ja = new Set();
        for (const cor of [...(coresConfiguradas || []), ...(variacoes || []).map(v => v.cor), ...(fotos || []).map(f => f.cor)]) {
            const valor = String(cor ?? "").trim();
            const chave = chaveCor(valor);
            if (chave && !ja.has(chave)) { ja.add(chave); resultado.push(valor); }
        }
        return resultado;
    }
    function fotosDaCor(fotos, cor) {
        return (fotos || []).filter(f => mesmaCor(f.cor, cor))
            .sort((a, b) => Number(a.ordem) - Number(b.ordem))
            .slice(0, 4);
    }
    function quantidadeCor(variacoes, cor) {
        return (variacoes || []).filter(v => mesmaCor(v.cor, cor))
            .reduce((total, v) => total + Math.max(0, Number(v.quantidade) || 0), 0);
    }
    function variacao(variacoes, cor, tamanho) {
        return (variacoes || []).find(v => mesmaCor(v.cor, cor) && String(v.tamanho) === String(tamanho)) || null;
    }
    return Object.freeze({ chaveCor, mesmaCor, coresParaExibir, fotosDaCor, quantidadeCor, variacao });
});
