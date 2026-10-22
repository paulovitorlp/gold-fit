// ======================================================
// GOLD FIT
// CONTROLE DE ESTOQUE
// ======================================================

const STORAGE_KEY =
    "goldfit_estoque_demo_v4";


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
// PRODUTOS INICIAIS
//
// Produtos pertencentes às linhas da Gold Fit.
// Quantidades utilizadas apenas para demonstração.
// ======================================================

const estoqueInicial = [

    {
        id: 1,
        grupo: "Feminino",
        categoria: "Conjuntos",
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Marrom",
        tamanho: "P",
        sku: "CTS-ALO-MARROM-P",
        quantidade: 4,
        foto: ""
    },

    {
        id: 2,
        grupo: "Feminino",
        categoria: "Conjuntos",
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Marrom",
        tamanho: "M",
        sku: "CTS-ALO-MARROM-M",
        quantidade: 2,
        foto: ""
    },

    {
        id: 3,
        grupo: "Feminino",
        categoria: "Conjuntos",
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Marrom",
        tamanho: "G",
        sku: "CTS-ALO-MARROM-G",
        quantidade: 0,
        foto: ""
    },

    {
        id: 4,
        grupo: "Feminino",
        categoria: "Conjuntos",
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Terracota",
        tamanho: "P",
        sku: "CTS-ALO-TERRACOTA-P",
        quantidade: 3,
        foto: ""
    },

    {
        id: 5,
        grupo: "Feminino",
        categoria: "Conjuntos",
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Terracota",
        tamanho: "M",
        sku: "CTS-ALO-TERRACOTA-M",
        quantidade: 2,
        foto: ""
    },

    {
        id: 6,
        grupo: "Feminino",
        categoria: "Conjuntos",
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Terracota",
        tamanho: "GG",
        sku: "CTS-ALO-TERRACOTA-GG",
        quantidade: 1,
        foto: ""
    },

    {
        id: 7,
        grupo: "Feminino",
        categoria: "Conjuntos",
        produto: "Conjunto Top e Legging",
        marca: "ALO",
        cor: "Preto",
        tamanho: "G",
        sku: "CTL-ALO-PRETO-G",
        quantidade: 2,
        foto: ""
    },

    {
        id: 8,
        grupo: "Feminino",
        categoria: "Conjuntos",
        produto: "Conjunto Top e Legging",
        marca: "ALO",
        cor: "Preto",
        tamanho: "GG",
        sku: "CTL-ALO-PRETO-GG",
        quantidade: 1,
        foto: ""
    },

    {
        id: 9,
        grupo: "Feminino",
        categoria: "Croppeds",
        produto: "Cropped ALO",
        marca: "ALO",
        cor: "Branco",
        tamanho: "G",
        sku: "CRO-ALO-BRANCO-G",
        quantidade: 2,
        foto: ""
    },

    {
        id: 10,
        grupo: "Feminino",
        categoria: "Saias",
        produto: "Saia ALO",
        marca: "ALO",
        cor: "Marrom",
        tamanho: "P",
        sku: "SAI-ALO-MARROM-P",
        quantidade: 1,
        foto: ""
    },

    {
        id: 11,
        grupo: "Feminino",
        categoria: "Shorts",
        produto: "Short Compressão ALO",
        marca: "ALO",
        cor: "Cinza",
        tamanho: "GG",
        sku: "SHC-ALO-CINZA-GG",
        quantidade: 1,
        foto: ""
    },

    {
        id: 12,
        grupo: "Feminino",
        categoria: "Jaquetas",
        produto: "Jaqueta Térmica ALO",
        marca: "ALO",
        cor: "Preta",
        tamanho: "G",
        sku: "JAQ-ALO-PRETA-G",
        quantidade: 1,
        foto: ""
    },

    {
        id: 13,
        grupo: "Masculino",
        categoria: "Camisetas",
        produto: "Camiseta Importada ON",
        marca: "ON",
        cor: "Branca",
        tamanho: "XL",
        sku: "CAM-ON-BRANCA-XL",
        quantidade: 1,
        foto: ""
    },

    {
        id: 14,
        grupo: "Masculino",
        categoria: "Camisetas",
        produto: "Camiseta Importada ON",
        marca: "ON",
        cor: "Preta",
        tamanho: "XL",
        sku: "CAM-ON-PRETA-XL",
        quantidade: 2,
        foto: ""
    },

    {
        id: 15,
        grupo: "Masculino",
        categoria: "Camisetas",
        produto: "Camisa Dry Fit Nike",
        marca: "Nike",
        cor: "Azul",
        tamanho: "M",
        sku: "CAM-NIKE-AZUL-M",
        quantidade: 3,
        foto: ""
    },

    {
        id: 16,
        grupo: "Masculino",
        categoria: "Camisetas",
        produto: "Camisa Dry Fit Adidas",
        marca: "Adidas",
        cor: "Preta",
        tamanho: "G",
        sku: "CAM-ADIDAS-PRETA-G",
        quantidade: 2,
        foto: ""
    },

    {
        id: 17,
        grupo: "Masculino",
        categoria: "Shorts",
        produto: "Short Dry Fit ON",
        marca: "ON",
        cor: "Preto",
        tamanho: "4XL",
        sku: "SH-ON-PRETO-4XL",
        quantidade: 0,
        foto: ""
    },

    {
        id: 18,
        grupo: "Acessórios",
        categoria: "Meias",
        produto: "Meia ALO",
        marca: "ALO",
        cor: "Rosa",
        tamanho: "Único",
        sku: "MEIA-ALO-ROSA",
        quantidade: 4,
        foto: ""
    },

    {
        id: 19,
        grupo: "Calçados",
        categoria: "Tênis",
        produto: "Tênis ON",
        marca: "ON",
        cor: "Branco",
        tamanho: "38",
        sku: "TEN-ON-BRANCO-38",
        quantidade: 1,
        foto: ""
    }

];


