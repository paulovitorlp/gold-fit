"use strict";

// A loja agrupa todas as variacoes por nome e marca. A mesma chave e usada
// no front-end (goldFitChaveProduto) e na API para evitar produtos orfaos.
function chaveProduto(item) {
    return `${item.produto}|${item.marca}`;
}

function mesclarProdutosEstoque(configuracoes, estoque) {
    const produtos = Array.isArray(configuracoes) ? [...configuracoes] : [];
    const conhecidos = new Set(produtos.filter(Boolean).map(chave => chave.chave));
    const primeiraCarga = produtos.length === 0;
    let ordem = produtos.reduce((maior, p) => Math.max(maior, Number(p?.ordem) || 0), 0);
    let novos = 0;

    for (const item of estoque) {
        if (!item || typeof item.produto !== "string" || !item.produto.trim()
            || typeof item.marca !== "string" || !item.marca.trim()) continue;
        const chave = chaveProduto(item);
        if (conhecidos.has(chave)) continue;
        conhecidos.add(chave);
        ordem += 10;
        const preco = Number(item.preco);
        produtos.push({
            chave,
            produto: item.produto,
            marca: item.marca,
            grupo: item.grupo || "Feminino",
            categoria: item.categoria || "Conjuntos",
            preco: Number.isFinite(preco) && preco >= 0 ? preco : 0,
            fotoPrincipal: "",
            // Mantem o comportamento do cadastro original: um modelo novo e
            // publicado por padrao; o painel permite desmarcar "Publicado".
            publicado: true,
            // Novo produto publicado aparece também na Home; o painel permite retirar o destaque.
            destaque: true,
            lancamento: !primeiraCarga,
            ordem
        });
        novos++;
    }
    if (primeiraCarga && novos) {
        for (const item of produtos) item.lancamento = false;
        for (const item of produtos.slice(-4)) item.lancamento = true;
    }
    return { produtos, novos };
}

function filtrarEstadoPublico({ estoque, produtos }) {
    const configuracoes = Array.isArray(produtos) ? produtos : null;
    // Produtos explicitamente despublicados nunca podem passar ao catalogo.
    const bloqueados = new Set((configuracoes || [])
        .filter(item => item && (item.publicado === false))
        .map(item => item.chave));
    return {
        produtos: configuracoes ? configuracoes.filter(item => item && item.publicado !== false) : null,
        estoque: Array.isArray(estoque) ? estoque.filter(item => item && !bloqueados.has(chaveProduto(item))) : null
    };
}

module.exports = { mesclarProdutosEstoque, filtrarEstadoPublico };
