const sessaoAdmin =
    goldFitCarregarSessao();


if (
    !sessaoAdmin
    ||
    sessaoAdmin.perfil !==
        "admin"
) {

    window.location.replace(
        "../login.html?modo=admin&next=admin/produtos.html"
    );

}


// ======================================================
// CATEGORIAS
// ======================================================

const categoriasProdutosAdmin = {

    Masculino: ["Camisetas", "Shorts", "Calças", "Jaquetas", "Conjuntos"],

    Feminino: [
        "Conjuntos",
        "Croppeds",
        "Saias",
        "Macaquinhos",
        "Shorts",
        "Jaquetas"
    ],

    Calçados: [
        "Tênis"
    ],

    Acessórios: [
        "Meias"
    ]

};


// ======================================================
// ESTADO
// ======================================================

let produtosSite =
    goldFitCarregarProdutosSite();


let termoPesquisa =
    "";


let filtroAtual =
    "Todos";


let fotoFoiAlterada =
    false;

// A tabela do site lista MODELOS, e expande todas as cores e tamanhos do estoque.
let gf19Expandido = new Set();


// ======================================================
// ELEMENTOS
// ======================================================

const tabela =
    document.getElementById(
        "tabelaProdutosSite"
    );


const campoPesquisa =
    document.getElementById(
        "campoPesquisaProduto"
    );


const filtro =
    document.getElementById(
        "filtroProdutoSite"
    );


const modal =
    document.getElementById(
        "modalProdutoOverlay"
    );


const form =
    document.getElementById(
        "formProdutoSite"
    );


const campoChave =
    document.getElementById(
        "produtoSiteChave"
    );


const campoNome =
    document.getElementById(
        "produtoSiteNome"
    );


const campoMarca =
    document.getElementById(
        "produtoSiteMarca"
    );


const campoPreco =
    document.getElementById(
        "produtoSitePreco"
    );


const campoGrupo =
    document.getElementById(
        "produtoSiteGrupo"
    );


const campoCategoria =
    document.getElementById(
        "produtoSiteCategoria"
    );


const campoOrdem =
    document.getElementById(
        "produtoSiteOrdem"
    );


const campoPublicado =
    document.getElementById(
        "produtoSitePublicado"
    );


const campoDestaque =
    document.getElementById(
        "produtoSiteDestaque"
    );


const campoLancamento =
    document.getElementById(
        "produtoSiteLancamento"
    );


const campoFoto =
    document.getElementById(
        "produtoSiteFoto"
    );


const campoFotoBase64 =
    document.getElementById(
        "produtoSiteFotoBase64"
    );


const preview =
    document.getElementById(
        "produtoSitePreview"
    );


const toast =
    document.getElementById(
        "toastProdutos"
    );


// ======================================================
// INICIALIZAÇÃO
// ======================================================

iniciar();


function iniciar() {

    preencherConta();

    configurarEventos();

    renderizarTudo();
    const chave = new URLSearchParams(window.location.search).get("produto");
    if (chave) abrirEdicao(chave);

}


// ======================================================
// CONTA
// ======================================================

function preencherConta() {

    const nome =
        sessaoAdmin.nome
        ||
        "Administrador Gold Fit";


    document
        .getElementById(
            "adminNome"
        )
        .textContent =
        nome;


    document
        .getElementById(
            "adminEmail"
        )
        .textContent =
        sessaoAdmin.email
        ||
        "";


    document
        .getElementById(
            "adminAvatar"
        )
        .textContent =
        nome
            .charAt(
                0
            )
            .toUpperCase();

}


// ======================================================
// EVENTOS
// ======================================================