// ======================================================
// ESTADO
// ======================================================

let estoque =
    carregarEstoque();


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
// INICIALIZAÇÃO
// ======================================================

iniciar();


function iniciar() {

    prepararFotosPadrao();

    configurarEventos();

    atualizarFiltroCategorias();

    renderizarTudo();

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
                        item =>
                            item.classList.remove(
                                "active"
                            )
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
        function (event) {

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


    configurarModulosFuturos();

}


// ======================================================
// MÓDULOS FUTUROS
// ======================================================

function configurarModulosFuturos() {

    const links =
        document.querySelectorAll(
            ".modulo-futuro"
        );


    links.forEach(
        link => {

            link.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    const modulo =
                        link
                            .textContent
                            .trim();


                    mostrarToast(
                        `O módulo "${modulo}" será implementado na próxima fase do projeto.`
                    );

                }
            );

        }
    );

}


// ======================================================
// LOCAL STORAGE
// ======================================================

function carregarEstoque() {

    const salvo =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (salvo) {

        try {

            const dados =
                JSON.parse(salvo);


            if (
                Array.isArray(dados)
            ) {

                return dados;

            }

        }

        catch (erro) {

            console.error(
                "Erro ao carregar estoque:",
                erro
            );

        }

    }


    return JSON.parse(
        JSON.stringify(
            estoqueInicial
        )
    );

}


function salvarEstoqueLocal() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                estoque
            )
        );

    }

    catch (erro) {

        console.error(
            erro
        );


        mostrarToast(
            "Não foi possível salvar. Tente utilizar imagens menores."
        );

    }

}


// ======================================================
// FOTOS PADRÃO
// ======================================================

function prepararFotosPadrao() {

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

                }


                return item;

            }
        );


    salvarEstoqueLocal();

}


// ======================================================
// FILTRO DE CATEGORIAS
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
        ] || []
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
                total +
                Number(
                    item.quantidade
                ),
            0
        );


    statBaixo.textContent =
        estoque.filter(
            item =>
                item.quantidade > 0 &&
                item.quantidade <= 2
        ).length;


    statSemEstoque.textContent =
        estoque.filter(
            item =>
                item.quantidade === 0
        ).length;

}


