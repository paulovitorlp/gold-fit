"use strict";
// Shared variant validation. Stock remains the source for SKU, quantity and color.
function canonica(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim().replace(/\s+/g, " ").toLowerCase();
}
function erro(message, status = 400) {
    const e = new Error(message); e.status = status; return e;
}
function mutacaoEstoque(origem, entrada) {
    if (!Array.isArray(origem)) throw erro("Documento de estoque inválido", 503);
    const estoque = origem.map(item => ({ ...item }));
    const acao = String(entrada?.acao || "");
    const id = Number(entrada?.id);
    const indice = estoque.findIndex(x => Number(x.id) === id);
    if (acao === "excluir") {
        if (!Number.isSafeInteger(id) || id <= 0 || indice < 0) throw erro("Variação não encontrada", 404);
        const [removida] = estoque.splice(indice, 1);
        return { estoque, chave: `${removida.produto}|${removida.marca}` };
    }
    if (acao === "quantidade") {
        const quantidade = Number(entrada.quantidade);
        if (indice < 0) throw erro("Variação não encontrada", 404);
        if (!Number.isSafeInteger(quantidade) || quantidade < 0 || quantidade > 999999) throw erro("Quantidade inválida");
        estoque[indice].quantidade = quantidade;
        return { estoque, chave: `${estoque[indice].produto}|${estoque[indice].marca}` };
    }
    if (acao !== "salvar") throw erro("Operação inválida");
    const dados = entrada?.variacao || {};
    const texto = (valor, nome, max) => {
        const value = String(valor || "").trim();
        if (!value || value.length > max) throw erro(`${nome} inválido`);
        return value;
    };
    const item = {
        grupo: texto(dados.grupo, "Grupo", 40),
        categoria: texto(dados.categoria, "Categoria", 80),
        produto: texto(dados.produto, "Produto", 120),
        marca: texto(dados.marca, "Marca", 80),
        cor: texto(dados.cor, "Cor", 80),
        tamanho: texto(dados.tamanho, "Tamanho", 40),
        sku: texto(dados.sku, "SKU", 90).toUpperCase(),
        quantidade: Number(dados.quantidade),
        preco: Number(dados.preco ?? 0),
        foto: typeof dados.foto === "string" ? dados.foto : ""
    };
    if (!Number.isFinite(item.preco) || item.preco < 0 || item.preco > 10000000)
        throw erro("Preço inválido");
    if (!Number.isSafeInteger(item.quantidade) || item.quantidade < 0 || item.quantidade > 999999)
        throw erro("Quantidade inválida");
    if (item.foto.length > 3_000_000) throw erro("Foto de estoque muito grande. Use imagem de até 2 MB.");
    if (entrada?.id != null && entrada.id !== "" && indice < 0) throw erro("Variação não encontrada", 404);
    if (indice >= 0) {
        const atual = estoque[indice];
        if (atual.produto !== item.produto || atual.marca !== item.marca)
            throw erro("Não altere nome ou marca de uma variação existente. Crie um novo modelo.");
    }
    if (estoque.some((x,i) => i !== indice && canonica(x.sku) === canonica(item.sku)))
        throw erro("Esse SKU já existe no estoque", 409);
    if (estoque.some((x,i) => i !== indice && ["produto","marca","cor","tamanho"]
        .every(field => canonica(x[field]) === canonica(item[field]))))
        throw erro("Já existe uma variação desse modelo, cor e tamanho", 409);
    item.id = indice >= 0 ? estoque[indice].id : estoque.reduce((acc, x) => Math.max(acc, Number(x.id) || 0), 0) + 1;
    if (indice >= 0) estoque[indice] = { ...estoque[indice], ...item };
    else estoque.push(item);
    return { estoque, chave: `${item.produto}|${item.marca}` };
}
module.exports = { mutacaoEstoque, canonica };
