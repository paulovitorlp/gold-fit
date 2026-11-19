"use strict";

/* GOLD FIT PRO — ESTÚDIO IA / INTERFACE ETAPA 3
 * Usa as rotas da Etapa 2. Não armazena chaves no navegador.
 * 1 imagem -> resposta imediata; múltiplas imagens -> lote 202 + acompanhamento.
 */
(() => {
    const $ = id => document.getElementById(id);
    const ANGULOS = Object.freeze(["frente", "costas", "lado", "superior"]);
    const NOMES = { frente: "Frente", costas: "Costas", lado: "Lado", superior: "Superior" };
    const ESTILO = "top_legging_poliamida_lisa";
    const TAMANHO_MAXIMO = 10 * 1024 * 1024;
    const FORMATOS = new Set(["image/jpeg", "image/png", "image/webp"]);
    const LIMITE_CONSULTAS = 240; // aproximadamente 20 minutos (cada 5 segundos).

    const form = $("formGerador");
    const arquivoInput = $("fotoProduto");
    const CAMPOS_REFERENCIAS = Object.freeze([
        { id: "fotoFrenteExtra", titulo: "Frente adicional" },
        { id: "fotoCostas", titulo: "Costas" },
        { id: "fotoLado", titulo: "Lateral" },
        { id: "fotoDetalhes", titulo: "Outros/detalhes" }
    ]);

    const botaoGerar = $("btnGerar");
    const campoStatus = $("statusGerador");

    let modelos = [];
    let indiceModelo = 0;
    let chaveConfigurada = false;
    let trabalhando = false;
    let urlPreview = null;
    let cancelado = false;
    let loteAcompanhado = null;

    function no(tag, classe, texto) {
        const elemento = document.createElement(tag);
        if (classe) elemento.className = classe;
        if (texto !== undefined) elemento.textContent = texto;
        return elemento;
    }

    function alerta(elemento, mensagem, erro = false) {
        elemento.textContent = mensagem;
        elemento.classList.toggle("gf3-error", erro);
    }

    function enderecoSeguro(caminho, tipo) {
        if (typeof caminho !== "string") return "";
        if (window.GoldFitDemoStatic && /^\.\.\/assets\/estudio-demo\/(?:modelo-f0[1-5]|[0-9]{2})\.webp$/.test(caminho)) return caminho;
        const exp = tipo === "modelo"
            ? /^\/arquivos\/modelos\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:jpe?g|png|webp)$/i
            : tipo === "original"
                ? /^\/arquivos\/produtos-ia\/[0-9]+\/[a-zA-Z0-9_.-]+\.(?:jpe?g|png|webp)$/i
                : /^\/arquivos\/geradas\/[a-zA-Z0-9_.-]+\.(?:jpe?g|png|webp)$/i;
        return exp.test(caminho) ? caminho : "";
    }

    function urlLote(id, complemento = "") {
        if (!/^[1-9][0-9]{0,15}$/.test(String(id))) return "";
        return `/api/geracoes-imagens/${id}${complemento}`;
    }

    async function buscarJSON(url, opcoes) {
        const resposta = await fetch(url, { credentials: "same-origin", cache: "no-store", ...opcoes });
        const dados = await resposta.json().catch(() => ({}));
        if (resposta.status === 401 || resposta.status === 403) {
            throw new Error("Sua sessão expirou. Faça login novamente no painel e atualize a página.");
        }
        if (!resposta.ok) throw new Error(dados.mensagem || `Falha no servidor (HTTP ${resposta.status}).`);
        return dados;
    }

    function modeloAtual() { return modelos[indiceModelo] || null; }

    function habilitarGeracao() {
        botaoGerar.disabled = trabalhando || !modeloAtual() || !arquivoInput.files.length || !chaveConfigurada;
    }

    function selecionarModelo(index) {
        if (!modelos.length) return;
        indiceModelo = (index + modelos.length) % modelos.length;
        const modelo = modeloAtual();
        const foto = $("modeloFoto");
        const url = enderecoSeguro(modelo.foto_principal, "modelo");

        foto.hidden = !url;
        $("modeloSemFoto").hidden = Boolean(url);
        if (url) {
            foto.src = url;
            foto.alt = `Fotografia de referência de ${modelo.nome}`;
        } else foto.removeAttribute("src");

        $("modeloNome").textContent = modelo.nome || modelo.codigo;
        $("modeloCodigo").textContent = modelo.codigo;
        const originais = Number(modelo.total_referencias) || 0;
        const aprovadas = Number(modelo.total_aprovadas) || 0;
        const geradas = Number(modelo.total_geradas) || 0;
        $("modeloReferencias").textContent = `${originais} fotos originais + ${aprovadas} aprovadas como referência · ${geradas} geradas no histórico`;
        $("modeloAnterior").disabled = modelos.length <= 1;
        $("proximaModelo").disabled = modelos.length <= 1;

        const botoes = $("miniaturasModelos").querySelectorAll("button");
        botoes.forEach((botao, i) => {
            const ativo = i === indiceModelo;
            botao.setAttribute("aria-pressed", String(ativo));
            botao.classList.toggle("gf3-thumb-active", ativo);
        });
        habilitarGeracao();
    }

    function carregarCarrossel() {
        const lista = $("miniaturasModelos");
        lista.replaceChildren();
        modelos.forEach((modelo, index) => {
            const botao = no("button", "gf3-thumb");
            botao.type = "button";
            botao.title = `Selecionar ${modelo.nome}`;
            botao.setAttribute("aria-label", `Selecionar ${modelo.nome}`);
            const foto = no("span", "gf3-thumb-image");
            const url = enderecoSeguro(modelo.foto_principal, "modelo");
            if (url) {
                const imagem = no("img");
                imagem.src = url;
                imagem.alt = "";
                imagem.loading = "lazy";
                foto.append(imagem);
            } else foto.textContent = modelo.codigo;
            botao.append(foto, no("strong", "", modelo.nome), no("small", "", modelo.codigo));
            botao.addEventListener("click", () => selecionarModelo(index));
            lista.append(botao);
        });
        selecionarModelo(indiceModelo);
    }

    function angulosSelecionados() {
        const modo = form.querySelector('input[name="modoGeracao"]:checked')?.value || "frente";
        if (modo === "frente") return ["frente"];
        if (modo === "kit") return [...ANGULOS];
        return [...form.querySelectorAll('input[name="anguloPersonalizado"]:checked')].map(item => item.value).filter(a => ANGULOS.includes(a));
    }

    function atualizarModo() {
        const personalizado = form.querySelector('input[name="modoGeracao"]:checked')?.value === "personalizado";
        const opcoes = $("angulosPersonalizados");
        opcoes.hidden = !personalizado;
        opcoes.disabled = !personalizado;
        const total = angulosSelecionados().length;
        botaoGerar.textContent = total === 1 ? "GERAR 1 FOTOGRAFIA" : `GERAR ${total} FOTOGRAFIAS`;
    }

    function validarArquivo(arquivo) {
        if (!arquivo) throw new Error("Escolha uma fotografia do produto.");
        if (!FORMATOS.has(arquivo.type)) throw new Error("Formato inválido. Use JPG, PNG ou WEBP.");
        if (!arquivo.size || arquivo.size > TAMANHO_MAXIMO) throw new Error("A foto deve ter até 10 MB.");
    }

    function validarReferenciasAdicionais() {
        const selecionadas = [];
        for (const campo of CAMPOS_REFERENCIAS) {
            const arquivo = $(campo.id)?.files?.[0];
            if (!arquivo) continue;
            validarArquivo(arquivo);
            selecionadas.push({ campo: campo.id, titulo: campo.titulo, arquivo });
        }
        return selecionadas;
    }
    function atualizarReferenciasAdicionais() {
        const estado = $("gf14RefsStatus");
        if (!estado) return;
        try {
            const refs = validarReferenciasAdicionais();
            estado.textContent = refs.length
                ? `${refs.length} referência(s) adicional(is): ${refs.map(item => item.titulo).join(", ")}. As fotografias serão salvas no lote.`
                : "Nenhuma referência adicional selecionada. Até 10 MB por arquivo.";
            estado.classList.remove("gf3-error");
        } catch (erro) {
            estado.textContent = erro.message;
            estado.classList.add("gf3-error");
        }
    }

    function mudarFoto() {
        if (urlPreview) URL.revokeObjectURL(urlPreview);
        urlPreview = null;
        const preview = $("previewProduto");
        preview.hidden = true;
        preview.removeAttribute("src");
        $("uploadIcon").hidden = false;
        $("uploadTitulo").textContent = "Clique para escolher a fotografia";
        $("uploadDescricao").textContent = "JPG, PNG ou WEBP • até 10 MB";

        try {
            const arquivo = arquivoInput.files[0];
            if (!arquivo) return;
            validarArquivo(arquivo);
            urlPreview = URL.createObjectURL(arquivo);
            preview.src = urlPreview;
            preview.hidden = false;
            $("uploadIcon").hidden = true;
            $("uploadTitulo").textContent = "Fotografia selecionada";
            $("uploadDescricao").textContent = arquivo.name;
            alerta(campoStatus, "Foto carregada. Escolha os ângulos e inicie a geração.");
        } catch (erro) {
            arquivoInput.value = "";
            alerta(campoStatus, erro.message, true);
        } finally { habilitarGeracao(); }
    }

    function formatarData(valor) {
        const data = new Date(valor);
        return Number.isNaN(data.getTime()) ? "Data não disponível" : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    }

    const TEXTOS_STATUS = {
        pendente: "Pendente", processando: "Gerando", parcial: "Parcial",
        concluida: "Gerado", erro: "Erro"
    };

    function seloStatus(status) {
        const nome = String(status || "pendente");
        return no("span", `gf3-pill gf3-pill-${nome}`, TEXTOS_STATUS[nome] || nome);
    }

    function imagemCard(imagem, id) {
        const url = enderecoSeguro(imagem.url, "gerada");
        if (!url) return null;
        const angulo = ANGULOS.includes(imagem.angulo) ? imagem.angulo : "frente";
        const cartao = no("article", "gf3-result-card");
        const foto = no("img");
        foto.src = url;
        foto.alt = `Fotografia gerada: ${NOMES[angulo]}`;
        foto.loading = "lazy";
        const corpo = no("div", "gf3-result-meta");
        corpo.append(no("strong", "", NOMES[angulo]));
        const link = no("a", "gf3-download", "Baixar imagem ↓");
        link.href = window.GoldFitDemoStatic ? url : `/api/correcoes-imagens/baixar/${imagem.imagem_id}`;
        link.download = `goldfit-${angulo}.png`;
        corpo.append(link);
        if (imagem.imagem_id && /^[1-9][0-9]{0,15}$/.test(String(imagem.imagem_id))) {
            const revisao = imagem.status_revisao || "pendente";
            const rotulo = {
                pendente: "Aguardando revisão",
                aprovada: "Aprovada para uso",
                rejeitada: "Precisa de correção"
            }[revisao] || "Aguardando revisão";
            const identificacao = no("span", `gf4-review gf4-review-${revisao}`, rotulo);
            if (imagem.observacao_revisao) identificacao.title = imagem.observacao_revisao;
            corpo.append(identificacao);
            const opcoes = no("div", "gf4-review-actions");
            const aprovar = no("button", "gf4-review-button gf4-review-approve", "Aprovar");
            aprovar.type = "button";
            aprovar.disabled = revisao === "aprovada";
            aprovar.setAttribute("aria-label", `Aprovar foto ${NOMES[angulo]}`);
            aprovar.addEventListener("click", () => revisarImagem(id, imagem.imagem_id, "aprovada", aprovar));
            const rejeitar = no("button", "gf4-review-button gf4-review-reject", "Pedir correção");
            rejeitar.type = "button";
            rejeitar.disabled = revisao === "rejeitada";
            rejeitar.setAttribute("aria-label", `Marcar foto ${NOMES[angulo]} para correção`);
            rejeitar.addEventListener("click", () => revisarImagem(id, imagem.imagem_id, "rejeitada", rejeitar));
            opcoes.append(aprovar, rejeitar);
            const corrigir = no("button", "gf4-review-button gf9-corrigir", "Corrigir imagem");
            corrigir.type = "button";
            corrigir.dataset.lote = String(id);
            corrigir.dataset.imagem = String(imagem.imagem_id);
            corrigir.dataset.foto = url;
            corrigir.setAttribute("aria-label", `Corrigir fotografia ${NOMES[angulo]} usando IA`);
            opcoes.append(corrigir);
            if (revisao !== "aprovada" && !imagem.tem_historico_correcao) {
                const excluir = no("button", "gf4-review-button gf7-delete", "Excluir foto");
                excluir.type = "button";
                excluir.setAttribute("aria-label", `Excluir definitivamente foto ${NOMES[angulo]}`);
                excluir.addEventListener("click", () => excluirImagem(id, imagem.imagem_id, excluir));
                opcoes.append(excluir);
            }
            corpo.append(opcoes);
            if (imagem.tem_historico_correcao) corpo.append(no("small", "gf9-historical", "Esta foto integra um histórico de correções e não pode ser excluída isoladamente."));
            if (revisao === "aprovada") {
                const gerarVariacoes = no("button", "gf4-review-button gf12-trigger", "Gerar outras cores / poses");
                gerarVariacoes.type = "button";
                gerarVariacoes.addEventListener("click", () => window.dispatchEvent(new CustomEvent(
                    "gf:variacoes:abrir", { detail: { imagemId: imagem.imagem_id, loteId: id, angulo } }
                )));
                corpo.append(gerarVariacoes, criarPublicacaoProduto(id, imagem.imagem_id));
            }
        }
        cartao.append(foto, corpo);
        return cartao;
    }

    function montarGrade(elemento, imagens, id) {
        elemento.replaceChildren();
        let total = 0;
        (Array.isArray(imagens) ? imagens : []).forEach(item => {
            const cartao = imagemCard(item, id);
            if (cartao) { elemento.append(cartao); total++; }
        });
        if (!total) elemento.append(no("p", "gf3-empty", "Nenhuma imagem concluída neste lote ainda."));
        return total;
    }

    async function revisarImagem(loteId, imagemId, revisao, botao) {
        const rota = urlLote(loteId, `/revisar/${imagemId}`);
        if (!rota) return;
        botao.disabled = true;
        try {
            await buscarJSON(rota, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status_revisao: revisao,
                    observacao_revisao: revisao === "rejeitada" ? "Verificar logos, detalhes, caimento, costas e calçados antes de publicar." : "Revisão visual aprovada pelo administrador."
                })
            });
            const lote = await carregarDetalhes(loteId);
            if (!$('resultadoGeracao').hidden) {
                // Atualiza a galeria caso ela exiba esse mesmo lote.
                const codigo = $('resultadoGeracao').dataset.loteId;
                if (codigo === String(loteId)) mostrarResultado(lote);
            }
            if (!$('detalhesHistorico').hidden && $('detalhesHistorico').dataset.loteId === String(loteId)) {
                montarGrade($('gridDetalhes'), lote.imagens, lote.id);
            }
            alerta($('historicoStatus'), `Revisão salva no banco: ${revisao === "aprovada" ? "imagem aprovada" : "precisa de correção"}. O arquivo PNG foi mantido.`);
            // Atualizar contador das referências sem recarregar toda a tela.
            buscarJSON(`/api/modelos-virtuais?genero=feminino&estilo=${ESTILO}`)
                .then(dados => {
                    for (const atual of dados.modelos || []) {
                        const salvo = modelos.find(m => m.codigo === atual.codigo);
                        if (salvo) Object.assign(salvo, atual);
                    }
                    selecionarModelo(indiceModelo);
                }).catch(() => {});
            await atualizarHistorico(true);
        } catch (erro) {
            botao.disabled = false;
            alerta($('historicoStatus'), `Falha na revisão: ${erro.message}`, true);
        }
    }

    function criarPublicacaoProduto(loteId, imagemId) {
        const painel = no("div", "gf7-publicacao");
        const abrir = no("button", "gf4-review-button gf7-use", "Usar na loja");
        abrir.type = "button";
        const seletor = no("select", "gf7-product-select");
        seletor.setAttribute("aria-label", "Escolher produto do catalogo");
        seletor.hidden = true;
        const corProduto = no("select", "gf7-product-select");
        corProduto.setAttribute("aria-label", "Escolher cor da fotografia");
        corProduto.hidden = true;
        let estoqueCores = [];
        const confirmar = no("button", "gf4-review-button gf4-review-approve", "Usar no produto e na cor");
        confirmar.type = "button";
        confirmar.hidden = true;
        const aviso = no("small", "gf7-publish-status");
        aviso.setAttribute("role", "status");
        abrir.addEventListener("click", async () => {
            abrir.disabled = true;
            aviso.textContent = "Consultando produtos cadastrados...";
            try {
                const dados = await buscarJSON("/api/loja/estado");
                estoqueCores = Array.isArray(dados.estoque) ? dados.estoque : [];
                const produtos = (Array.isArray(dados.produtos) ? dados.produtos : [])
                    .filter(p => p.grupo !== "Masculino" && typeof p.chave === "string")
                    .sort((a, b) => String(a.produto).localeCompare(String(b.produto), "pt-BR"));
                seletor.replaceChildren();
                const opcao = no("option", "", "Selecione um produto...");
                opcao.value = "";
                seletor.append(opcao);
                produtos.forEach(p => {
                    const item = no("option", "", `${p.produto || p.chave} • ${p.marca || "Gold Fit"}${p.publicado === false ? " (oculto)" : ""}`);
                    item.value = p.chave;
                    seletor.append(item);
                });
                if (!produtos.length) throw new Error("Nenhum produto encontrado. Cadastre e salve um produto em Produtos antes de publicar.");
                seletor.hidden = false;
                corProduto.hidden = false;
                corProduto.replaceChildren();
                confirmar.hidden = false;
                aviso.textContent = "Escolha um produto e uma cor: a foto entrará na galeria daquela cor (até 4 imagens).";
            } catch (erro) {
                aviso.textContent = `Nao foi possivel listar produtos: ${erro.message}`;
            } finally { abrir.disabled = false; }
        });
        seletor.addEventListener("change", () => {
            const cores = [...new Set(estoqueCores.filter(v => `${v.produto}|${v.marca}` === seletor.value).map(v => v.cor).filter(Boolean))];
            corProduto.replaceChildren();
            if (!cores.length) cores.push("Cor única");
            for (const cor of cores) {
                const item = no("option", "", cor);
                item.value = cor;
                corProduto.append(item);
            }
        });
        confirmar.addEventListener("click", async () => {
            if (!seletor.value) return void (aviso.textContent = "Selecione um produto primeiro.");
            if (!corProduto.value) return void (aviso.textContent = "Selecione a cor do produto.");
            const descricao = seletor.selectedOptions[0]?.textContent || "este produto";
            if (!window.confirm(`Usar esta imagem aprovada como foto principal de ${descricao}?`)) return;
            confirmar.disabled = true;
            aviso.textContent = "Salvando foto principal no catalogo...";
            try {
                const dados = await buscarJSON(urlLote(loteId, `/publicar/${imagemId}`), {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ produto_chave: seletor.value, cor: corProduto.value })
                });
                aviso.textContent = dados.mensagem || "Foto associada ao produto.";
            } catch (erro) {
                aviso.textContent = `Nao foi possivel usar a imagem no site: ${erro.message}`;
            } finally { confirmar.disabled = false; }
        });
        painel.append(abrir, seletor, corProduto, confirmar, aviso);
        return painel;
    }

    async function excluirImagem(loteId, imagemId, botao) {
        if (!window.confirm("Excluir definitivamente esta imagem NAO APROVADA? O arquivo PNG sera removido do historico e do disco. Esta acao nao pode ser desfeita.")) return;
        botao.disabled = true;
        try {
            const dados = await buscarJSON(urlLote(loteId, `/imagens/${imagemId}`), { method: "DELETE" });
            alerta($("historicoStatus"), dados.aviso || dados.mensagem || "Imagem excluida.");
            const lote = await carregarDetalhes(loteId);
            if (!$("resultadoGeracao").hidden && $("resultadoGeracao").dataset.loteId === String(loteId)) mostrarResultado(lote);
            if (!$("detalhesHistorico").hidden && $("detalhesHistorico").dataset.loteId === String(loteId)) montarGrade($("gridDetalhes"), lote.imagens, lote.id);
            await atualizarHistorico(true);
        } catch (erro) {
            botao.disabled = false;
            alerta($("historicoStatus"), `Falha ao excluir: ${erro.message}`, true);
        }
    }

    async function excluirAntiga(imagemId, botao) {
        if (!window.confirm("Excluir definitivamente esta imagem antiga NAO APROVADA?")) return;
        botao.disabled = true;
        try {
            const dados = await buscarJSON(`/api/geracoes-imagens/antigas/${imagemId}`, { method: "DELETE" });
            await atualizarHistorico(true);
            alerta($("historicoStatus"), dados.aviso || dados.mensagem || "Imagem antiga excluida.");
        } catch (erro) {
            botao.disabled = false;
            alerta($("historicoStatus"), `Nao foi possivel excluir imagem antiga: ${erro.message}`, true);
        }
    }

    function mostrarResultado(lote) {
        const secao = $("resultadoGeracao");
        secao.dataset.loteId = String(lote.id);
        const total = montarGrade($("gridResultados"), lote.imagens, lote.id);
        $("resultadoResumo").textContent = `${lote.modelo_nome || lote.modelo_codigo || "Modelo"} • ${total} imagem(ns) salva(s) • ${formatarData(lote.criado_em)}`;
        const zip = $("baixarZipResultado");
        zip.hidden = !total;
        zip.href = window.GoldFitDemoStatic ? "#" : total ? urlLote(lote.id, "/baixar-zip") : "#";
        if (window.GoldFitDemoStatic) zip.hidden = true;
        $("resultadoAviso").textContent = lote.status === "parcial"
            ? `O lote terminou parcialmente: ${lote.mensagem_erro || "Confira as imagens e tente gerar novamente os ângulos que faltaram."}`
            : lote.status === "erro"
                ? `A geração falhou: ${lote.mensagem_erro || "Verifique os logs do painel."}`
                : "Revise logotipos, tecidos, costuras, costas e calçados antes de publicar. Detalhes ocultos podem ter sido estimados pela IA.";
        secao.hidden = false;
    }

    async function carregarDetalhes(id) {
        const rota = urlLote(id);
        if (!rota) throw new Error("Número do lote inválido.");
        const json = await buscarJSON(rota);
        if (!json.lote) throw new Error("O servidor não retornou o lote.");
        return json.lote;
    }

    async function acompanharLote(id) {
        loteAcompanhado = String(id);
        let ultimoStatus = "";
        for (let tentativa = 0; tentativa < LIMITE_CONSULTAS && !cancelado; tentativa++) {
            const lote = await carregarDetalhes(id);
            if (loteAcompanhado !== String(id)) return;
            const atual = lote.status;
            const total = (lote.imagens || []).length;
            const esperado = (lote.angulos_solicitados || []).length;
            if (atual !== ultimoStatus || total > 0) {
                alerta(campoStatus, `Lote #${id}: ${TEXTOS_STATUS[atual] || atual}. ${total} de ${esperado} imagem(ns) concluída(s).`);
                ultimoStatus = atual;
            }
            if (["concluida", "parcial", "erro"].includes(atual)) {
                mostrarResultado(lote);
                await atualizarHistorico(true);
                if (atual === "erro") alerta(campoStatus, `O lote #${id} falhou: ${lote.mensagem_erro || "Confira o log do painel."}`, true);
                else alerta(campoStatus, `Lote #${id} finalizado. ${total} imagem(ns) salva(s) automaticamente.`);
                $("resultadoGeracao").scrollIntoView({ behavior: "smooth", block: "start" });
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        if (!cancelado) {
            alerta(campoStatus, `Acompanhamento encerrado por tempo. O lote #${id} continua registrado no histórico; use Atualizar histórico para consultar o status.`, true);
        }
    }

    async function excluirLote(lote, botao) {
        const mensagem = `Excluir definitivamente a geracao #${lote.id} e TODAS as suas fotos nao aprovadas, inclusive versoes corrigidas?\n\nOs arquivos e o historico serao apagados. Essa acao nao pode ser desfeita.`;
        if (!window.confirm(mensagem)) return;
        botao.disabled = true;
        try {
            const dados = await buscarJSON(urlLote(lote.id), { method: "DELETE" });
            if (!$('detalhesHistorico').hidden && $('detalhesHistorico').dataset.loteId === String(lote.id)) {
                $('detalhesHistorico').hidden = true;
            }
            if (!$('resultadoGeracao').hidden && $('resultadoGeracao').dataset.loteId === String(lote.id)) {
                $('resultadoGeracao').hidden = true;
            }
            await atualizarHistorico(true);
            alerta($('historicoStatus'), dados.mensagem || 'Geracao removida.');
        } catch (erro) {
            botao.disabled = false;
            alerta($('historicoStatus'), `Falha ao excluir geracao: ${erro.message}`, true);
        }
    }

    function criarHistoricoCard(lote) {
        const item = no("article", "gf3-history-item");
        const url = enderecoSeguro(lote.capa, "gerada") || enderecoSeguro(lote.foto_produto_original, "original");
        const capa = no("div", "gf3-history-cover");
        if (url) {
            const img = no("img");
            img.src = url;
            img.alt = `Capa do lote ${lote.id}`;
            img.loading = "lazy";
            capa.append(img);
        } else capa.textContent = "GOLD FIT";
        const detalhes = no("div", "gf3-history-info");
        detalhes.append(
            seloStatus(lote.status),
            no("strong", "gf3-history-title", lote.nome_produto || "Produto sem nome"),
            no("span", "", `${lote.modelo_nome || lote.modelo_codigo || "Modelo"} • ${formatarData(lote.criado_em)}`),
            no("small", "", `${lote.total_imagens || 0} imagem(ns) • ${Array.isArray(lote.angulos_solicitados) ? lote.angulos_solicitados.map(a => NOMES[a] || a).join(" / ") : ""}`)
        );
        const abrir = no("button", "gf3-detail-button", "Ver imagens / baixar");
        abrir.type = "button";
        abrir.addEventListener("click", () => abrirDetalhes(lote.id));
        detalhes.append(abrir);
        if (Number(lote.total_aprovadas || 0) === 0 &&
            Number(lote.correcoes_em_andamento || 0) === 0 && lote.status !== "processando") {
            const excluir = no("button", "gf4-review-button gf7-delete gf10-delete-batch", "Excluir geração");
            excluir.type = "button";
            excluir.setAttribute("aria-label", `Excluir lote #${lote.id} e todas as versoes nao aprovadas`);
            excluir.addEventListener("click", () => excluirLote(lote, excluir));
            detalhes.append(excluir);
        } else if (Number(lote.total_aprovadas || 0) > 0) {
            detalhes.append(no("small", "gf9-historical", "Lote com foto aprovada: exclua apenas as fotos nao aprovadas individualmente."));
        }
        item.append(capa, detalhes);
        return item;
    }

    async function abrirDetalhes(id) {
        try {
            const lote = await carregarDetalhes(id);
            const caixa = $("detalhesHistorico");
            caixa.dataset.loteId = String(lote.id);
            $("tituloDetalhes").textContent = `Lote #${id} • ${lote.nome_produto || "Produto"}`;
            $("resumoDetalhes").textContent = `${lote.modelo_nome} • ${formatarData(lote.criado_em)} • ${TEXTOS_STATUS[lote.status] || lote.status}${lote.mensagem_erro ? " • " + lote.mensagem_erro : ""}`;
            const total = montarGrade($("gridDetalhes"), lote.imagens, lote.id);
            $("zipDetalhes").hidden = !total;
            $("zipDetalhes").href = window.GoldFitDemoStatic ? "#" : total ? urlLote(lote.id, "/baixar-zip") : "#";
            if (window.GoldFitDemoStatic) $("zipDetalhes").hidden = true;
            caixa.hidden = false;
            caixa.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (erro) {
            alerta($("historicoStatus"), `Não foi possível abrir o lote: ${erro.message}`, true);
        }
    }

    function historicoAntigo(antigas) {
        const lista = $("listaAntigas");
        const secao = $("historicoAntigo");
        lista.replaceChildren();
        const anteriores = (Array.isArray(antigas) ? antigas : []).filter(a => enderecoSeguro(a.url, "gerada")).slice(0, 24);
        secao.hidden = !anteriores.length;
        anteriores.forEach(registro => {
            const url = enderecoSeguro(registro.url, "gerada");
            const card = no("article", "gf3-old-card");
            const foto = no("img");
            foto.src = url;
            foto.alt = `Geração anterior ${registro.modelo_nome || ""}`;
            foto.loading = "lazy";
            const link = no("a", "gf3-download", "Baixar PNG ↓");
            link.href = url;
            link.download = `goldfit-antiga-${registro.geracao_id}.png`;
            card.append(foto, no("strong", "", `${registro.modelo_nome || "Modelo"} • ${NOMES[registro.angulo] || registro.angulo || "Frente"}`), link);
            if (registro.imagem_id && registro.status_revisao !== "aprovada") {
                const excluir = no("button", "gf4-review-button gf7-delete", "Excluir foto antiga");
                excluir.type = "button";
                excluir.addEventListener("click", () => excluirAntiga(registro.imagem_id, excluir));
                card.append(excluir);
            }
            lista.append(card);
        });
    }

    async function atualizarHistorico(silencioso = false) {
        const estado = $("historicoStatus");
        if (!silencioso) alerta(estado, "Atualizando registros...");
        try {
            const dados = await buscarJSON("/api/geracoes-imagens?pagina=1");
            const lotes = Array.isArray(dados.lotes) ? dados.lotes : [];
            const lista = $("listaHistorico");
            lista.replaceChildren();
            if (!lotes.length) lista.append(no("p", "gf3-empty", "Nenhum lote registrado ainda. Sua próxima geração aparecerá aqui automaticamente."));
            else lotes.forEach(lote => lista.append(criarHistoricoCard(lote)));
            historicoAntigo(dados.geracoes_antigas);
            alerta(estado, `${lotes.length} lote(s) recente(s) encontrado(s). Arquivos disponíveis para download.`);
        } catch (erro) {
            alerta(estado, `Histórico indisponível: ${erro.message}`, true);
        }
    }

    async function enviarGeracao(evento) {
        evento.preventDefault();
        if (trabalhando) return;
        const modelo = modeloAtual();
        try {
            const arquivo = arquivoInput.files[0];
            validarArquivo(arquivo);
            if (!modelo) throw new Error("Selecione uma modelo.");
            if (!chaveConfigurada) throw new Error("OPENAI_API_KEY não configurada no painel.");
            const referenciasAdicionais = validarReferenciasAdicionais();
            const angulos = angulosSelecionados();
            if (!angulos.length) throw new Error("Selecione pelo menos um ângulo para gerar.");

            const dados = new FormData();
            dados.set("fotoProduto", arquivo);
            dados.set("origemFotoPrincipal", $("origemFotoPrincipal")?.value || "auto");
            for (const referencia of referenciasAdicionais) {
                dados.set(referencia.campo, referencia.arquivo);
                dados.set("origemFoto" + referencia.campo.slice(4), $("origemFoto" + referencia.campo.slice(4))?.value || "auto");
            }
            dados.set("modeloCodigo", modelo.codigo);
            dados.set("nomeProduto", $("nomeProduto").value.trim() || `Produto ${modelo.codigo}`);
            dados.set("detalhes", $("detalhes").value.trim());
            dados.set("angulos", JSON.stringify(angulos));

            trabalhando = true;
            habilitarGeracao();
            botaoGerar.textContent = "GERANDO...";
            $("resultadoGeracao").hidden = true;
            alerta(campoStatus, `Enviando pedido de ${angulos.length} imagem(ns). A foto original será salva automaticamente.`);

            const resposta = await buscarJSON("/api/geracao-imagens", { method: "POST", body: dados });
            if (!resposta.loteId) throw new Error("O servidor não informou o número do lote.");
            await atualizarHistorico(true);
            if (resposta.status === "processando") {
                alerta(campoStatus, `Lote #${resposta.loteId} recebido. Acompanhando os ângulos enquanto o backend gera as imagens...`);
                await acompanharLote(resposta.loteId);
            } else {
                const lote = await carregarDetalhes(resposta.loteId);
                mostrarResultado(lote);
                alerta(campoStatus, `Imagem salva automaticamente no lote #${resposta.loteId}.`);
                $("resultadoGeracao").scrollIntoView({ behavior: "smooth", block: "start" });
            }
        } catch (erro) {
            alerta(campoStatus, erro.message || "Falha desconhecida ao gerar.", true);
            await atualizarHistorico(true);
        } finally {
            trabalhando = false;
            atualizarModo();
            habilitarGeracao();
        }
    }

    async function iniciar() {
        const [modeloResp, statusResp] = await Promise.allSettled([
            buscarJSON(`/api/modelos-virtuais?genero=feminino&estilo=${ESTILO}`),
            buscarJSON("/api/geracao-imagens/status")
        ]);
        if (modeloResp.status === "fulfilled") {
            modelos = (Array.isArray(modeloResp.value.modelos) ? modeloResp.value.modelos : [])
                .filter(m => /^F0[1-5]$/.test(String(m.codigo)) && enderecoSeguro(m.foto_principal, "modelo"));
            if (modelos.length) {
                carregarCarrossel();
                $("modeloAviso").textContent = window.GoldFitDemoStatic
                    ? `${modelos.length} modelos • referências exportadas para demonstração. Use as setas ou as miniaturas.`
                    : `${modelos.length} modelos • ${modeloResp.value.total_referencias || 0} referências no PostgreSQL. Use as setas ou as miniaturas.`;
            } else alerta($("modeloAviso"), "Nenhuma modelo com foto principal cadastrada. Confira o PostgreSQL.", true);
        } else alerta($("modeloAviso"), `Erro ao consultar modelos: ${modeloResp.reason.message}`, true);

        if (statusResp.status === "fulfilled") {
            chaveConfigurada = statusResp.value.disponivel === true;
            alerta($("apiStatus"), chaveConfigurada
                ? "Gerador conectado ao painel. Chave configurada; crédito e permissão são verificados pela API durante a geração."
                : window.GoldFitDemoStatic
                    ? "Modo acadêmico: selecione modelos, carregue fotos e consulte o histórico exportado. Geração IA indisponível sem API."
                    : "Chave da API não configurada. Defina OPENAI_API_KEY no .env da raiz e recrie o painel.", !chaveConfigurada);
        } else alerta($("apiStatus"), `Falha ao verificar a API: ${statusResp.reason.message}`, true);

        habilitarGeracao();
        await atualizarHistorico(true);
    }

    window.addEventListener("goldfit:correcao-concluida", async evento => {
        const loteId = evento.detail?.loteId;
        if (!loteId) return;
        try {
            const lote = await carregarDetalhes(loteId);
            mostrarResultado(lote);
            if (!$('detalhesHistorico').hidden && $('detalhesHistorico').dataset.loteId === String(loteId)) {
                montarGrade($('gridDetalhes'), lote.imagens, lote.id);
            }
            await atualizarHistorico(true);
            alerta($('historicoStatus'), `Correção v${evento.detail.versao} salva. Aprove a nova foto depois de conferir o resultado.`);
        } catch (erro) { alerta($('historicoStatus'), `Foto salva, mas a tela não atualizou: ${erro.message}`, true); }
    });

    $("modeloAnterior").addEventListener("click", () => selecionarModelo(indiceModelo - 1));
    $("proximaModelo").addEventListener("click", () => selecionarModelo(indiceModelo + 1));
    form.querySelectorAll('input[name="modoGeracao"], input[name="anguloPersonalizado"]').forEach(item => item.addEventListener("change", atualizarModo));
    arquivoInput.addEventListener("change", mudarFoto);
    CAMPOS_REFERENCIAS.forEach(campo => $(campo.id)?.addEventListener("change", atualizarReferenciasAdicionais));
    form.addEventListener("submit", enviarGeracao);
    $("atualizarHistorico").addEventListener("click", () => atualizarHistorico(false));
    $("fecharDetalhes").addEventListener("click", () => { $("detalhesHistorico").hidden = true; });
    window.addEventListener("pagehide", () => { cancelado = true; if (urlPreview) URL.revokeObjectURL(urlPreview); });

    atualizarModo();
    iniciar().catch(erro => alerta($("apiStatus"), `Não foi possível iniciar o estúdio: ${erro.message}`, true));
})();
