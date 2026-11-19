"use strict";
/* Gold Fit V21 — uma tela para modelos, variações, estoque, fotos e publicação.
 * Os arquivos da galeria continuam sob o controle do editor de fotos V19. */
(() => {
    const $ = id => document.getElementById(id);
    const tabela = $("tabelaProdutosSite");
    const modal = $("gf21VarModal");
    const formulario = $("gf21VarForm");
    if (!tabela || !modal || !formulario) return;
    const campos = {
        grupo: $("gf21Grupo"), categoria: $("gf21Categoria"), produto: $("gf21Nome"),
        marca: $("gf21Marca"), cor: $("gf21Cor"), tamanho: $("gf21Tamanho"),
        sku: $("gf21Sku"), preco: $("gf21Preco"), quantidade: $("gf21Qtd")
    };
    const msg = $("gf21VarMensagem");
    const fotoInput = $("gf21Foto");
    const preview = $("gf21Preview");
    const categorias = {
        Feminino: ["Conjuntos", "Croppeds", "Saias", "Macaquinhos", "Shorts", "Jaquetas"],
        Masculino: ["Camisetas", "Shorts", "Calças", "Jaquetas", "Conjuntos"],
        Calçados: ["Tênis"], Acessórios: ["Meias"]
    };
    let edicaoId = null;
    let fotoAtual = "";
    let salvando = false;

    function preencherCategorias(valor) {
        campos.categoria.replaceChildren();
        for (const cat of categorias[campos.grupo.value] || []) {
            const opt = document.createElement("option"); opt.value = cat; opt.textContent = cat;
            campos.categoria.appendChild(opt);
        }
        if (valor) campos.categoria.value = valor;
    }
    function abrir(item, config) {
        formulario.reset();
        msg.textContent = "";
        edicaoId = item?.id ?? null;
        fotoAtual = item?.foto || "";
        $("gf21VarTitle").textContent = edicaoId != null ? "Editar variação" : config ? "Adicionar cor ou tamanho" : "Novo produto / modelo";
        campos.grupo.value = item?.grupo || config?.grupo || "Feminino";
        preencherCategorias(item?.categoria || config?.categoria);
        campos.produto.value = item?.produto || config?.produto || "";
        campos.marca.value = item?.marca || config?.marca || "";
        campos.cor.value = item?.cor || "";
        campos.tamanho.value = item?.tamanho || "Único";
        campos.sku.value = item?.sku || "";
        campos.quantidade.value = item?.quantidade ?? 0;
        campos.preco.value = config?.preco ?? item?.preco ?? goldFitPrecoProduto(campos.produto.value) ?? 0;
        const fixo = !!config || edicaoId != null;
        campos.grupo.disabled = fixo;
        campos.categoria.disabled = fixo;
        campos.produto.readOnly = fixo;
        campos.marca.readOnly = fixo;
        campos.preco.disabled = fixo;
        preview.hidden = !fotoAtual;
        preview.src = fotoAtual || "";
        modal.hidden = false;
        document.body.classList.add("gf21-modal-aberto");
        (fixo ? campos.cor : campos.produto).focus();
    }
    function fechar() {
        if (salvando) return;
        modal.hidden = true;
        document.body.classList.remove("gf21-modal-aberto");
        edicaoId = null;
        fotoAtual = "";
    }
    function obterItem(id) {
        return goldFitCarregarEstoqueBase().find(v => Number(v.id) === Number(id));
    }
    function obterModelo(chave) {
        return goldFitCarregarProdutosSite().find(v => v.chave === chave);
    }
    function status(texto, erro) {
        msg.textContent = texto;
        msg.style.color = erro ? "#a01b1b" : "#1d6d36";
    }
    async function mutacao(payload) {
        const res = await fetch("/api/loja/variacao", {
            method: "POST", credentials: "same-origin", cache: "no-store",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const dados = await res.json().catch(() => ({}));
        if (!res.ok || dados.status !== "ok") throw new Error(dados.mensagem || `Erro HTTP ${res.status}`);
        const leitura = await fetch("/api/loja/estado", { credentials: "same-origin", cache: "no-store" });
        if (!leitura.ok) throw new Error("A alteração foi salva, mas não foi possível recarregar o banco. Atualize a página.");
        const atual = await leitura.json();
        if (!Array.isArray(atual.estoque) || !Array.isArray(atual.produtos)) throw new Error("Resposta de estoque inválida");
        localStorage.setItem(GOLD_FIT_STOCK_KEY, JSON.stringify(atual.estoque));
        localStorage.setItem(GOLD_FIT_PRODUCTS_KEY, JSON.stringify(atual.produtos));
        return dados;
    }
    function recarregar(aviso) {
        sessionStorage.setItem("gf21_salvo", aviso);
        window.location.reload();
    }
    function converterFoto(arquivo) {
        return new Promise((resolve, reject) => {
            if (!arquivo) return resolve(fotoAtual);
            if (!/^image\/(jpeg|png|webp)$/.test(arquivo.type)) return reject(new Error("Selecione uma foto JPG, PNG ou WebP."));
            if (arquivo.size > 8 * 1024 * 1024) return reject(new Error("A imagem deve ter até 8 MB."));
            const leitor = new FileReader();
            leitor.onerror = () => reject(new Error("Não foi possível ler a fotografia."));
            leitor.onload = () => {
                const img = new Image();
                img.onerror = () => reject(new Error("A fotografia não pôde ser aberta."));
                img.onload = () => {
                    const escala = Math.min(1, 1100 / Math.max(img.width, img.height));
                    const canvas = document.createElement("canvas");
                    canvas.width = Math.max(1, Math.round(img.width * escala));
                    canvas.height = Math.max(1, Math.round(img.height * escala));
                    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                    const base64 = canvas.toDataURL("image/jpeg", 0.82);
                    if (base64.length > 3_000_000) return reject(new Error("Imagem muito grande após compressão."));
                    resolve(base64);
                };
                img.src = leitor.result;
            };
            leitor.readAsDataURL(arquivo);
        });
    }
    formulario.addEventListener("submit", async event => {
        event.preventDefault();
        if (salvando) return;
        const quantidade = Number(campos.quantidade.value);
        if (!Number.isSafeInteger(quantidade) || quantidade < 0) return status("Informe uma quantidade inteira válida.", true);
        salvando = true;
        $("gf21VarSalvar").disabled = true;
        status(window.GoldFitDemoStatic ? "Salvando no navegador…" : "Salvando no PostgreSQL…", false);
        try {
            const foto = await converterFoto(fotoInput.files[0]);
            const variacao = Object.fromEntries(Object.entries(campos).map(([k,v]) => [k, v.value.trim()]));
            variacao.quantidade = quantidade;
            variacao.preco = Number(campos.preco.value);
            if (!Number.isFinite(variacao.preco) || variacao.preco < 0) throw new Error("Preço do produto inválido.");
            variacao.foto = foto;
            const resposta = await mutacao({ acao: "salvar", id: edicaoId, variacao });
            recarregar(window.GoldFitDemoStatic ? `Variação salva nesta demonstração. Modelo ${resposta.chave} atualizado.` : `Variação salva no PostgreSQL. Modelo ${resposta.chave} atualizado.`);
        } catch (erro) {
            status(`Falha ao salvar: ${erro.message}`, true);
            salvando = false;
            $("gf21VarSalvar").disabled = false;
        }
    });
    tabela.addEventListener("click", async event => {
        const add = event.target.closest("[data-gf21-add]");
        if (add) return abrir(null, obterModelo(decodeURIComponent(add.dataset.gf21Add)));
        const editar = event.target.closest("[data-gf21-editar]");
        if (editar) {
            const item = obterItem(editar.dataset.gf21Editar);
            return item ? abrir(item, null) : alert("Variação não encontrada; atualize a página.");
        }
        const excluir = event.target.closest("[data-gf21-excluir]");
        if (excluir) {
            const item = obterItem(excluir.dataset.gf21Excluir);
            if (!item) return alert("Variação não encontrada; atualize a página.");
            if (!confirm(`Excluir somente a variação ${item.sku} (${item.cor}, ${item.tamanho})? Esta operação remove o registro do estoque, mas mantém as fotos da galeria.`)) return;
            excluir.disabled = true;
            try { await mutacao({ acao: "excluir", id: item.id }); recarregar(`Variação ${item.sku} excluída do estoque.`); }
            catch (erro) { excluir.disabled = false; alert(`Falha ao excluir: ${erro.message}`); }
        }
    });
    $("gf21Novo").addEventListener("click", () => abrir(null, null));
    $("gf21Grupo").addEventListener("change", () => preencherCategorias());
    $("gf21VarFechar").addEventListener("click", fechar);
    $("gf21VarCancelar").addEventListener("click", fechar);
    modal.addEventListener("click", event => { if (event.target === modal) fechar(); });
    document.addEventListener("keydown", event => { if (!modal.hidden && event.key === "Escape") fechar(); });
    fotoInput.addEventListener("change", () => {
        if (!fotoInput.files[0]) return;
        const url = URL.createObjectURL(fotoInput.files[0]);
        preview.onload = () => URL.revokeObjectURL(url);
        preview.src = url; preview.hidden = false;
    });
    const msgSalvo = sessionStorage.getItem("gf21_salvo");
    if (msgSalvo) {
        sessionStorage.removeItem("gf21_salvo");
        setTimeout(() => { if (typeof mostrarToast === "function") mostrarToast(msgSalvo); }, 100);
    }
})();
