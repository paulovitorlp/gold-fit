const sessaoAdmin =
    goldFitCarregarSessao();


if (
    !sessaoAdmin
    ||
    sessaoAdmin.perfil !==
        "admin"
) {

    window.location.replace(
        "../login.html?next=admin/estoque.html"
    );

}


// ======================================================
// CATEGORIAS
// ======================================================

const categoriasPorGrupo = {

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

let estoque =
    goldFitCarregarEstoque();


let grupoSelecionado =
    "Todos";


let categoriaSelecionada =
    "Todas";


let termoPesquisa =
    "";


// ======================================================
// ELEMENTOS
// ======================================================

const tabelaEstoque =
    document.getElementById(
        "tabelaEstoque"
    );


const campoPesquisa =
    document.getElementById(
        "campoPesquisa"
    );


const filtroCategoria =
    document.getElementById(
        "filtroCategoria"
    );


const botoesGrupo =
    document.querySelectorAll(
        ".group-button"
    );


const statVariacoes =
    document.getElementById(
        "statVariacoes"
    );


const statUnidades =
    document.getElementById(
        "statUnidades"
    );


const statBaixo =
    document.getElementById(
        "statBaixo"
    );


const statSemEstoque =
    document.getElementById(
        "statSemEstoque"
    );


const btnNovoProduto =
    document.getElementById(
        "btnNovoProduto"
    );


const modalOverlay =
    document.getElementById(
        "modalOverlay"
    );


const btnFecharModal =
    document.getElementById(
        "btnFecharModal"
    );


const btnCancelar =
    document.getElementById(
        "btnCancelar"
    );


const modalTitulo =
    document.getElementById(
        "modalTitulo"
    );


const formProduto =
    document.getElementById(
        "formProduto"
    );


const produtoId =
    document.getElementById(
        "produtoId"
    );


const produtoGrupo =
    document.getElementById(
        "produtoGrupo"
    );


const produtoCategoria =
    document.getElementById(
        "produtoCategoria"
    );


const produtoNome =
    document.getElementById(
        "produtoNome"
    );


const produtoMarca =
    document.getElementById(
        "produtoMarca"
    );


const produtoCor =
    document.getElementById(
        "produtoCor"
    );


const produtoTamanho =
    document.getElementById(
        "produtoTamanho"
    );


const produtoSku =
    document.getElementById(
        "produtoSku"
    );


const produtoQuantidade =
    document.getElementById(
        "produtoQuantidade"
    );


const fotoProduto =
    document.getElementById(
        "fotoProduto"
    );


const fotoBase64 =
    document.getElementById(
        "fotoBase64"
    );


const previewImagem =
    document.getElementById(
        "previewImagem"
    );


const toast =
    document.getElementById(
        "toast"
    );


// ======================================================
// INICIAR
// ======================================================

iniciar();


function iniciar() {

    preencherContaAdmin();

    prepararFotosPadrao();

    configurarEventos();

    atualizarFiltroCategorias();

    renderizarTudo();

}


// ======================================================
// CONTA
// ======================================================

function preencherContaAdmin() {

    if (
        !sessaoAdmin
    ) {

        return;

    }


    const nome =
        sessaoAdmin.nome
        ||
        "Administrador Gold Fit";


    const email =
        sessaoAdmin.email
        ||
        "admin@goldfit.demo";


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
        email;


    document
        .getElementById(
            "adminPerfil"
        )
        .textContent =
        "ADMIN";


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


    botoesGrupo.forEach(
        botao => {

            botao.addEventListener(
                "click",
                function () {

                    grupoSelecionado =
                        botao.dataset.grupo;


                    categoriaSelecionada =
                        "Todas";


                    botoesGrupo.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    botao.classList.add(
                        "active"
                    );


                    atualizarFiltroCategorias();

                    renderizarTabela();

                }
            );

        }
    );


    filtroCategoria.addEventListener(
        "change",
        function () {

            categoriaSelecionada =
                filtroCategoria.value;


            renderizarTabela();

        }
    );


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


    btnNovoProduto.addEventListener(
        "click",
        abrirModalNovo
    );


    btnFecharModal.addEventListener(
        "click",
        fecharModal
    );


    btnCancelar.addEventListener(
        "click",
        fecharModal
    );


    modalOverlay.addEventListener(
        "click",
        function (
            event
        ) {

            if (
                event.target ===
                modalOverlay
            ) {

                fecharModal();

            }

        }
    );


    produtoGrupo.addEventListener(
        "change",
        function () {

            atualizarCategoriasFormulario();

        }
    );


    fotoProduto.addEventListener(
        "change",
        processarImagem
    );


    formProduto.addEventListener(
        "submit",
        salvarProduto
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


    configurarModulosFuturos();

}


// ======================================================
// MÓDULOS AINDA NÃO IMPLEMENTADOS
//
// Produtos NÃO está aqui, porque já existe.
// ======================================================

function configurarModulosFuturos() {

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


                        const modulo =
                            link
                                .querySelector(
                                    "strong"
                                )
                                ?.textContent
                                ?.trim()
                            ||
                            "Módulo";


                        mostrarToast(
                            `O módulo "${modulo}" será criado na próxima etapa.`
                        );

                    }
                );

            }
        );

}