function configurarEventos() {


    campoPesquisa.addEventListener(
        "input",
        function () {

            termoPesquisa =
                campoPesquisa
                    .value
                    .trim()
                    .toLowerCase();


            renderizarTabela();

        }
    );


    filtro.addEventListener(
        "change",
        function () {

            filtroAtual =
                filtro.value;


            renderizarTabela();

        }
    );


    tabela.addEventListener(
        "click",
        async function (
            event
        ) {

            const publicar = event.target.closest("[data-gf21-publicar]");
            if (publicar) {
                const chave = decodeURIComponent(publicar.dataset.gf21Publicar);
                const indice = produtosSite.findIndex(p => p.chave === chave);
                if (indice < 0) return;
                const antes = produtosSite[indice];
                const novoValor = publicar.checked;
                publicar.disabled = true;
                try {
                    const resp = await fetch("/api/loja/modelo", {
                        method: "POST", credentials: "same-origin",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ chave, alteracoes: { publicado: novoValor } })
                    });
                    const dados = await resp.json().catch(() => ({}));
                    if (!resp.ok || dados.status !== "ok") throw new Error(dados.mensagem || "Erro do banco");
                    produtosSite[indice] = dados.modelo;
                    localStorage.setItem(GOLD_FIT_PRODUCTS_KEY, JSON.stringify(produtosSite));
                    renderizarTudo();
                    mostrarToast(publicar.checked ? (window.GoldFitDemoStatic ? "Publicado nesta demonstração. Cores com foto de modelo ficarão visíveis." : "Publicado no banco. As cores com fotos de modelo ficarão visíveis.") : "Produto retirado do site.");
                } catch (erro) {
                    produtosSite[indice] = antes;
                    localStorage.setItem(GOLD_FIT_PRODUCTS_KEY, JSON.stringify(produtosSite));
                    publicar.checked = antes.publicado !== false;
                    publicar.disabled = false;
                    mostrarToast(`Erro ao publicar: ${erro.message}`);
                }
                return;
            }
            const abrir = event.target.closest("[data-gf19-abrir]");
            if (abrir) {
                const chave = decodeURIComponent(abrir.dataset.gf19Abrir);
                if (gf19Expandido.has(chave)) gf19Expandido.delete(chave);
                else gf19Expandido.add(chave);
                renderizarTabela();
                return;
            }
            const salvar = event.target.closest("[data-gf19-salvar]");
            if (salvar) {
                const linha = salvar.closest("tr");
                const campo = linha?.querySelector("[data-gf19-quantidade]");
                const quantidade = Number(campo?.value);
                if (!Number.isSafeInteger(quantidade) || quantidade < 0) {
                    mostrarToast("Quantidade deve ser um numero inteiro maior ou igual a zero.");
                    return;
                }
                const id = Number(salvar.dataset.gf19Salvar);
                const estoqueBase = goldFitCarregarEstoqueBase();
                const indice = estoqueBase.findIndex(item => Number(item.id) === id);
                if (indice < 0) return mostrarToast("Variacao nao encontrada. Recarregue a pagina.");
                const anterior = estoqueBase[indice].quantidade;
                estoqueBase[indice].quantidade = quantidade;
                salvar.disabled = true;
                try {
                    const resposta = await fetch("/api/loja/variacao", {
                        method: "POST", credentials: "same-origin", cache: "no-store",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ acao: "quantidade", id, quantidade })
                    });
                    const dados = await resposta.json().catch(() => ({}));
                    if (!resposta.ok || dados.status !== "ok") throw new Error(dados.mensagem || "Falha no banco.");
                    sessionStorage.setItem("gf21_salvo", (window.GoldFitDemoStatic ? "Quantidade atualizada neste navegador." : "Quantidade atualizada no PostgreSQL."));
                    window.location.reload();
                    return;
                    renderizarTudo();
                    mostrarToast((window.GoldFitDemoStatic ? "Quantidade atualizada neste navegador." : "Quantidade atualizada no PostgreSQL."));
                } catch (erro) {
                    estoqueBase[indice].quantidade = anterior;
                    localStorage.setItem(GOLD_FIT_STOCK_KEY, JSON.stringify(estoqueBase));
                    salvar.disabled = false;
                    mostrarToast(`Falha ao salvar no banco: ${erro.message}`);
                }
                return;
            }
            const botao =
                event.target.closest(
                    "[data-editar-produto]"
                );


            if (
                !botao
            ) {

                return;

            }


            abrirEdicao(

                decodeURIComponent(
                    botao.dataset.editarProduto
                )

            );

        }
    );


    campoGrupo.addEventListener(
        "change",
        function () {

            atualizarCategorias();

        }
    );


    campoFoto.addEventListener(
        "change",
        processarFoto
    );


    document
        .getElementById(
            "btnRemoverFoto"
        )
        .addEventListener(
            "click",
            removerFoto
        );


    document
        .getElementById(
            "btnFecharProduto"
        )
        .addEventListener(
            "click",
            fecharModal
        );


    document
        .getElementById(
            "btnCancelarProduto"
        )
        .addEventListener(
            "click",
            fecharModal
        );


    modal.addEventListener(
        "click",
        function (
            event
        ) {

            if (
                event.target ===
                modal
            ) {

                fecharModal();

            }

        }
    );


    form.addEventListener(
        "submit",
        salvarProdutoSite
    );


    document
        .getElementById(
            "btnSairAdmin"
        )
        .addEventListener(
            "click",
            function () {

                goldFitSair();


                window.location.href =
                    "../index.html";

            }
        );


    document
        .querySelectorAll(
            ".modulo-futuro"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    function (
                        event
                    ) {

                        event.preventDefault();


                        mostrarToast(
                            "Este módulo será implementado em uma próxima etapa."
                        );

                    }
                );

            }
        );

}


