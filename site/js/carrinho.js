const listaCarrinho = document.getElementById("listaCarrinho");

const carrinhoConteudo = document.getElementById("carrinhoConteudo");

const carrinhoVazio = document.getElementById("carrinhoVazio");

const toast = document.getElementById("toast");

const recomendadosCarrinho = document.getElementById(
    "recomendadosCarrinho"
);


/*
    FRETE GRÁTIS

    Ainda não ativamos essa promoção.

    Quando a Gold Fit definir a política real
    e o cálculo do frete estiver integrado,
    este valor poderá ser configurado.

    Não alterar para um número enquanto
    o benefício não estiver realmente disponível.
*/

const META_FRETE_GRATIS = null;


/*
    WHATSAPP

    Por enquanto, o carrinho pode ser compartilhado.

    Quando o número oficial da Gold Fit for
    informado, poderá ser configurado aqui.
*/

const NUMERO_WHATSAPP_LOJA = "";


iniciarCarrinho();


function iniciarCarrinho() {

    configurarEventos();

    atualizarConta();

    renderizarCarrinho();

}


/* EVENTOS */

function configurarEventos() {

    listaCarrinho.addEventListener("click", event => {

        const botao = event.target.closest("[data-acao]");

        if (!botao) {
            return;
        }

        alterarItem(
            botao.dataset.sku,
            botao.dataset.acao
        );

    });


    recomendadosCarrinho.addEventListener("click", event => {

        const botao = event.target.closest(
            "[data-adicionar-recomendado]"
        );

        if (!botao) {
            return;
        }

        adicionarRecomendado(
            decodeURIComponent(
                botao.dataset.adicionarRecomendado
            )
        );

    });


    document
        .getElementById("btnContaCarrinho")
        .addEventListener("click", () => {

            const sessao = goldFitCarregarSessao();

            window.location.href =
                sessao && sessao.perfil === "admin"
                    ? "./admin/estoque.html"
                    : "./login.html?next=carrinho.html";

        });


    document
        .getElementById("btnFinalizarCompra")
        .addEventListener("click", finalizarCompra);


    document
        .getElementById("btnAplicarCupom")
        .addEventListener("click", () => {

            mostrarToast(
                "Os cupons serão habilitados na integração do checkout."
            );

        });


    document
        .getElementById("btnCalcularFrete")
        .addEventListener("click", calcularFrete);


    window.addEventListener("storage", event => {

        if (
            event.key === GOLD_FIT_CART_KEY
        ) {
            renderizarCarrinho();
        }

    });

}


/* RENDERIZAÇÃO PRINCIPAL */

function renderizarCarrinho() {

    const carrinho = goldFitCarregarCarrinho();

    if (!carrinho.length) {

        carrinhoConteudo.hidden = true;

        carrinhoVazio.hidden = false;

        return;

    }

    carrinhoConteudo.hidden = false;

    carrinhoVazio.hidden = true;


    renderizarItens(carrinho);

    renderizarResumo(carrinho);

    renderizarBeneficios(carrinho);

    renderizarRecomendacoes(carrinho);

    atualizarWhatsApp(carrinho);

}


/* ITENS DO CARRINHO */

function renderizarItens(carrinho) {

    const quantidadeTotal = carrinho.reduce(
        (total, item) =>
            total + Number(item.quantidade || 0),
        0
    );

    document.getElementById(
        "quantidadeItensCarrinho"
    ).textContent =
        `${quantidadeTotal} item(ns)`;


    listaCarrinho.innerHTML = carrinho.map(item => {

        const precoTotal =
            Number(item.preco) *
            Number(item.quantidade);

        const estoqueDisponivel =
            Number(item.estoqueDisponivel || 0);

        const estoqueBaixo =
            estoqueDisponivel > 0 &&
            estoqueDisponivel <= 2;

        const foto =
            item.foto ||
            goldFitPlaceholder(item);

        return `

            <article class="cart-item">

                <div class="cart-media">

                    <img
                        src="${goldFitEscapeHtml(foto)}"
                        alt="${goldFitEscapeHtml(item.produto)}"
                    >

                </div>


                <div class="cart-info">

                    <span class="cart-brand">
                        ${goldFitEscapeHtml(item.marca)}
                    </span>

                    <h3>
                        ${goldFitEscapeHtml(item.produto)}
                    </h3>

                    <p class="cart-variation">

                        Cor:
                        ${goldFitEscapeHtml(item.cor)}

                        <br>

                        Tamanho:
                        ${goldFitEscapeHtml(item.tamanho)}

                    </p>

                    <div class="cart-price">

                        ${goldFitFormatarPreco(precoTotal)}

                    </div>


                    <div class="cart-actions">

                        <div class="cart-qty">

                            <button
                                type="button"
                                data-acao="menos"
                                data-sku="${goldFitEscapeHtml(item.sku)}"
                            >
                                −
                            </button>

                            <strong>
                                ${Number(item.quantidade)}
                            </strong>

                            <button
                                type="button"
                                data-acao="mais"
                                data-sku="${goldFitEscapeHtml(item.sku)}"
                            >
                                +
                            </button>

                        </div>


                        <button
                            type="button"
                            class="cart-remove"
                            data-acao="remover"
                            data-sku="${goldFitEscapeHtml(item.sku)}"
                        >
                            Remover
                        </button>

                    </div>


                    ${
                        estoqueBaixo

                        ? `

                            <div class="cart-stock-warning">
                                Apenas ${estoqueDisponivel}
                                unidade(s) cadastrada(s)
                                em estoque.
                            </div>

                        `

                        : ""
                    }

                </div>

            </article>

        `;

    }).join("");


    configurarFallbackImagens();

}


