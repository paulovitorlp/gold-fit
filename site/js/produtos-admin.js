const sessaoAdmin =
    goldFitCarregarSessao();


if (
    !sessaoAdmin
    ||
    sessaoAdmin.perfil !==
        "admin"
) {

    window.location.replace(
        "../login.html?next=admin/produtos.html"
    );

}


// ======================================================
// CATEGORIAS
// ======================================================

const categoriasProdutosAdmin = {

    Feminino: [
        "Conjuntos",
        "Croppeds",
        "Saias",
        "Macaquinhos",
        "Shorts",
        "Jaquetas"
    ],

    Masculino: [
        "Camisetas",
        "Shorts"
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
        function (
            event
        ) {

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
                                    class="edit-product-button"
                                    data-editar-produto="${encodeURIComponent(
                                        item.chave
                                    )}"
                                >
                                    EDITAR
                                </button>

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

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

function salvarProdutoSite(
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

        publicado:
            campoPublicado.checked,

        destaque:
            campoDestaque.checked,

        lancamento:
            campoLancamento.checked,

        ordem:
            ordem

    };


    produtosSite[
        indice
    ] =
        produtoAtualizado;


    goldFitSalvarProdutosSite(
        produtosSite
    );


    // ==================================================
    // SINCRONIZAR CAMPOS COM AS VARIAÇÕES DO ESTOQUE
    //
    // Cor, tamanho, SKU e quantidade continuam
    // pertencendo ao módulo Estoque.
    // ==================================================

    const estoqueBase =
        goldFitCarregarEstoqueBase();


    const estoqueAtualizado =
        estoqueBase.map(
            variacao => {

                const chaveVariacao =
                    goldFitChaveProduto(
                        variacao.produto,
                        variacao.marca
                    );


                if (
                    chaveVariacao !==
                    chave
                ) {

                    return variacao;

                }


                return {

                    ...variacao,

                    grupo:
                        produtoAtualizado.grupo,

                    categoria:
                        produtoAtualizado.categoria,

                    preco:
                        produtoAtualizado.preco,

                    foto:
                        fotoFoiAlterada
                            ?
                            produtoAtualizado.fotoPrincipal
                            :
                            variacao.foto

                };

            }
        );


    goldFitSalvarEstoque(
        estoqueAtualizado
    );


    fecharModal();


    renderizarTudo();


    mostrarToast(
        "Produto atualizado no site."
    );

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