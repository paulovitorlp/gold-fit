// ======================================================
// GOLD FIT - CONTROLE DE ESTOQUE
// Dados fictícios para demonstração do projeto
// Futuramente serão carregados diretamente do banco
// ======================================================

let estoque = [

    {
        id: 1,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Marrom",
        tamanho: "P",
        sku: "CTS-ALO-CAN-MARROM-P",
        quantidade: 4
    },

    {
        id: 2,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Marrom",
        tamanho: "M",
        sku: "CTS-ALO-CAN-MARROM-M",
        quantidade: 2
    },

    {
        id: 3,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Marrom",
        tamanho: "G",
        sku: "CTS-ALO-CAN-MARROM-G",
        quantidade: 0
    },

    {
        id: 4,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Marrom",
        tamanho: "GG",
        sku: "CTS-ALO-CAN-MARROM-GG",
        quantidade: 3
    },

    {
        id: 5,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Terracota",
        tamanho: "P",
        sku: "CTS-ALO-CAN-TERRACOTA-P",
        quantidade: 1
    },

    {
        id: 6,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Terracota",
        tamanho: "M",
        sku: "CTS-ALO-CAN-TERRACOTA-M",
        quantidade: 5
    },

    {
        id: 7,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Terracota",
        tamanho: "G",
        sku: "CTS-ALO-CAN-TERRACOTA-G",
        quantidade: 2
    },

    {
        id: 8,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Terracota",
        tamanho: "GG",
        sku: "CTS-ALO-CAN-TERRACOTA-GG",
        quantidade: 0
    }

];


// ======================================================
// ELEMENTOS DA PÁGINA
// ======================================================

const tabela =
    document.getElementById("tabelaEstoque");

const pesquisa =
    document.getElementById("pesquisa");


// ======================================================
// DEFINIR STATUS DO ESTOQUE
// ======================================================

function definirStatus(quantidade) {

    if (quantidade === 0) {

        return {
            texto: "Sem estoque",
            classe: "status-indisponivel"
        };

    }

    if (quantidade <= 2) {

        return {
            texto: "Estoque baixo",
            classe: "status-baixo"
        };

    }

    return {
        texto: "Disponível",
        classe: "status-disponivel"
    };

}


// ======================================================
// MOSTRAR PRODUTOS NA TABELA
// ======================================================

function renderizarTabela(lista = estoque) {

    tabela.innerHTML = "";

    lista.forEach(item => {

        const status =
            definirStatus(item.quantidade);


        const linha =
            document.createElement("tr");


        linha.innerHTML = `

            <td>
                ${item.produto}
            </td>

            <td>
                ${item.marca}
            </td>

            <td>
                ${item.cor}
            </td>

            <td>
                ${item.tamanho}
            </td>

            <td>
                ${item.sku}
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

                <button
                    class="btn-editar"
                    onclick="editarEstoque(${item.id})"
                >

                    Editar

                </button>

            </td>

        `;


        tabela.appendChild(linha);

    });


    atualizarResumo();

}


// ======================================================
// ATUALIZAR CARDS DO PAINEL
// ======================================================

function atualizarResumo() {

    const totalVariacoes =
        estoque.length;


    const totalEstoque =
        estoque.reduce(

            (total, item) =>
                total + item.quantidade,

            0

        );


    const estoqueBaixo =
        estoque.filter(

            item =>
                item.quantidade > 0 &&
                item.quantidade <= 2

        ).length;


    const semEstoque =
        estoque.filter(

            item =>
                item.quantidade === 0

        ).length;


    document
        .getElementById("totalVariacoes")
        .textContent =
        totalVariacoes;


    document
        .getElementById("totalEstoque")
        .textContent =
        totalEstoque;


    document
        .getElementById("estoqueBaixo")
        .textContent =
        estoqueBaixo;


    document
        .getElementById("semEstoque")
        .textContent =
        semEstoque;

}