// ======================================================
// RENDERIZAÇÃO
// ======================================================

function renderizarTudo() {

    produtosSite =
        goldFitCarregarProdutosSite();


    renderizarResumo();

    renderizarTabela();

}


function renderizarResumo() {

    document
        .getElementById(
            "statProdutos"
        )
        .textContent =
        produtosSite.length;


    document
        .getElementById(
            "statPublicados"
        )
        .textContent =
        produtosSite.filter(
            item =>
                item.publicado !==
                false
        ).length;


    document
        .getElementById(
            "statDestaques"
        )
        .textContent =
        produtosSite.filter(
            item =>
                item.destaque
        ).length;


    document
        .getElementById(
            "statLancamentos"
        )
        .textContent =
        produtosSite.filter(
            item =>
                item.lancamento
        ).length;

}


// ======================================================
// FILTRO
// ======================================================

function produtosFiltrados() {

    return produtosSite
        .filter(
            item => {

                const texto =
                    `
                    ${item.produto}
                    ${item.marca}
                    ${item.grupo}
                    ${item.categoria}
                    `
                    .toLowerCase();


                if (
                    !texto.includes(
                        termoPesquisa
                    )
                ) {

                    return false;

                }


                if (
                    filtroAtual ===
                    "Publicados"
                ) {

                    return (
                        item.publicado !==
                        false
                    );

                }


                if (
                    filtroAtual ===
                    "Ocultos"
                ) {

                    return (
                        item.publicado ===
                        false
                    );

                }


                if (
                    filtroAtual ===
                    "Destaques"
                ) {

                    return Boolean(
                        item.destaque
                    );

                }


                if (
                    filtroAtual ===
                    "Lancamentos"
                ) {

                    return Boolean(
                        item.lancamento
                    );

                }


                return true;

            }
        )
        .sort(
            (
                a,
                b
            ) =>

                Number(
                    a.ordem
                    ||
                    9999
                )
                -
                Number(
                    b.ordem
                    ||
                    9999
                )

        );

}


// ======================================================
// TABELA
// ======================================================

