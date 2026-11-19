"use strict";

// Regras puras usadas pelo servidor e pelos testes. Fotos e estoque são independentes.
const ANGULOS = Object.freeze(["frente", "costas", "lado", "superior"]);
const LIMITE_IMAGENS = 12;

function chaveCor(cor) {
    return String(cor ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function planejarVariacoes({ cores, angulos, modo, anguloBase, corBase, galerias }) {
    if (!Array.isArray(cores) || cores.length < 1 || !Array.isArray(angulos)) {
        throw new Error("Selecione ao menos uma cor e um ângulo.");
    }
    if (!["mesma_pose", "poses"].includes(modo)) throw new Error("Modo de pose inválido.");
    if (!ANGULOS.includes(anguloBase)) throw new Error("A imagem base não possui ângulo reconhecido.");
    const finais = modo === "mesma_pose" ? [anguloBase] : angulos;
    if (!finais.length || finais.some(a => !ANGULOS.includes(a)) || new Set(finais).size !== finais.length) {
        throw new Error("Escolha ângulos válidos sem repetições.");
    }
    const normalizadas = cores.map(chaveCor);
    if (normalizadas.some(c => !c) || new Set(normalizadas).size !== cores.length) throw new Error("Cores inválidas ou repetidas.");
    if (normalizadas.includes(chaveCor(corBase)) && corBase) throw new Error("Selecione somente outras cores, diferentes da foto base.");
    if (cores.length * finais.length > LIMITE_IMAGENS) throw new Error(`Limite de ${LIMITE_IMAGENS} fotografias por solicitação.`);
    const tarefas = [];
    for (const cor of cores) {
        const foto = (galerias || []).find(f => chaveCor(f.cor) === chaveCor(cor));
        if (!foto) throw new Error(`Cadastre ao menos uma fotografia REAL da cor ${cor} em Produtos → Galeria por cor.`);
        for (const angulo of finais) tarefas.push({ cor: foto.cor, angulo, foto: foto.caminho_arquivo });
    }
    return tarefas;
}

module.exports = { ANGULOS, LIMITE_IMAGENS, chaveCor, planejarVariacoes };