// ======================================================
// EDITAR QUANTIDADE EM ESTOQUE
// ======================================================

function editarEstoque(id) {

    const item =
        estoque.find(

            produto =>
                produto.id === id

        );


    if (!item) {

        alert(
            "Produto não encontrado."
        );

        return;

    }


    const novaQuantidade =
        prompt(

            `Atualizar estoque:

Produto: ${item.produto}

Marca: ${item.marca}

Cor: ${item.cor}

Tamanho: ${item.tamanho}

Quantidade atual: ${item.quantidade}

Digite a nova quantidade:`

        );


    // Usuário cancelou
    if (novaQuantidade === null) {

        return;

    }


    const quantidade =
        Number(novaQuantidade);


    // Validação
    if (
        !Number.isInteger(quantidade) ||
        quantidade < 0
    ) {

        alert(
            "Digite uma quantidade inteira válida."
        );

        return;

    }


    item.quantidade =
        quantidade;


    salvarEstoque();


    renderizarTabela();


    alert(
        "Estoque atualizado com sucesso."
    );

}


// ======================================================
// SALVAR ESTOQUE NO NAVEGADOR
// ======================================================
//
// Nesta fase do projeto utilizamos LocalStorage.
//
// Isso permite que o professor altere o estoque
// durante a demonstração.
//
// Futuramente essa função será substituída
// pela comunicação com PostgreSQL/Supabase.
// ======================================================

function salvarEstoque() {

    localStorage.setItem(

        "goldfit_estoque_demo_v1",

        JSON.stringify(estoque)

    );

}


// ======================================================
// CARREGAR ESTOQUE SALVO
// ======================================================

function carregarEstoque() {

    const dadosSalvos =
        localStorage.getItem(
            "goldfit_estoque_demo_v1"
        );


    if (!dadosSalvos) {

        return;

    }


    try {

        const dados =
            JSON.parse(dadosSalvos);


        if (Array.isArray(dados)) {

            estoque =
                dados;

        }

    }

    catch (erro) {

        console.error(
            "Erro ao carregar estoque:",
            erro
        );

    }

}


// ======================================================
// PESQUISAR PRODUTOS
// ======================================================

pesquisa.addEventListener(

    "input",

    function () {

        const termo =
            pesquisa.value
                .toLowerCase()
                .trim();


        const resultado =
            estoque.filter(item => {

                return (

                    item.produto
                        .toLowerCase()
                        .includes(termo)

                    ||

                    item.marca
                        .toLowerCase()
                        .includes(termo)

                    ||

                    item.cor
                        .toLowerCase()
                        .includes(termo)

                    ||

                    item.tamanho
                        .toLowerCase()
                        .includes(termo)

                    ||

                    item.sku
                        .toLowerCase()
                        .includes(termo)

                );

            });


        renderizarTabela(
            resultado
        );

    }

);


// ======================================================
// MENU LATERAL
// ======================================================
//
// Os outros módulos ainda não foram desenvolvidos.
// ======================================================

const linksMenu =
    document.querySelectorAll(
        ".sidebar a"
    );


linksMenu.forEach(link => {

    if (
        !link.classList.contains(
            "ativo"
        )
    ) {

        link.addEventListener(

            "click",

            function (event) {

                event.preventDefault();


                alert(
                    "Este módulo ainda está em desenvolvimento."
                );

            }

        );

    }

});


// ======================================================
// BOTÃO NOVO PRODUTO
// ======================================================

const botaoNovoProduto =
    document.querySelector(
        ".btn-principal"
    );


if (botaoNovoProduto) {

    botaoNovoProduto.addEventListener(

        "click",

        function () {

            alert(
                "O cadastro de novos produtos será implementado na próxima etapa."
            );

        }

    );

}


// ======================================================
// INICIALIZAÇÃO DO SISTEMA
// ======================================================

carregarEstoque();

renderizarTabela();