function renderizarTabela() {

    const lista =
        produtosFiltrados();


    if (
        lista.length ===
        0
    ) {

        tabela.innerHTML =
            `
            <tr>

                <td
                    colspan="9"
                    class="empty-state"
                >
                    Nenhum produto encontrado.
                </td>

            </tr>
            `;


        return;

    }


    const estoque =
        goldFitCarregarEstoqueBase();


    tabela.innerHTML =
        lista
            .map(
                item => {


                    const variacoes =
                        estoque.filter(
                            variacao =>
                                goldFitChaveProduto(
                                    variacao.produto,
                                    variacao.marca
                                )
                                ===
                                item.chave
                        );


                    const foto =
                        item.fotoPrincipal
                        ||
                        variacoes.find(
                            variacao =>
                                variacao.foto
                        )
                        ?.foto
                        ||
                        goldFitPlaceholder(
                            item
                        );


                    return `

                        <tr>

                            <td>

                                <img
                                    class="product-photo"
                                    src="${foto}"
                                    alt="${goldFitEscapeHtml(
                                        item.produto
                                    )}"
                                >

                            </td>


                            <td>

                                <div class="product-site-name">

                                    <strong>
                                        ${goldFitEscapeHtml(
                                            item.produto
                                        )}
                                    </strong>

                                    <small>
                                        ${goldFitEscapeHtml(
                                            item.marca
                                        )}
                                        ·
                                        ${variacoes.length}
                                        variação(ões)
                                    </small>

                                </div>

                            </td>


                            <td>

                                ${goldFitEscapeHtml(
                                    item.grupo
                                )}

                                <br>

                                <small>
                                    ${goldFitEscapeHtml(
                                        item.categoria
                                    )}
                                </small>

                            </td>


                            <td>

                                <span class="product-site-price">

                                    ${goldFitFormatarPreco(
                                        item.preco
                                    )}

                                </span>

                            </td>


                            <td>

                                <span
                                    class="
                                        site-badge
                                        ${
                                            item.publicado !==
                                            false
                                                ?
                                                "published"
                                                :
                                                "hidden-site"
                                        }
                                    "
                                >

                                    ${
                                        item.publicado !==
                                        false
                                            ?
                                            "PUBLICADO"
                                            :
                                            "OCULTO"
                                    }

                                </span>
                                <label class="gf21-publish-switch" title="Publicar ou ocultar este modelo na loja">
                                    <input type="checkbox" data-gf21-publicar="${encodeURIComponent(item.chave)}" ${item.publicado !== false ? "checked" : ""}>
                                    <span>PUBLICAR</span>
                                </label>
                            </td>


                            <td>

                                <span
                                    class="
                                        site-flag
                                        ${
                                            item.destaque
                                                ?
                                                "yes"
                                                :
                                                "no"
                                        }
                                    "
                                >
                                    ${
                                        item.destaque
                                            ?
                                            "✓"
                                            :
                                            "−"
                                    }
                                </span>
                                <label class="gf21-publish-switch" title="Publicar ou ocultar este modelo na loja">
                                    <input type="checkbox" data-gf21-publicar="${encodeURIComponent(item.chave)}" ${item.publicado !== false ? "checked" : ""}>
                                    <span>PUBLICAR</span>
                                </label>
                            </td>


                            <td>

                                <span
                                    class="
                                        site-flag
                                        ${
                                            item.lancamento
                                                ?
                                                "yes"
                                                :
                                                "no"
                                        }
                                    "
                                >
                                    ${
                                        item.lancamento
                                            ?
                                            "✓"
                                            :
                                            "−"
                                    }
                                </span>

                            </td>


                            <td>

                                ${Number(
                                    item.ordem
                                    ||
                                    0
                                )}

                            </td>


                            <td>

                                <button
                                    type="button"
                                    class="edit-product-button gf19-abrir"
                                    data-gf19-abrir="${encodeURIComponent(item.chave)}"
                                    aria-expanded="${gf19Expandido.has(item.chave)}"
                                >
                                    ${gf19Expandido.has(item.chave) ? "OCULTAR CORES" : "CORES / ESTOQUE"}
                                </button>
                                <button
                                    type="button"
                                    class="edit-product-button"
                                    data-editar-produto="${encodeURIComponent(
                                        item.chave
                                    )}"
                                >
                                    EDITAR / FOTOS
                                </button>
                                <button type="button" class="edit-product-button gf21-btn-add" data-gf21-add="${encodeURIComponent(item.chave)}">+ COR / TAMANHO</button>

                            </td>

                        </tr>
                        ${gf19RenderizarVariacoes(item.chave, variacoes)}
                    `;

                }
            )
            .join("");

}