/* RESUMO DO PEDIDO */

function calcularSubtotal(carrinho) {

    return carrinho.reduce(
        (total, item) => {

            return total +
                Number(item.preco) *
                Number(item.quantidade);

        },
        0
    );

}


function renderizarResumo(carrinho) {

    const subtotal = calcularSubtotal(carrinho);

    const desconto = 0;

    const total = subtotal - desconto;


    document.getElementById(
        "subtotalCarrinho"
    ).textContent =
        goldFitFormatarPreco(subtotal);


    document.getElementById(
        "descontoCarrinho"
    ).textContent =
        goldFitFormatarPreco(desconto);


    document.getElementById(
        "totalCarrinho"
    ).textContent =
        goldFitFormatarPreco(total);


    document.getElementById(
        "freteCarrinho"
    ).textContent =
        "A calcular";

}


/* BARRA DE BENEFÍCIOS */

function renderizarBeneficios(carrinho) {

    const subtotal = calcularSubtotal(carrinho);

    const titulo = document.getElementById(
        "beneficioTitulo"
    );

    const descricao = document.getElementById(
        "beneficioDescricao"
    );

    const barra = document.getElementById(
        "beneficioProgresso"
    );


    if (
        !META_FRETE_GRATIS ||
        META_FRETE_GRATIS <= 0
    ) {

        titulo.textContent =
            "Benefícios da sua compra";

        descricao.textContent =
            "O valor do frete será informado quando o cálculo de entrega estiver disponível.";

        barra.style.width = "0%";

        return;

    }


    const percentual = Math.min(
        100,
        (subtotal / META_FRETE_GRATIS) * 100
    );


    barra.style.width =
        `${percentual}%`;


    if (subtotal >= META_FRETE_GRATIS) {

        titulo.textContent =
            "Meta de compra atingida!";

        descricao.textContent =
            "Confira a elegibilidade do frete grátis no checkout.";

    }
    else {

        const falta =
            META_FRETE_GRATIS - subtotal;

        titulo.textContent =
            `Faltam ${goldFitFormatarPreco(falta)} para atingir a meta`;

        descricao.textContent =
            "A disponibilidade do benefício depende da política de frete da loja.";

    }

}


/* QUANTIDADE E REMOÇÃO */

function alterarItem(sku, acao) {

    const carrinho = goldFitCarregarCarrinho();

    const item = carrinho.find(
        produto => produto.sku === sku
    );

    if (!item) {
        return;
    }


    if (acao === "mais") {

        const estoqueDisponivel =
            Number(item.estoqueDisponivel || 999);

        if (
            Number(item.quantidade) >=
            estoqueDisponivel
        ) {

            mostrarToast(
                "Quantidade máxima disponível atingida."
            );

            return;

        }

        item.quantidade =
            Number(item.quantidade) + 1;

    }


    if (acao === "menos") {

        item.quantidade =
            Number(item.quantidade) - 1;

        if (item.quantidade <= 0) {

            carrinho.splice(
                carrinho.indexOf(item),
                1
            );

        }

    }


    if (acao === "remover") {

        carrinho.splice(
            carrinho.indexOf(item),
            1
        );

    }


    goldFitSalvarCarrinho(carrinho);

    renderizarCarrinho();

}


/* RECOMENDAÇÕES */

function renderizarRecomendacoes(carrinho) {

    const estoque = goldFitCarregarEstoque();

    const produtosCarrinho = new Set(
        carrinho.map(item =>
            `${item.produto}|${item.marca}`
        )
    );


    const mapa = new Map();


    estoque.forEach(item => {

        if (
            Number(item.quantidade) <= 0
        ) {
            return;
        }


        const chave =
            `${item.produto}|${item.marca}`;


        if (
            produtosCarrinho.has(chave)
        ) {
            return;
        }


        if (!mapa.has(chave)) {

            mapa.set(chave, {

                chave,

                produto: item.produto,

                marca: item.marca,

                preco: Number(
                    item.preco ||
                    goldFitPrecoProduto(item.produto) ||
                    0
                ),

                foto: item.foto || "",

                variacao: item

            });

        }

    });


    const recomendacoes = Array.from(
        mapa.values()
    ).slice(0, 3);


    if (!recomendacoes.length) {

        document.querySelector(
            ".recommendations"
        ).hidden = true;

        return;

    }


    document.querySelector(
        ".recommendations"
    ).hidden = false;


    recomendadosCarrinho.innerHTML =
        recomendacoes.map(item => {

            const foto =
                item.foto ||
                goldFitPlaceholder(item);

            return `

                <article class="recommendation-card">

                    <a
                        href="./produto.html?produto=${encodeURIComponent(item.chave)}"
                    >

                        <div class="recommendation-image">

                            <img
                                src="${goldFitEscapeHtml(foto)}"
                                alt="${goldFitEscapeHtml(item.produto)}"
                            >

                        </div>

                    </a>


                    <h3>
                        ${goldFitEscapeHtml(item.produto)}
                    </h3>


                    <strong>
                        ${goldFitFormatarPreco(item.preco)}
                    </strong>


                    <button
                        type="button"
                        data-adicionar-recomendado="${encodeURIComponent(item.chave)}"
                    >
                        + ADICIONAR
                    </button>

                </article>

            `;

        }).join("");


    configurarFallbackImagens();

}