// ======================================================
// SALVAR ESTOQUE
// ======================================================

function salvarEstoqueLocal() {

    try {

        goldFitSalvarEstoque(
            estoque
        );

    }

    catch (
        erro
    ) {

        console.error(
            erro
        );


        mostrarToast(
            "Não foi possível salvar o estoque."
        );

    }

}


// ======================================================
// FOTOS PADRÃO
// ======================================================

function prepararFotosPadrao() {

    let alterou =
        false;


    estoque =
        estoque.map(
            item => {

                if (
                    !item.foto
                ) {

                    item.foto =
                        gerarPlaceholder(
                            item
                        );


                    alterou =
                        true;

                }


                return item;

            }
        );


    if (
        alterou
    ) {

        salvarEstoqueLocal();

    }

}


// ======================================================
// FILTROS
// ======================================================

function atualizarFiltroCategorias() {

    const categorias =
        obterCategoriasFiltro();


    filtroCategoria.innerHTML =
        `
        <option value="Todas">
            Todas as categorias
        </option>
        `;


    categorias.forEach(
        categoria => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                categoria;


            option.textContent =
                categoria;


            filtroCategoria.appendChild(
                option
            );

        }
    );


    categoriaSelecionada =
        "Todas";


    filtroCategoria.value =
        "Todas";

}


function obterCategoriasFiltro() {

    if (
        grupoSelecionado ===
        "Todos"
    ) {

        return [
            ...new Set(

                estoque.map(
                    item =>
                        item.categoria
                )

            )
        ].sort();

    }


    return (
        categoriasPorGrupo[
            grupoSelecionado
        ]
        ||
        []
    );

}


// ======================================================
// RESUMO
// ======================================================

function renderizarTudo() {

    renderizarResumo();

    renderizarTabela();

}


function renderizarResumo() {

    statVariacoes.textContent =
        estoque.length;


    statUnidades.textContent =
        estoque.reduce(

            (
                total,
                item
            ) =>

                total
                +
                Number(
                    item.quantidade
                    ||
                    0
                ),

            0

        );


    statBaixo.textContent =
        estoque.filter(
            item => {

                const quantidade =
                    Number(
                        item.quantidade
                        ||
                        0
                    );


                return (
                    quantidade >
                    0

                    &&

                    quantidade <=
                    2
                );

            }
        ).length;


    statSemEstoque.textContent =
        estoque.filter(
            item =>
                Number(
                    item.quantidade
                    ||
                    0
                ) ===
                0
        ).length;

}


// ======================================================
// FILTRAR
// ======================================================

function obterEstoqueFiltrado() {

    return estoque.filter(
        item => {


            const passaGrupo =

                grupoSelecionado ===
                    "Todos"

                ||

                item.grupo ===
                    grupoSelecionado;


            const passaCategoria =

                categoriaSelecionada ===
                    "Todas"

                ||

                item.categoria ===
                    categoriaSelecionada;


            const texto =
                `
                ${item.produto}
                ${item.marca}
                ${item.cor}
                ${item.tamanho}
                ${item.sku}
                ${item.grupo}
                ${item.categoria}
                `
                .toLowerCase();


            return (

                passaGrupo

                &&

                passaCategoria

                &&

                texto.includes(
                    termoPesquisa
                )

            );

        }
    );

}


// ======================================================
// TABELA
// ======================================================

