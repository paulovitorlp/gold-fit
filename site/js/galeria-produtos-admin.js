"use strict";
/* Editor independente: imagens por cor, persistidas no PostgreSQL. */
(() => {
    const $ = id => document.getElementById(id);
    const modal = $("modalProdutoOverlay");
    const area = $("gf8GaleriaArea");
    const seletorCor = $("gf8GaleriaCor");
    const arquivos = $("gf8GaleriaUpload");
    const classificacao = $("gf19FotoModelo");
    const grade = $("gf8GaleriaFotos");
    const aviso = $("gf8GaleriaAviso");
    if (!modal || !area) return;
    let chaveAnterior = "";
    let fotos = [];
    let ocupado = false;
    let idArrastado = null;

    function mensagem(texto, erro = false) {
        aviso.textContent = texto;
        aviso.classList.toggle("gf8-erro", erro);
    }
    const campoNovaCor = $("gf11NovaCor");
    const btnNovaCor = $("gf11AdicionarCor");
    const chaveCor = cor => String(cor || "").normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
    function corAtual() { return seletorCor.value; }
    function fotosDaCor() { return fotos.filter(f => chaveCor(f.cor) === chaveCor(corAtual()))
        .sort((a,b) => a.ordem - b.ordem); }
    async function json(url, opcoes = {}) {
        const resposta = await fetch(url, { credentials: "same-origin", ...opcoes });
        const corpo = await resposta.json().catch(() => ({}));
        if (!resposta.ok || corpo.status !== "ok") throw new Error(corpo.mensagem || `Erro HTTP ${resposta.status}`);
        return corpo;
    }
    async function salvarPosicoes(ids, feedback) {
        if (ocupado) return;
        const cor = corAtual();
        ocupado = true;
        desenhar();
        try {
            await json("/api/galeria-produtos/ordem", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chave: $("produtoSiteChave").value, cor, ids })
            });
            await carregar();
            mensagem(feedback || "Ordem salva. A Foto 1 aparece como capa na loja.");
        } catch (erro) {
            await carregar().catch(() => {});
            mensagem(erro.message, true);
        } finally { ocupado = false; idArrastado = null; desenhar(); }
    }
    function reposicionar(id, destino) {
        if (ocupado) return;
        const atuais = fotosDaCor();
        const origem = atuais.findIndex(f => String(f.id) === String(id));
        if (origem < 0 || destino < 0 || destino >= atuais.length || origem === destino) return;
        const [movida] = atuais.splice(origem, 1);
        atuais.splice(destino, 0, movida);
        salvarPosicoes(atuais.map(f => f.id), destino === 0
            ? "Capa atualizada! A Foto 1 será a primeira imagem no site."
            : "Nova ordem salva e publicada no site.");
    }
    function botaoOrganizar(rotulo, descricao, desativado, acao) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = rotulo;
        botao.title = descricao;
        botao.setAttribute("aria-label", descricao);
        botao.disabled = desativado;
        botao.addEventListener("click", acao);
        return botao;
    }
    function desenhar() {
        grade.replaceChildren();
        const atuais = fotosDaCor();
        atuais.forEach((foto, indice) => {
            const item = document.createElement("div");
            item.className = "gf8-thumb";
            const img = document.createElement("img");
            img.src = foto.url;
            img.alt = `Foto ${indice+1} de ${corAtual()}`;
            img.loading = "lazy";
            img.draggable = false;
            const legenda = document.createElement("span");
            legenda.textContent = `Foto ${indice + 1}` + (indice === 0 ? " · CAPA" : "");
            if (indice === 0) item.classList.add("gf8-capa");
            const acoes = document.createElement("div");
            acoes.className = "gf8-ordenar";
            acoes.append(
                botaoOrganizar("↑", `Subir foto ${indice + 1}`, ocupado || indice === 0, () => reposicionar(foto.id, indice - 1)),
                botaoOrganizar("↓", `Descer foto ${indice + 1}`, ocupado || indice === atuais.length - 1, () => reposicionar(foto.id, indice + 1))
            );
            if (indice > 0) acoes.append(botaoOrganizar("Definir capa", `Definir foto ${indice + 1} como capa`, ocupado, () => reposicionar(foto.id, 0)));
            item.draggable = !ocupado && atuais.length > 1;
            item.addEventListener("dragstart", evento => {
                if (ocupado) { evento.preventDefault(); return; }
                idArrastado = String(foto.id);
                evento.dataTransfer.effectAllowed = "move";
                evento.dataTransfer.setData("text/plain", idArrastado);
                item.classList.add("gf8-arrastando");
            });
            item.addEventListener("dragover", evento => {
                if (!idArrastado || ocupado) return;
                evento.preventDefault();
                evento.dataTransfer.dropEffect = "move";
            });
            item.addEventListener("drop", evento => {
                if (!idArrastado || ocupado) return;
                evento.preventDefault();
                const origem = idArrastado;
                idArrastado = null;
                reposicionar(origem, indice);
            });
            item.addEventListener("dragend", () => {
                idArrastado = null;
                item.classList.remove("gf8-arrastando");
            });
            const tipo = document.createElement("button");
            tipo.type = "button";
            tipo.className = "gf19-tipo";
            tipo.disabled = ocupado;
            tipo.textContent = foto.tipoFoto === "modelo" ? "✓ Modelo vestindo" : "Foto de produto — oculta na loja";
            tipo.title = "Alternar entre fotografia da modelo vestindo e foto apenas da peca";
            tipo.addEventListener("click", async () => {
                if (ocupado) return;
                const novoTipo = foto.tipoFoto === "modelo" ? "produto" : "modelo";
                if (novoTipo === "modelo" && !confirm("Confirme que a imagem mostra uma modelo vestindo a peca na cor " + corAtual() + ".")) return;
                ocupado = true;
                try {
                    await json(`/api/galeria-produtos/fotos/${foto.id}/tipo`, {
                        method: "PATCH", headers: {"Content-Type":"application/json"},
                        body: JSON.stringify({tipoFoto:novoTipo})
                    });
                    await carregar();
                    mensagem(novoTipo === "modelo" ? "Foto de modelo aprovada para a loja." : "Foto oculta da vitrine, preservada na galeria.");
                } catch (e) { mensagem(e.message, true); }
                finally { ocupado=false; desenhar(); }
            });
            const apagar = document.createElement("button");
            apagar.type = "button";
            apagar.textContent = "Excluir";
            apagar.disabled = ocupado;
            apagar.addEventListener("click", async () => {
                if (ocupado || !confirm(`Excluir esta foto da cor ${corAtual()}?`)) return;
                ocupado = true;
                try {
                    await json(`/api/galeria-produtos/fotos/${foto.id}`, { method: "DELETE" });
                    await carregar();
                    mensagem("Foto excluída da galeria. As outras fotos foram preservadas.");
                } catch (e) { mensagem(e.message, true); }
                finally { ocupado = false; desenhar(); }
            });
            apagar.className = "gf8-excluir";
            item.append(img, legenda, acoes, tipo, apagar);
            grade.append(item);
        });
        $("gf8GaleriaContador").textContent = `${atuais.length}/4 fotografias da cor ${corAtual() || "—"}`;
        arquivos.disabled = ocupado || !corAtual() || atuais.length >= 4;
        $("gf8GaleriaEnviar").disabled = arquivos.disabled;
    }
    function preencherCores() {
        const chave = $("produtoSiteChave").value;
        const estoque = typeof goldFitCarregarEstoqueBase === "function" ? goldFitCarregarEstoqueBase() : [];
        const coresEstoque = estoque.filter(item => `${item.produto}|${item.marca}` === chave)
            .map(item => item.cor).filter(Boolean);
        const coresFotos = fotos.map(item => item.cor).filter(Boolean);
        const cores = [];
        const vistas = new Set();
        [...coresEstoque, ...coresFotos].forEach(cor => {
            const codigo = chaveCor(cor);
            if (codigo && !vistas.has(codigo)) { vistas.add(codigo); cores.push(cor); }
        });
        if (!cores.length) cores.push("Cor única");
        const anterior = seletorCor.value;
        seletorCor.replaceChildren();
        cores.forEach(cor => {
            const opcao = document.createElement("option");
            opcao.value = cor;
            opcao.textContent = cor;
            seletorCor.append(opcao);
        });
        const correspondente = cores.find(cor => chaveCor(cor) === chaveCor(anterior));
        if (correspondente) seletorCor.value = correspondente;
    }
    function adicionarNovaCor() {
        const nome = campoNovaCor?.value.trim().replace(/\s+/g, " ");
        if (!nome || nome.length > 90) return mensagem("Digite uma cor válida de até 90 caracteres.", true);
        const existente = [...seletorCor.options].find(opt => chaveCor(opt.value) === chaveCor(nome));
        if (existente) {
            seletorCor.value = existente.value;
        } else {
            const opt = document.createElement("option");
            opt.value = nome;
            opt.textContent = nome;
            seletorCor.append(opt);
            seletorCor.value = nome;
        }
        campoNovaCor.value = "";
        mensagem(`Cor ${seletorCor.value} selecionada. Envie as fotos para publicá-la.`);
        desenhar();
    }
    const botaoVincular = document.createElement("button");
    botaoVincular.type = "button";
    botaoVincular.className = "gf8-button";
    botaoVincular.textContent = "USAR FOTO DO ESTOQUE DESTA COR";
    botaoVincular.title = "Usa a foto ja cadastrada na variacao do estoque, sem cadastrar outro produto";
    $("gf8GaleriaEnviar").insertAdjacentElement("afterend", botaoVincular);
    botaoVincular.addEventListener("click", async () => {
        const cor = corAtual();
        if (!cor || ocupado) return;
        if (fotosDaCor().length >= 4) return mensagem("Essa cor já tem quatro fotos.", true);
        const estoqueDaCor = typeof goldFitCarregarEstoqueBase === "function"
            ? goldFitCarregarEstoqueBase().find(item =>
                `${item.produto}|${item.marca}` === $("produtoSiteChave").value &&
                chaveCor(item.cor) === chaveCor(cor) && item.foto &&
                !String(item.foto).includes("placeholder")) : null;
        const origem = estoqueDaCor?.foto;
        if (!origem || origem.startsWith("data:image/svg") || origem.includes("placeholder"))
            return mensagem("Nao ha foto de estoque desta cor. Envie uma foto da modelo vestindo esta cor.", true);
        if (!confirm(`Confirmar: a foto do estoque mostra uma MODELO VESTINDO a peca na cor ${cor}?`)) return;
        ocupado = true;
        try {
            const resposta = await fetch(origem, {credentials:"same-origin"});
            if (!resposta.ok) throw new Error("Não foi possível ler a foto principal.");
            const arquivo = await resposta.blob();
            if (!arquivo.type.startsWith("image/")) throw new Error("A foto principal está em formato inválido.");
            if (arquivo.size > 12*1024*1024) throw new Error("A imagem excede o limite de 12 MB.");
            const dados = new FormData();
            dados.set("chave", $("produtoSiteChave").value);
            dados.set("cor", cor);
            dados.set("tipoFoto", "modelo");
            dados.set("foto", new File([arquivo], `capa-${Date.now()}.png`, {type:arquivo.type}));
            await json("/api/galeria-produtos/fotos", {method:"POST",body:dados});
            await carregar();
            mensagem(`Capa vinculada a ${cor}. Essa cor agora aparece selecionável na loja.`);
        } catch (e) { mensagem(e.message, true); }
        finally { ocupado = false; desenhar(); }
    });
        btnNovaCor?.addEventListener("click", adicionarNovaCor);
    campoNovaCor?.addEventListener("keydown", evento => {
        if (evento.key === "Enter") { evento.preventDefault(); adicionarNovaCor(); }
    });
    async function carregar() {
        const chave = $("produtoSiteChave").value;
        if (!chave) return;
        const resposta = await json(`/api/galeria-produtos?chave=${encodeURIComponent(chave)}`);
        fotos = resposta.fotos || [];
        preencherCores();
        desenhar();
    }
    async function abrir() {
        const chave = $("produtoSiteChave").value;
        if (!chave) return;
        if (chave !== chaveAnterior) {
            chaveAnterior = chave;
            preencherCores();
        }
        mensagem("Fotografias originais, sem compressão. Selecione a cor antes de enviar.");
        try { await carregar(); } catch (e) { mensagem(e.message, true); }
    }
    seletorCor.addEventListener("change", desenhar);
    $("gf8GaleriaEnviar").addEventListener("click", async () => {
        if (ocupado) return;
        const lista = [...arquivos.files];
        if (!lista.length) return mensagem("Selecione uma ou mais fotografias.", true);
        if (lista.length + fotosDaCor().length > 4) return mensagem("O limite é 4 imagens por cor.", true);
        if (lista.some(f => f.size > 12 * 1024 * 1024)) return mensagem("Cada arquivo deve ter no máximo 12 MB.", true);
        ocupado = true;
        desenhar();
        let enviadas = 0;
        try {
            for (const arquivo of lista) {
                mensagem(`Salvando fotografia ${enviadas+1} de ${lista.length}...`);
                const dados = new FormData();
                dados.set("chave", $("produtoSiteChave").value);
                dados.set("cor", corAtual());
                dados.set("tipoFoto", classificacao?.checked ? "modelo" : "produto");
                dados.set("foto", arquivo);
                await json("/api/galeria-produtos/fotos", { method: "POST", body: dados });
                enviadas++;
            }
            arquivos.value = "";
            await carregar();
            mensagem(`${enviadas} fotografia(s) salva(s) para a cor ${corAtual()}.`);
        } catch(e) { await carregar().catch(() => {}); mensagem(`${enviadas} salva(s). ${e.message}`, true); }
        finally { ocupado = false; desenhar(); }
    });
    const observer = new MutationObserver(() => {
        if (!modal.classList.contains("hidden")) abrir();
    });
    observer.observe(modal, { attributes: true, attributeFilter: ["class"] });
})();
