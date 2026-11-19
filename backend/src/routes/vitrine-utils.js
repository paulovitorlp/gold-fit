"use strict";
function corCanonica(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}
function fotosAprovadasPorCor(registros) {
    const mapa = new Map();
    for (const foto of registros || []) {
        if (foto.tipo_foto !== "modelo") continue;
        const chave = String(foto.chave_produto || "");
        const cor = corCanonica(foto.cor);
        if (!chave || !cor || !foto.caminho_arquivo) continue;
        if (!mapa.has(chave)) mapa.set(chave, new Map());
        const grupo = mapa.get(chave);
        if (!grupo.has(cor) || Number(foto.ordem) < Number(grupo.get(cor).ordem)) {
            grupo.set(cor, { url: foto.caminho_arquivo, ordem: Number(foto.ordem) });
        }
    }
    return mapa;
}
function aplicarGaleriaPublica(estado, fotos) {
    const configuracoes = Array.isArray(estado.produtos) ? estado.produtos : [];
    const grupos = fotosAprovadasPorCor(fotos);
    // A publicação pertence ao modelo: fotos são necessárias para liberar cores,
    // mas a ausência de foto não apaga o card da loja (modo demonstrativo).
    const permitidos = new Set(configuracoes.filter(x => x && x.publicado !== false)
        .map(x => x.chave));
    const produtos = configuracoes.filter(x => x && permitidos.has(x.chave)).map(x => ({
        ...x, fotoPrincipal: "" // nenhuma capa antiga compartilhada entre cores
    }));
    const estoque = (Array.isArray(estado.estoque) ? estado.estoque : [])
        .filter(x => x && permitidos.has(`${x.produto}|${x.marca}`))
        .map(x => {
            const capa = grupos.get(`${x.produto}|${x.marca}`)?.get(corCanonica(x.cor));
            return capa ? { ...x, foto: capa.url } : null;
        }).filter(Boolean);
    return { produtos, estoque };
}
module.exports = { aplicarGaleriaPublica, corCanonica, fotosAprovadasPorCor };