// ======================================================
// FILTRAGEM
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


            const passaPesquisa =
                texto.includes(
                    termoPesquisa
                );


            return (
                passaGrupo &&
                passaCategoria &&
                passaPesquisa
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
        lista.length === 0
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


                    const status =
                        obterStatus(
                            item.quantidade
                        );


                    return `

                        <tr>

                            <td>

                                <img
                                    class="product-photo"
                                    src="${item.foto}"
                                    alt="${escapeHtml(item.produto)}"
                                >

                            </td>


                            <td>

                                <div class="product-name">

                                    ${escapeHtml(
                                        item.produto
                                    )}

                                </div>

                            </td>


                            <td>

                                <span class="group-label">

                                    ${escapeHtml(
                                        item.grupo
                                    )}

                                </span>

                            </td>


                            <td>

                                <span class="category-label">

                                    ${escapeHtml(
                                        item.categoria
                                    )}

                                </span>

                            </td>


                            <td>

                                ${escapeHtml(
                                    item.marca
                                )}

                            </td>


                            <td>

                                ${escapeHtml(
                                    item.cor
                                )}

                            </td>


                            <td>

                                ${escapeHtml(
                                    item.tamanho
                                )}

                            </td>


                            <td>

                                <span class="sku">

                                    ${escapeHtml(
                                        item.sku
                                    )}

                                </span>

                            </td>


                            <td>

                                ${item.quantidade}

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
        quantidade === 0
    ) {

        return {

            texto:
                "Sem estoque",

            classe:
                "status-danger"

        };

    }


    if (
        quantidade <= 2
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
// CATEGORIAS DO FORMULÁRIO
// ======================================================

function atualizarCategoriasFormulario(
    categoriaAtual = ""
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
        ] || [];


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

function editarProduto(id) {

    const item =
        estoque.find(
            produto =>
                produto.id === id
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
        item.foto || "";


    previewImagem.src =
        item.foto;


    fotoProduto.value =
        "";


    modalOverlay.classList.remove(
        "hidden"
    );

}


// ======================================================
// FECHAR MODAL
// ======================================================

function fecharModal() {

    modalOverlay.classList.add(
        "hidden"
    );

}


// ======================================================
// PROCESSAR IMAGEM
// ======================================================

function processarImagem(
    event
) {

    const arquivo =
        event.target.files[0];


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
            "Selecione um arquivo de imagem válido."
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
                        800;


                    let largura =
                        imagem.width;


                    let altura =
                        imagem.height;


                    if (
                        largura > limite ||
                        altura > limite
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
                            0.78
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
// SALVAR PRODUTO
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
        ) ||
        quantidade < 0
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
            idAtual ||
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
        !produto.grupo ||
        !produto.categoria ||
        !produto.produto ||
        !produto.marca ||
        !produto.cor ||
        !produto.tamanho ||
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

                item.sku
                    .toUpperCase() ===
                produto.sku
                    .toUpperCase()

                &&

                item.id !==
                    produto.id
        );


    if (
        skuDuplicado
    ) {

        mostrarToast(
            "Já existe uma variação cadastrada com este SKU."
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
                item.id ===
                produto.id
        );


    if (
        indice >= 0
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
            "Produto cadastrado com sucesso."
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
                produto.id === id
        );


    if (
        !item
    ) {

        return;

    }


    const confirmar =
        confirm(

            `Deseja excluir esta variação?

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
                produto.id !== id
        );


    salvarEstoqueLocal();


    atualizarFiltroCategorias();


    renderizarTudo();


    mostrarToast(
        "Produto excluído do estoque."
    );

}


// ======================================================
// NOVO ID
// ======================================================

function gerarNovoId() {

    if (
        estoque.length === 0
    ) {

        return 1;

    }


    return (

        Math.max(
            ...estoque.map(
                item =>
                    item.id
            )
        )

        + 1

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
            item.produto ||
            "Produto"
        )
            .split(" ")
            .slice(
                0,
                4
            )
            .join(" ");


    const svg =
        `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="600"
            height="600"
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
                width="600"
                height="600"
                fill="url(#bg)"
            />


            <rect
                x="38"
                y="38"
                width="524"
                height="524"
                rx="30"
                fill="rgba(255,255,255,0.10)"
                stroke="rgba(255,255,255,0.30)"
            />


            <text
                x="300"
                y="225"
                text-anchor="middle"
                font-family="Arial"
                font-size="38"
                font-weight="700"
                fill="white"
            >
                ${escapeHtml(
                    item.marca ||
                    "Gold Fit"
                )}
            </text>


            <text
                x="300"
                y="305"
                text-anchor="middle"
                font-family="Arial"
                font-size="27"
                font-weight="700"
                fill="white"
            >
                ${escapeHtml(
                    nome
                )}
            </text>


            <text
                x="300"
                y="360"
                text-anchor="middle"
                font-family="Arial"
                font-size="23"
                fill="white"
            >
                ${escapeHtml(
                    item.cor ||
                    ""
                )}
            </text>


            <text
                x="300"
                y="520"
                text-anchor="middle"
                font-family="Arial"
                font-size="20"
                fill="white"
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
// CORES DOS PLACEHOLDERS
// ======================================================

function obterCorVisual(
    cor
) {

    const nome =
        String(
            cor || ""
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


    return [
        "#b38d24",
        "#d4af37"
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

            3200

        );

}


// ======================================================
// SEGURANÇA DO TEXTO
// ======================================================

function escapeHtml(
    valor
) {

    return String(
        valor
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ======================================================
// FUNÇÕES DOS BOTÕES DA TABELA
// ======================================================

window.editarProduto =
    editarProduto;


window.excluirProduto =
    excluirProduto;