/* ADICIONAR PRODUTO RECOMENDADO */

function adicionarRecomendado(chave) {

    const estoque = goldFitCarregarEstoque();

    const variacao = estoque.find(item => {

        return (
            `${item.produto}|${item.marca}` === chave
            &&
            Number(item.quantidade) > 0
        );

    });


    if (!variacao) {

        mostrarToast(
            "Produto indisponível."
        );

        return;

    }


    const carrinho = goldFitCarregarCarrinho();

    const existente = carrinho.find(
        item => item.sku === variacao.sku
    );


    if (existente) {

        if (
            Number(existente.quantidade) >=
            Number(variacao.quantidade)
        ) {

            mostrarToast(
                "Quantidade máxima disponível atingida."
            );

            return;

        }

        existente.quantidade += 1;

    }
    else {

        carrinho.push({

            sku: variacao.sku,

            produto: variacao.produto,

            marca: variacao.marca,

            grupo: variacao.grupo,

            categoria: variacao.categoria,

            cor: variacao.cor,

            tamanho: variacao.tamanho,

            preco: Number(
                variacao.preco ||
                goldFitPrecoProduto(variacao.produto) ||
                0
            ),

            quantidade: 1,

            estoqueDisponivel:
                Number(variacao.quantidade),

            foto:
                variacao.foto ||
                goldFitPlaceholder(variacao)

        });

    }


    goldFitSalvarCarrinho(carrinho);

    renderizarCarrinho();

    mostrarToast(
        "Produto adicionado à sacola."
    );

}


/* IMAGENS */

function configurarFallbackImagens() {

    document.querySelectorAll(
        ".cart-media img, .recommendation-image img"
    ).forEach(img => {

        img.addEventListener("error", () => {

            img.onerror = null;

            img.src =
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750">
                        <rect width="600" height="750" fill="#eeeeee"/>
                        <text x="300" y="370" text-anchor="middle"
                        font-family="Arial" font-size="40"
                        font-weight="bold" fill="#222222">
                        GOLD FIT
                        </text>
                    </svg>`
                );

        }, { once: true });

    });

}


/* FRETE */

function calcularFrete() {

    const cep = document
        .getElementById("campoCepCarrinho")
        .value
        .replace(/\D/g, "");


    if (cep.length !== 8) {

        mostrarToast(
            "Informe um CEP válido."
        );

        return;

    }


    mostrarToast(
        "O cálculo de frete será integrado ao checkout."
    );

}


/* WHATSAPP */

function atualizarWhatsApp(carrinho) {

    const botao = document.getElementById(
        "btnWhatsCarrinho"
    );


    const itens = carrinho.map(item => {

        return (
            `${item.quantidade}x ` +
            `${item.produto} - ` +
            `${item.cor} / ${item.tamanho}`
        );

    }).join("\n");


    const subtotal = calcularSubtotal(carrinho);


    const mensagem = [

        "Olá! Gostaria de compartilhar meu carrinho Gold Fit.",

        "",

        itens,

        "",

        `Subtotal: ${goldFitFormatarPreco(subtotal)}`,

        "Frete ainda não calculado."

    ].join("\n");


    const numero = NUMERO_WHATSAPP_LOJA
        .replace(/\D/g, "");


    const url = numero

        ? `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`

        : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;


    botao.href = url;

}


/* LOGIN E CHECKOUT */

function atualizarConta() {

    const sessao = goldFitCarregarSessao();

    const campo = document.getElementById(
        "textoContaCarrinho"
    );

    campo.textContent = sessao

        ? (
            sessao.perfil === "admin"

                ? "Admin"

                : sessao.nome.split(" ")[0]
        )

        : "Entrar";

}


function finalizarCompra() {

    const carrinho = goldFitCarregarCarrinho();

    if (!carrinho.length) {
        return;
    }


    const sessao = goldFitCarregarSessao();


    if (!sessao) {

        window.location.href =
            "./login.html?next=carrinho.html";

        return;

    }


    mostrarToast(
        "Login confirmado. O checkout será integrado na próxima etapa."
    );

}


/* NOTIFICAÇÕES */

let toastTimer;


function mostrarToast(mensagem) {

    clearTimeout(toastTimer);

    toast.textContent = mensagem;

    toast.classList.add("show");

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}