// Um unico modelo; as variacoes sao linhas internas, e a quantidade
// e salva diretamente na mesma tela. O estoque antigo continua preservado.
function gf19RenderizarVariacoes(chave, variacoes) {
    if (!gf19Expandido.has(chave)) return "";
    const ordem = [...variacoes].sort((a,b) =>
        String(a.cor).localeCompare(String(b.cor), "pt-BR") ||
        String(a.tamanho).localeCompare(String(b.tamanho), "pt-BR"));
    const unidades = ordem.reduce((s,v) => s + Math.max(0,Number(v.quantidade)||0),0);
    const linhas = ordem.map(v => `<tr>
        <td>${goldFitEscapeHtml(v.cor)}</td>
        <td>${goldFitEscapeHtml(v.tamanho)}</td>
        <td>${goldFitEscapeHtml(v.sku)}</td>
        <td><input type="number" data-gf19-quantidade min="0" step="1" value="${Math.max(0,Number(v.quantidade)||0)}" aria-label="Quantidade de ${goldFitEscapeHtml(v.sku)}"></td>
        <td class="gf21-var-actions"><button type="button" data-gf19-salvar="${Number(v.id)}">SALVAR QTD.</button>
          <button type="button" data-gf21-editar="${Number(v.id)}">EDITAR</button>
          <button type="button" data-gf21-excluir="${Number(v.id)}">EXCLUIR</button></td>
    </tr>`).join("");
    return `<tr class="gf19-detalhes"><td colspan="9">
        <div class="gf19-variacoes-box">
            <p><strong>${ordem.length} variaç${ordem.length===1?"ão":"ões"} · ${unidades} unidade(s)</strong> — todas as cores e tamanhos deste modelo.</p>
            <table class="gf19-variacoes-tabela"><thead><tr><th>Cor</th><th>Tamanho</th><th>SKU</th><th>Quantidade</th><th>Ação</th></tr></thead>
              <tbody>${linhas}</tbody></table>
            <small>A cor so aparece na loja depois de ter uma foto de modelo vestindo-a aprovada em EDITAR / FOTOS.</small>
        </div></td></tr>`;
}

// ======================================================
// ABRIR EDIÇÃO
// ======================================================

