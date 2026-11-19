"use strict";
/* GOLD FIT V12 — painel de variações a partir de uma fotografia aprovada.
 * A interface não conhece a chave da API: só conversa com o backend autenticado.
 */
(() => {
    const $ = id => document.getElementById(id);
    let opcoes = null;
    let imagemAtual = null;
    let executando = false;
    let cancelouVisualizacao = false;

    async function json(url, opts = {}) {
        const r = await fetch(url, { credentials: "same-origin", cache: "no-store", ...opts });
        const data = await r.json().catch(() => ({}));
        if (r.status === 401) throw new Error("Sessão expirada. Entre novamente no painel.");
        if (!r.ok) throw new Error(data.mensagem || `Falha HTTP ${r.status}`);
        return data;
    }
    function criar(tag, cls = "", texto = "") {
        const el = document.createElement(tag);
        if (cls) el.className = cls;
        if (texto) el.textContent = texto;
        return el;
    }
    const modal = criar("div", "gf12-overlay");
    modal.id = "gf12Modal";
    modal.hidden = true;
    const caixa = criar("section", "gf12-dialog");
    caixa.setAttribute("role", "dialog");
    caixa.setAttribute("aria-modal", "true");
    caixa.setAttribute("aria-label", "Gerar variações de cores e poses");
    const topo = criar("header", "gf12-topo");
    topo.append(criar("h2", "", "Gerar outras cores e poses"));
    const fechar = criar("button", "gf12-fechar", "×");
    fechar.type = "button";
    fechar.setAttribute("aria-label", "Fechar painel de variações");
    topo.append(fechar);
    const desc = criar("p", "gf12-sub", "A foto aprovada é a âncora. Cada cor usa sua própria fotografia real da galeria do produto.");
    const base = criar("p", "gf12-base");
    const form = criar("form", "gf12-form");
    const labelProduto = criar("label", "", "Produto cadastrado");
    const seletorProduto = criar("select", "gf12-select");
    labelProduto.append(seletorProduto);
    const labelOrigem = criar("label", "", "Cor da foto-mãe (opcional, para não repeti-la)");
    const seletorOrigem = criar("select", "gf12-select");
    labelOrigem.append(seletorOrigem);
    const tituloCores = criar("h3", "", "Cores de destino");
    const coresContainer = criar("div", "gf12-cores");
    const nota = criar("p", "gf12-nota", "Cores esgotadas também podem ser geradas. Sem foto real cadastrada para a cor, não será possível criá-la nesta etapa.");
    const modos = criar("fieldset", "gf12-modos");
    modos.append(criar("legend", "", "Como gerar"));
    const modoMesma = criar("label", "");
    const radioMesma = criar("input"); radioMesma.type = "radio"; radioMesma.name = "gf12Modo"; radioMesma.value = "mesma_pose"; radioMesma.checked = true;
    modoMesma.append(radioMesma, document.createTextNode(" Mesma pose da foto aprovada"));
    const modoVariadas = criar("label", "");
    const radioVariadas = criar("input"); radioVariadas.type = "radio"; radioVariadas.name = "gf12Modo"; radioVariadas.value = "poses";
    modoVariadas.append(radioVariadas, document.createTextNode(" Outras poses e ângulos"));
    modos.append(modoMesma, modoVariadas);
    const tituloAngulos = criar("h3", "", "Ângulos para cada cor");
    const areaAngulos = criar("div", "gf12-angulos");
    const opcoesAngulos = [
        ["frente", "Frente"], ["costas", "Costas"], ["lado", "Lado"], ["superior", "Superior"]
    ];
    const marcacaoAngulos = [];
    for (const [angulo, nome] of opcoesAngulos) {
        const lb = criar("label", "gf12-check");
        const input = criar("input"); input.type = "checkbox"; input.value = angulo;
        input.checked = angulo === "frente";
        marcacaoAngulos.push(input); lb.append(input, document.createTextNode(` ${nome}`)); areaAngulos.append(lb);
    }
    const quantidade = criar("p", "gf12-quantidade");
    const status = criar("p", "gf12-status"); status.setAttribute("role", "status");
    const resultados = criar("div", "gf12-resultados");
    const barra = criar("div", "gf12-barra");
    const cancelar = criar("button", "gf12-secundario", "Fechar"); cancelar.type = "button";
    const enviar = criar("button", "gf12-principal", "GERAR VARIAÇÕES"); enviar.type = "submit";
    barra.append(cancelar, enviar);
    form.append(labelProduto, labelOrigem, tituloCores, coresContainer, nota, modos,
        tituloAngulos, areaAngulos, quantidade, status, resultados, barra);
    caixa.append(topo, desc, base, form);
    modal.append(caixa);
    document.body.append(modal);

    function produtoAtual() { return (opcoes?.produtos || []).find(p => p.chave === seletorProduto.value); }
    function modoAtual() { return radioVariadas.checked ? "poses" : "mesma_pose"; }
    function coresSelecionadas() { return [...coresContainer.querySelectorAll('input[type="checkbox"]:checked')].map(x => x.value); }
    function angulosSelecionados() { return marcacaoAngulos.filter(x => x.checked).map(x => x.value); }
    function atualizarQuantidade() {
        const modo = modoAtual();
        areaAngulos.hidden = modo === "mesma_pose";
        tituloAngulos.hidden = modo === "mesma_pose";
        const total = coresSelecionadas().length * (modo === "mesma_pose" ? 1 : angulosSelecionados().length);
        const max = opcoes?.limite_imagens || 12;
        quantidade.textContent = `${total} fotografia(s) prevista(s), até ${max} por solicitação. Cada foto gera uma chamada paga à API.`;
        quantidade.classList.toggle("gf12-erro", total > max || total === 0);
        enviar.disabled = executando || !total || total > max;
    }
    function montarCores() {
        const p = produtoAtual();
        coresContainer.replaceChildren();
        seletorOrigem.replaceChildren();
        const nenhuma = criar("option", "", "Não especificar"); nenhuma.value = ""; seletorOrigem.append(nenhuma);
        if (!p || !(p.cores || []).length) {
            coresContainer.append(criar("p", "gf12-vazio", "Este produto ainda não possui fotos por cor. Cadastre pelo menos uma em Produtos → Galeria por cor."));
            atualizarQuantidade(); return;
        }
        for (const item of p.cores) {
            const option = criar("option", "", item.cor); option.value = item.cor;
            seletorOrigem.append(option);
            const lb = criar("label", "gf12-cor-item");
            const input = criar("input"); input.type = "checkbox"; input.value = item.cor;
            const imagem = criar("img");
            if (/^\/midia\/galeria\/[a-z0-9-]+\.(?:jpg|png|webp)$/i.test(item.foto || "")) imagem.src = item.foto;
            imagem.alt = `Produto na cor ${item.cor}`;
            const detalhes = criar("span");
            detalhes.append(criar("strong", "", item.cor),
                criar("small", "", `${item.quantidade_fotos} referência(s) real(is) • ${Number(item.quantidade_estoque) > 0 ? `${item.quantidade_estoque} em estoque` : "sem estoque"}`));
            lb.append(input, imagem, detalhes); coresContainer.append(lb);
        }
        atualizarQuantidade();
    }
    function aoTrocarOrigem() {
        for (const checkbox of coresContainer.querySelectorAll('input[type="checkbox"]')) {
            const mesma = checkbox.value.localeCompare(seletorOrigem.value, "pt-BR", { sensitivity: "base" }) === 0 && !!seletorOrigem.value;
            checkbox.disabled = mesma;
            if (mesma) checkbox.checked = false;
        }
        atualizarQuantidade();
    }
    function fecharModal() {
        if (executando) {
            // Fechar somente a janela, o trabalho segue no servidor.
            if (!window.confirm("A geração continua no servidor, mesmo se você fechar esta janela. Fechar?")) return;
        }
        modal.hidden = true;
        cancelouVisualizacao = true;
    }
    async function abrirModal(info) {
        const imagemId = String(info?.imagemId || "");
        if (!/^[1-9][0-9]{0,15}$/.test(imagemId)) return;
        imagemAtual = imagemId;
        opcoes = null;
        modal.hidden = false;
        cancelouVisualizacao = false;
        status.textContent = "Buscando as cores do cadastro...";
        resultados.replaceChildren();
        enviar.disabled = true;
        try {
            const dados = await json(`/api/variacoes-automaticas/opcoes/${imagemId}`);
            if (imagemAtual !== imagemId) return;
            opcoes = dados;
            base.textContent = `Foto-mãe #${dados.base.id} • ${dados.base.modelo} • ${dados.base.angulo}`;
            seletorProduto.replaceChildren();
            const selecione = criar("option", "", "Selecione o produto do conjunto...");
            selecione.value = ""; seletorProduto.append(selecione);
            for (const p of dados.produtos || []) {
                const option = criar("option", "", `${p.nome} • ${p.marca}`);
                option.value = p.chave;
                seletorProduto.append(option);
            }
            radioMesma.checked = true;
            marcacaoAngulos.forEach(x => { x.checked = x.value === dados.base.angulo; });
            montarCores();
            status.textContent = "Selecione o produto e as cores que possuem fotografias reais.";
        } catch (e) { status.textContent = `Erro: ${e.message}`; }
    }
    async function acompanhar(grupoId) {
        for (let i = 0; i < 480; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            const data = await json(`/api/variacoes-automaticas/${grupoId}`);
            const grupo = data.grupo;
            const fotos = (data.lotes || []).reduce((t, l) => t + Number(l.imagens || 0), 0);
            status.textContent = `Grupo #${grupoId}: ${fotos}/${grupo.total_solicitado} fotografia(s) gerada(s). Status: ${grupo.status}.`;
            resultados.replaceChildren();
            for (const lote of data.lotes || []) {
                const linha = criar("div", "gf12-lote");
                linha.append(criar("strong", "", `${lote.cor_destino} • ${lote.imagens} foto(s) • ${lote.status}`));
                const link = criar("a", "", "Ver no histórico");
                link.href = "#historicoGeracoes";
                link.addEventListener("click", () => {
                    fecharModal();
                    $("atualizarHistorico")?.click();
                    setTimeout(() => $("historicoGeracoes")?.scrollIntoView({ behavior: "smooth" }), 50);
                });
                linha.append(link); resultados.append(linha);
            }
            if (["concluida", "parcial", "erro"].includes(grupo.status)) {
                executando = false;
                atualizarQuantidade();
                $("atualizarHistorico")?.click();
                if (grupo.mensagem_erro) status.textContent += ` Verifique falhas: ${grupo.mensagem_erro}`;
                return;
            }
            if (cancelouVisualizacao) {
                executando = false; atualizarQuantidade();
                return; // Trabalho segue no servidor; consulte pelo histórico.
            }
        }
        executando = false;
        atualizarQuantidade();
        status.textContent = "Acompanhamento encerrado; consulte os lotes no histórico para verificar o resultado.";
    }
    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (executando) return;
        const cores = coresSelecionadas();
        const angulos = modoAtual() === "mesma_pose" ? [opcoes.base.angulo] : angulosSelecionados();
        const total = cores.length * angulos.length;
        if (!seletorProduto.value || !total || total > (opcoes?.limite_imagens || 12)) {
            status.textContent = "Escolha produto, cores e ângulos válidos."; return;
        }
        if (!window.confirm(`Gerar ${total} fotografia(s) usando créditos da API? Cada cor exige referência real e todas as novas fotos ficarão pendentes de aprovação.`)) return;
        executando = true;
        atualizarQuantidade();
        status.textContent = "Registrando lote automático...";
        resultados.replaceChildren();
        try {
            const resposta = await json("/api/variacoes-automaticas", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imagem_base_id: imagemAtual, produto_chave: seletorProduto.value,
                    cor_base: seletorOrigem.value, modo: modoAtual(), cores, angulos })
            });
            status.textContent = `Grupo #${resposta.grupoId} criado. O backend gerará as fotos sem sobrescrever a foto-mãe.`;
            await acompanhar(resposta.grupoId);
        } catch (e) {
            executando = false;
            atualizarQuantidade();
            status.textContent = `Falha na solicitação: ${e.message}`;
        }
    });
    seletorProduto.addEventListener("change", montarCores);
    seletorOrigem.addEventListener("change", aoTrocarOrigem);
    coresContainer.addEventListener("change", atualizarQuantidade);
    marcacaoAngulos.forEach(x => x.addEventListener("change", atualizarQuantidade));
    radioMesma.addEventListener("change", atualizarQuantidade);
    radioVariadas.addEventListener("change", atualizarQuantidade);
    fechar.addEventListener("click", fecharModal);
    cancelar.addEventListener("click", fecharModal);
    modal.addEventListener("click", e => { if (e.target === modal) fecharModal(); });
    window.addEventListener("gf:variacoes:abrir", e => abrirModal(e.detail));
})();
