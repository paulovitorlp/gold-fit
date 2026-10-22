// ======================================================
// GOLD FIT - CONTROLE DE ESTOQUE
// Dados temporários do frontend
// Futuramente serão carregados do banco de dados
// ======================================================

let estoque = [

    {
        id: 1,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Marrom",
        tamanho: "P",
        sku: "CTS-ALO-CAN-MARROM",
        quantidade: 0
    },

    {
        id: 2,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Marrom",
        tamanho: "M",
        sku: "CTS-ALO-CAN-MARROM",
        quantidade: 0
    },

    {
        id: 3,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Marrom",
        tamanho: "G",
        sku: "CTS-ALO-CAN-MARROM",
        quantidade: 0
    },

    {
        id: 4,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Marrom",
        tamanho: "GG",
        sku: "CTS-ALO-CAN-MARROM",
        quantidade: 0
    },

    {
        id: 5,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Terracota",
        tamanho: "P",
        sku: "CTS-ALO-CAN-TERRACOTA",
        quantidade: 0
    },

    {
        id: 6,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Terracota",
        tamanho: "M",
        sku: "CTS-ALO-CAN-TERRACOTA",
        quantidade: 0
    },

    {
        id: 7,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Terracota",
        tamanho: "G",
        sku: "CTS-ALO-CAN-TERRACOTA",
        quantidade: 0
    },

    {
        id: 8,
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Terracota",
        tamanho: "GG",
        sku: "CTS-ALO-CAN-TERRACOTA",
        quantidade: 0
    }

];


// ======================================================
// ELEMENTOS DA PÁGINA
// ======================================================

const tabela = document.getElementById("tabelaEstoque");
const pesquisa = document.getElementById("pesquisa");


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

        const status = definirStatus(item.quantidade);

        const linha = document.createElement("tr");

        linha.innerHTML = `

            <td>${item.produto}</td>

            <td>${item.marca}</td>

            <td>${item.cor}</td>

            <td>${item.tamanho}</td>

            <td>${item.sku}</td>

            <td>${item.quantidade}</td>

            <td>
                <span class="status ${status.classe}">
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
// ATUALIZAR CARDS
// ======================================================

function atualizarResumo() {

    const totalVariacoes = estoque.length;


    const totalEstoque = estoque.reduce(

        (total, item) => total + item.quantidade,

        0

    );


    const estoqueBaixo = estoque.filter(

        item =>
            item.quantidade > 0 &&
            item.quantidade <= 2

    ).length;


    const semEstoque = estoque.filter(

        item => item.quantidade === 0

    ).length;


    document.getElementById("totalVariacoes").textContent =
        totalVariacoes;


    document.getElementById("totalEstoque").textContent =
        totalEstoque;


    document.getElementById("estoqueBaixo").textContent =
        estoqueBaixo;


    document.getElementById("semEstoque").textContent =
        semEstoque;

}


// ======================================================
// ALTERAR ESTOQUE
// ======================================================

function editarEstoque(id) {

    const item = estoque.find(

        produto => produto.id === id

    );


    const novaQuantidade = prompt(

        `Atualizar estoque:

${item.produto}
Cor: ${item.cor}
Tamanho: ${item.tamanho}

Quantidade atual: ${item.quantidade}

Digite a nova quantidade:`

    );


    if (novaQuantidade === null) {
        return;
    }


    const quantidade = Number(novaQuantidade);


    if (
        !Number.isInteger(quantidade) ||
        quantidade < 0
    ) {

        alert(
            "Digite uma quantidade válida."
        );

        return;

    }


    item.quantidade = quantidade;


    salvarEstoque();


    renderizarTabela();

}


// ======================================================
// SALVAR TEMPORARIAMENTE NO NAVEGADOR
// ======================================================

function salvarEstoque() {

    localStorage.setItem(

        "goldfit_estoque",

        JSON.stringify(estoque)

    );

}


// ======================================================
// CARREGAR ESTOQUE SALVO
// ======================================================

function carregarEstoque() {

    const dadosSalvos =
        localStorage.getItem(
            "goldfit_estoque"
        );


    if (dadosSalvos) {

        estoque =
            JSON.parse(dadosSalvos);

    }

}


// ======================================================
// PESQUISA
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


        renderizarTabela(resultado);

    }
);


// ======================================================
// INICIAR SISTEMA
// ======================================================

carregarEstoque();

renderizarTabela();

// ======================================================
// MÓDULOS AINDA EM DESENVOLVIMENTO
// ======================================================

const linksMenu = document.querySelectorAll(".sidebar a");

linksMenu.forEach(link => {

    if (!link.classList.contains("ativo")) {

        link.addEventListener("click", function(event) {

            event.preventDefault();

            alert("Este módulo está em desenvolvimento.");

        });

    }

});


const botaoNovoProduto =
    document.querySelector(".btn-principal");

botaoNovoProduto.addEventListener(
    "click",
    function() {

        alert(
            "Cadastro de novos produtos será implementado na próxima etapa."
        );

    }
);