function abrirEdicao(
    chave
) {

    const produto =
        produtosSite.find(
            item =>
                item.chave ===
                chave
        );


    if (
        !produto
    ) {

        return;

    }


    fotoFoiAlterada =
        false;


    campoChave.value =
        produto.chave;


    campoNome.value =
        produto.produto;


    campoMarca.value =
        produto.marca;


    campoPreco.value =
        Number(
            produto.preco
            ||
            0
        );


    campoGrupo.value =
        produto.grupo;


    atualizarCategorias(
        produto.categoria
    );


    campoOrdem.value =
        Number(
            produto.ordem
            ||
            0
        );


    campoPublicado.checked =
        produto.publicado !==
        false;


    campoDestaque.checked =
        Boolean(
            produto.destaque
        );


    campoLancamento.checked =
        Boolean(
            produto.lancamento
        );


    campoFotoBase64.value =
        produto.fotoPrincipal
        ||
        "";


    const estoque =
        goldFitCarregarEstoqueBase();


    const fotoEstoque =
        estoque.find(
            item =>
                goldFitChaveProduto(
                    item.produto,
                    item.marca
                )
                ===
                produto.chave

                &&

                item.foto
        )
        ?.foto;


    preview.src =
        produto.fotoPrincipal
        ||
        fotoEstoque
        ||
        goldFitPlaceholder(
            produto
        );


    campoFoto.value =
        "";


    const gf21CorCapa = document.getElementById("gf21CorCapa");
    if (gf21CorCapa) {
        gf21CorCapa.innerHTML = '<option value="">Automática — primeira cor com foto</option>';
        const cores = [...new Set(estoque.filter(v => goldFitChaveProduto(v.produto, v.marca) === produto.chave)
            .map(v => String(v.cor || "").trim()).filter(Boolean))];
        for (const cor of cores) {
            const option = document.createElement("option");
            option.value = cor;
            option.textContent = cor;
            gf21CorCapa.appendChild(option);
        }
        gf21CorCapa.value = produto.corCapa || "";
        // Opções sem foto aprovada ficam indisponíveis, sem apagar o estoque.
        fetch(`/api/galeria-produtos?chave=${encodeURIComponent(produto.chave)}`, { credentials: "same-origin", cache: "no-store" })
            .then(r => r.ok ? r.json() : Promise.reject(new Error("Galeria indisponível")))
            .then(dados => {
                if (campoChave.value !== produto.chave) return;
                const aprovadas = new Set((dados.fotos || []).filter(f => f.tipoFoto === "modelo")
                    .map(f => String(f.cor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase()));
                for (const opt of gf21CorCapa.options) {
                    if (!opt.value) continue;
                    const chave = opt.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
                    opt.disabled = !aprovadas.has(chave);
                    if (opt.disabled) opt.textContent += " (sem foto de modelo)";
                }
                if (gf21CorCapa.selectedOptions[0]?.disabled) gf21CorCapa.value = "";
            }).catch(erro => console.warn("Seleção de capa:", erro.message));
    }

    modal.classList.remove(
        "hidden"
    );

}


// ======================================================
// CATEGORIAS
// ======================================================

function atualizarCategorias(
    categoriaAtual =
        ""
) {

    const grupo =
        campoGrupo.value;


    const categorias =
        categoriasProdutosAdmin[
            grupo
        ]
        ||
        [];


    campoCategoria.innerHTML =
        categorias
            .map(
                categoria => {

                    return `
                        <option
                            value="${goldFitEscapeHtml(
                                categoria
                            )}"
                        >
                            ${goldFitEscapeHtml(
                                categoria
                            )}
                        </option>
                    `;

                }
            )
            .join("");


    if (
        categoriaAtual
    ) {

        campoCategoria.value =
            categoriaAtual;

    }

}


// ======================================================
// FOTO
// ======================================================

function processarFoto(
    event
) {

    const arquivo =
        event.target.files[
            0
        ];


    if (
        !arquivo
    ) {

        return;

    }


    if (
        !arquivo.type.startsWith(
            "image/"
        )
    ) {

        mostrarToast(
            "Selecione uma imagem válida."
        );


        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function (
            evento
        ) {


            const imagem =
                new Image();


            imagem.onload =
                function () {


                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    const limite =
                        1200;


                    let largura =
                        imagem.width;


                    let altura =
                        imagem.height;


                    if (
                        largura >
                        limite

                        ||

                        altura >
                        limite
                    ) {

                        const proporcao =
                            Math.min(

                                limite /
                                largura,

                                limite /
                                altura

                            );


                        largura =
                            Math.round(
                                largura *
                                proporcao
                            );


                        altura =
                            Math.round(
                                altura *
                                proporcao
                            );

                    }


                    canvas.width =
                        largura;


                    canvas.height =
                        altura;


                    const contexto =
                        canvas.getContext(
                            "2d"
                        );


                    contexto.drawImage(

                        imagem,

                        0,

                        0,

                        largura,

                        altura

                    );


                    const resultado =
                        canvas.toDataURL(
                            "image/jpeg",
                            0.84
                        );


                    campoFotoBase64.value =
                        resultado;


                    preview.src =
                        resultado;


                    fotoFoiAlterada =
                        true;

                };


            imagem.src =
                evento.target.result;

        };


    reader.readAsDataURL(
        arquivo
    );

}


function removerFoto() {

    campoFotoBase64.value =
        "";


    fotoFoiAlterada =
        true;


    preview.src =
        goldFitPlaceholder({

            produto:
                campoNome.value,

            marca:
                campoMarca.value

        });

}


// ======================================================
// SALVAR
// ======================================================

async function salvarProdutoSite(
    event
) {

    event.preventDefault();


    const chave =
        campoChave.value;


    const indice =
        produtosSite.findIndex(
            item =>
                item.chave ===
                chave
        );


    if (
        indice <
        0
    ) {

        return;

    }


    const preco =
        Number(
            campoPreco.value
        );


    const ordem =
        Number(
            campoOrdem.value
        );


    if (
        preco <
        0
        ||
        !Number.isFinite(
            preco
        )
    ) {

        mostrarToast(
            "Informe um preço válido."
        );


        return;

    }


    if (
        ordem <
        0
        ||
        !Number.isFinite(
            ordem
        )
    ) {

        mostrarToast(
            "Informe uma ordem válida."
        );


        return;

    }


    const produtoAtualizado = {

        ...produtosSite[
            indice
        ],

        grupo:
            campoGrupo.value,

        categoria:
            campoCategoria.value,

        preco:
            preco,

        fotoPrincipal:
            campoFotoBase64.value,

        corCapa: document.getElementById("gf21CorCapa")?.value || "",

        publicado:
            campoPublicado.checked,

        destaque:
            campoDestaque.checked,

        lancamento:
            campoLancamento.checked,

        ordem:
            ordem

    };


    try {
        const resposta = await fetch("/api/loja/modelo", {
            method: "POST", credentials: "same-origin", cache: "no-store",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chave, alteracoes: {
                grupo: produtoAtualizado.grupo, categoria: produtoAtualizado.categoria,
                preco: produtoAtualizado.preco, fotoPrincipal: produtoAtualizado.fotoPrincipal,
                corCapa: produtoAtualizado.corCapa, publicado: produtoAtualizado.publicado,
                destaque: produtoAtualizado.destaque, lancamento: produtoAtualizado.lancamento,
                ordem: produtoAtualizado.ordem
            } })
        });
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok || dados.status !== "ok") throw new Error(dados.mensagem || "Erro ao salvar no banco");
        produtosSite[indice] = dados.modelo;
        localStorage.setItem(GOLD_FIT_PRODUCTS_KEY, JSON.stringify(produtosSite));
        // Preço/categoria das variações serão sincronizados na leitura do banco.
    } catch (erro) {
        console.error("Falha ao publicar:", erro);
        mostrarToast(`Falha ao publicar no PostgreSQL: ${erro.message}`);
        return;
    }

    fecharModal();
    renderizarTudo();
    mostrarToast((window.GoldFitDemoStatic ? "Publicação salva nesta demonstração. Atualize a vitrine para conferir." : "Publicacao confirmada no banco. Atualize a vitrine para conferir."));

}


// ======================================================
// FECHAR MODAL
// ======================================================

function fecharModal() {

    modal.classList.add(
        "hidden"
    );


    fotoFoiAlterada =
        false;

}


// ======================================================
// TOAST
// ======================================================

let toastTimer;


function mostrarToast(
    mensagem
) {

    clearTimeout(
        toastTimer
    );


    toast.textContent =
        mensagem;


    toast.classList.add(
        "show"
    );


    toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}
// V27: refletir sincronizacao da API sem desmontar a pagina administrativa.
window.addEventListener("goldfit:estado-atualizado", () => {
    // Durante a edicao, nao substituir os campos preenchidos pelo administrador.
    if (modal && !modal.classList.contains("hidden")) return;
    renderizarTudo();
});