function renderizarTabela() {

    const lista =
        obterEstoqueFiltrado();


    if (
        lista.length ===
        0
    ) {

        tabelaEstoque.innerHTML =
            `
            <tr>

                <td
                    colspan="11"
                    class="empty-state"
                >
                    Nenhum produto encontrado.
                </td>

            </tr>
            `;


        return;

    }


    tabelaEstoque.innerHTML =
        lista
            .map(
                item => {


                    const quantidade =
                        Number(
                            item.quantidade
                            ||
                            0
                        );


                    const status =
                        obterStatus(
                            quantidade
                        );


                    return `

                        <tr>

                            <td>

                                <img
                                    class="product-photo"
                                    src="${item.foto}"
                                    alt="${goldFitEscapeHtml(
                                        item.produto
                                    )}"
                                >

                            </td>


                            <td>

                                <div class="product-name">

                                    ${goldFitEscapeHtml(
                                        item.produto
                                    )}

                                </div>

                            </td>


                            <td>

                                <span class="group-label">

                                    ${goldFitEscapeHtml(
                                        item.grupo
                                    )}

                                </span>

                            </td>


                            <td>

                                <span class="category-label">

                                    ${goldFitEscapeHtml(
                                        item.categoria
                                    )}

                                </span>

                            </td>


                            <td>

                                ${goldFitEscapeHtml(
                                    item.marca
                                )}

                            </td>


                            <td>

                                ${goldFitEscapeHtml(
                                    item.cor
                                )}

                            </td>


                            <td>

                                ${goldFitEscapeHtml(
                                    item.tamanho
                                )}

                            </td>


                            <td>

                                <span class="sku">

                                    ${goldFitEscapeHtml(
                                        item.sku
                                    )}

                                </span>

                            </td>


                            <td>
                                ${quantidade}
                            </td>


                            <td>

                                <span
                                    class="status ${status.classe}"
                                >
                                    ${status.texto}
                                </span>

                            </td>


                            <td>

                                <div class="actions">


                                    <button
                                        type="button"
                                        class="btn-edit"
                                        onclick="editarProduto(${item.id})"
                                    >
                                        Editar
                                    </button>


                                    <button
                                        type="button"
                                        class="btn-delete"
                                        onclick="excluirProduto(${item.id})"
                                    >
                                        Excluir
                                    </button>


                                </div>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


// ======================================================
// STATUS
// ======================================================

function obterStatus(
    quantidade
) {

    if (
        quantidade ===
        0
    ) {

        return {

            texto:
                "Sem estoque",

            classe:
                "status-danger"

        };

    }


    if (
        quantidade <=
        2
    ) {

        return {

            texto:
                "Estoque baixo",

            classe:
                "status-warning"

        };

    }


    return {

        texto:
            "Disponível",

        classe:
            "status-success"

    };

}


// ======================================================
// NOVO PRODUTO
// ======================================================

function abrirModalNovo() {

    formProduto.reset();


    produtoId.value =
        "";


    fotoBase64.value =
        "";


    produtoCategoria.innerHTML =
        `
        <option value="">
            Selecione o grupo primeiro
        </option>
        `;


    modalTitulo.textContent =
        "Novo produto";


    previewImagem.src =
        gerarPlaceholder({

            produto:
                "Novo Produto",

            marca:
                "Gold Fit",

            cor:
                "Gold"

        });


    modalOverlay.classList.remove(
        "hidden"
    );

}


// ======================================================
// CATEGORIAS FORM
// ======================================================

function atualizarCategoriasFormulario(
    categoriaAtual =
        ""
) {

    const grupo =
        produtoGrupo.value;


    produtoCategoria.innerHTML =
        `
        <option value="">
            Selecione
        </option>
        `;


    const categorias =
        categoriasPorGrupo[
            grupo
        ]
        ||
        [];


    categorias.forEach(
        categoria => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                categoria;


            option.textContent =
                categoria;


            produtoCategoria.appendChild(
                option
            );

        }
    );


    if (
        categoriaAtual
    ) {

        produtoCategoria.value =
            categoriaAtual;

    }

}


// ======================================================
// EDITAR
// ======================================================

function editarProduto(
    id
) {

    const item =
        estoque.find(
            produto =>
                Number(
                    produto.id
                )
                ===
                Number(
                    id
                )
        );


    if (
        !item
    ) {

        return;

    }


    modalTitulo.textContent =
        "Editar produto";


    produtoId.value =
        item.id;


    produtoGrupo.value =
        item.grupo;


    atualizarCategoriasFormulario(
        item.categoria
    );


    produtoNome.value =
        item.produto;


    produtoMarca.value =
        item.marca;


    produtoCor.value =
        item.cor;


    produtoTamanho.value =
        item.tamanho;


    produtoSku.value =
        item.sku;


    produtoQuantidade.value =
        item.quantidade;


    fotoBase64.value =
        item.foto
        ||
        "";


    previewImagem.src =
        item.foto
        ||
        gerarPlaceholder(
            item
        );


    fotoProduto.value =
        "";


    modalOverlay.classList.remove(
        "hidden"
    );

}


// ======================================================
// MODAL
// ======================================================

function fecharModal() {

    modalOverlay.classList.add(
        "hidden"
    );

}


// ======================================================
// FOTO
// ======================================================

function processarImagem(
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


        fotoProduto.value =
            "";


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
                        900;


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


                    const imagemFinal =
                        canvas.toDataURL(
                            "image/jpeg",
                            0.82
                        );


                    fotoBase64.value =
                        imagemFinal;


                    previewImagem.src =
                        imagemFinal;

                };


            imagem.src =
                evento.target.result;

        };


    reader.readAsDataURL(
        arquivo
    );

}


// ======================================================
// SALVAR
// ======================================================

function salvarProduto(
    event
) {

    event.preventDefault();


    const quantidade =
        Number(
            produtoQuantidade.value
        );


    if (
        !Number.isInteger(
            quantidade
        )
        ||
        quantidade <
        0
    ) {

        mostrarToast(
            "Informe uma quantidade inteira válida."
        );


        return;

    }


    const idAtual =
        Number(
            produtoId.value
        );


    const produto = {

        id:
            idAtual
            ||
            gerarNovoId(),

        grupo:
            produtoGrupo.value,

        categoria:
            produtoCategoria.value,

        produto:
            produtoNome
                .value
                .trim(),

        marca:
            produtoMarca
                .value
                .trim(),

        cor:
            produtoCor
                .value
                .trim(),

        tamanho:
            produtoTamanho
                .value
                .trim(),

        sku:
            produtoSku
                .value
                .trim()
                .toUpperCase(),

        quantidade:
            quantidade,

        foto:
            fotoBase64.value

    };


    if (
        !produto.grupo
        ||
        !produto.categoria
        ||
        !produto.produto
        ||
        !produto.marca
        ||
        !produto.cor
        ||
        !produto.tamanho
        ||
        !produto.sku
    ) {

        mostrarToast(
            "Preencha todos os campos obrigatórios."
        );


        return;

    }


    const skuDuplicado =
        estoque.some(
            item =>

                String(
                    item.sku
                )
                .toUpperCase()
                ===
                produto.sku
                .toUpperCase()

                &&

                Number(
                    item.id
                )
                !==
                Number(
                    produto.id
                )
        );


    if (
        skuDuplicado
    ) {

        mostrarToast(
            "Já existe um produto com este SKU."
        );


        return;

    }


    if (
        !produto.foto
    ) {

        produto.foto =
            gerarPlaceholder(
                produto
            );

    }


    const indice =
        estoque.findIndex(
            item =>
                Number(
                    item.id
                )
                ===
                Number(
                    produto.id
                )
        );


    if (
        indice >=
        0
    ) {

        estoque[
            indice
        ] =
            produto;


        mostrarToast(
            "Produto atualizado com sucesso."
        );

    }

    else {

        estoque.unshift(
            produto
        );


        mostrarToast(
            "Novo produto cadastrado com sucesso."
        );

    }


    salvarEstoqueLocal();


    atualizarFiltroCategorias();

    renderizarTudo();

    fecharModal();

}


// ======================================================
// EXCLUIR
// ======================================================

function excluirProduto(
    id
) {

    const item =
        estoque.find(
            produto =>
                Number(
                    produto.id
                )
                ===
                Number(
                    id
                )
        );


    if (
        !item
    ) {

        return;

    }


    const confirmar =
        confirm(

            `Deseja excluir este produto?

${item.produto}

Cor: ${item.cor}
Tamanho: ${item.tamanho}`

        );


    if (
        !confirmar
    ) {

        return;

    }


    estoque =
        estoque.filter(
            produto =>
                Number(
                    produto.id
                )
                !==
                Number(
                    id
                )
        );


    salvarEstoqueLocal();


    atualizarFiltroCategorias();

    renderizarTudo();


    mostrarToast(
        "Produto excluído."
    );

}


// ======================================================
// ID
// ======================================================

function gerarNovoId() {

    if (
        estoque.length ===
        0
    ) {

        return 1;

    }


    return (

        Math.max(

            ...estoque.map(
                item =>
                    Number(
                        item.id
                    )
                    ||
                    0
            )

        )

        +
        1

    );

}


// ======================================================
// PLACEHOLDER
// ======================================================

function gerarPlaceholder(
    item
) {

    const cores =
        obterCorVisual(
            item.cor
        );


    const nome =
        String(
            item.produto
            ||
            "Produto"
        )
        .split(
            " "
        )
        .slice(
            0,
            4
        )
        .join(
            " "
        );


    const svg =
        `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="800"
            height="1000"
        >

            <defs>

                <linearGradient
                    id="bg"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                >

                    <stop
                        offset="0%"
                        stop-color="${cores[0]}"
                    />

                    <stop
                        offset="100%"
                        stop-color="${cores[1]}"
                    />

                </linearGradient>

            </defs>


            <rect
                width="800"
                height="1000"
                fill="url(#bg)"
            />


            <circle
                cx="400"
                cy="430"
                r="240"
                fill="rgba(243,198,0,0.95)"
            />


            <text
                x="400"
                y="400"
                text-anchor="middle"
                font-family="Arial"
                font-size="52"
                font-weight="700"
                fill="#111111"
            >
                ${goldFitEscapeHtml(
                    item.marca
                    ||
                    "Gold Fit"
                )}
            </text>


            <text
                x="400"
                y="470"
                text-anchor="middle"
                font-family="Arial"
                font-size="28"
                font-weight="700"
                fill="#111111"
            >
                ${goldFitEscapeHtml(
                    nome
                )}
            </text>


            <text
                x="400"
                y="530"
                text-anchor="middle"
                font-family="Arial"
                font-size="21"
                fill="#111111"
            >
                ${goldFitEscapeHtml(
                    item.cor
                    ||
                    ""
                )}
            </text>


            <text
                x="400"
                y="900"
                text-anchor="middle"
                font-family="Arial"
                font-size="25"
                font-weight="700"
                fill="#ffffff"
                letter-spacing="5"
            >
                GOLD FIT
            </text>

        </svg>
        `;


    return (
        "data:image/svg+xml;charset=UTF-8,"
        +
        encodeURIComponent(
            svg
        )
    );

}


// ======================================================
// CORES PLACEHOLDER
// ======================================================

function obterCorVisual(
    cor
) {

    const nome =
        String(
            cor
            ||
            ""
        )
        .toLowerCase();


    if (
        nome.includes(
            "marrom"
        )
    ) {

        return [
            "#5d4037",
            "#8d6e63"
        ];

    }


    if (
        nome.includes(
            "terracota"
        )
    ) {

        return [
            "#a34f34",
            "#d17a54"
        ];

    }


    if (
        nome.includes(
            "preto"
        )
    ) {

        return [
            "#111217",
            "#373940"
        ];

    }


    if (
        nome.includes(
            "branc"
        )
    ) {

        return [
            "#98a2b3",
            "#d0d5dd"
        ];

    }


    if (
        nome.includes(
            "rosa"
        )
    ) {

        return [
            "#e78fb3",
            "#c94f84"
        ];

    }


    if (
        nome.includes(
            "azul"
        )
    ) {

        return [
            "#315ea8",
            "#6085c5"
        ];

    }


    if (
        nome.includes(
            "cinza"
        )
    ) {

        return [
            "#4b5563",
            "#9ca3af"
        ];

    }


    if (
        nome.includes(
            "verde"
        )
    ) {

        return [
            "#2e7d4f",
            "#5ea676"
        ];

    }


    if (
        nome.includes(
            "lil"
        )
    ) {

        return [
            "#7557a8",
            "#aa8bd4"
        ];

    }


    if (
        nome.includes(
            "goiaba"
        )
    ) {

        return [
            "#d96d73",
            "#ee9a9f"
        ];

    }


    return [
        "#1b1b1b",
        "#383200"
    ];

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


// ======================================================
// DISPONIBILIZAR FUNÇÕES
// ======================================================

window.editarProduto =
    editarProduto;


window.excluirProduto =
    excluirProduto;