const GOLD_FIT_STOCK_KEY =
    "goldfit_estoque_demo_v4";

const GOLD_FIT_CART_KEY =
    "goldfit_carrinho_demo_v1";

const GOLD_FIT_FAVORITES_KEY =
    "goldfit_favoritos_demo_v1";

const GOLD_FIT_SESSION_KEY =
    "goldfit_sessao_demo_v1";

const GOLD_FIT_USERS_KEY =
    "goldfit_usuarios_demo_v1";

const GOLD_FIT_PRODUCTS_KEY =
    "goldfit_produtos_site_v1";

const GOLD_FIT_SEED_VERSION_KEY =
    "goldfit_seed_version";

const GOLD_FIT_SEED_VERSION =
    4;

const GOLD_FIT_SERVER_STOCK_FLAG = "goldfit_estoque_veio_do_banco_v18";


// ======================================================
// PREÇOS PADRÃO
// ======================================================

const GOLD_FIT_PRICES = {

    "Conjunto Top e Short Canelado": 160,
    "Conjunto Top e Short Canelado ALO": 160,

    "Conjunto Top e Legging": 220,
    "Conjunto Top e Legging ALO": 220,

    "Conjunto Top e Saia ALO": 220,
    "Top e Saia ALO": 220,

    "Cropped ALO": 65,

    "Jaqueta Térmica ALO": 160,

    "Camiseta Importada ON": 85,
    "Camiseta Importada ALO": 85,

    "Camisa Dry Fit Nike": 50,
    "Camisa Dry Fit Adidas": 65,
    "Camisa Dry Fit Jordan": 65,

    "Short Compressão ALO": 70,
    "Short Dry Fit ON": 60,

    "Meia ALO": 40,
    "Meia Nike": 40,
    "Meia Adidas": 35,

    "Tênis ON": 250,
    "Tênis Nike": 280,
    "Tênis Adidas": 270,
    "Tênis Olympikus": 250

};


// ======================================================
// OPÇÕES PREVISTAS
// ======================================================

const GOLD_FIT_PRODUCT_OPTIONS = {

    "Conjunto Top e Short Canelado": {

        cores: [
            "Marrom",
            "Terracota"
        ],

        tamanhos: [
            "P",
            "M",
            "G",
            "GG"
        ]

    },


    "Conjunto Top e Legging ALO": {

        cores: [
            "Preto",
            "Goiaba",
            "Verde",
            "Lilás"
        ],

        tamanhos: [
            "P",
            "M",
            "G",
            "GG"
        ]

    },


    "Conjunto Top e Legging": {

        cores: [
            "Preto",
            "Goiaba",
            "Verde",
            "Lilás"
        ],

        tamanhos: [
            "P",
            "M",
            "G",
            "GG"
        ]

    },


    "Cropped ALO": {

        cores: [
            "Amarelo",
            "Branco",
            "Bege",
            "Rosa",
            "Verde"
        ],

        tamanhos: [
            "Único"
        ]

    },


    "Jaqueta Térmica ALO": {

        cores: [
            "Preto",
            "Branco"
        ],

        tamanhos: [
            "P",
            "M",
            "G",
            "GG"
        ]

    },


    "Camiseta Importada ON": {

        cores: [
            "Branco",
            "Preto"
        ],

        tamanhos: [
            "M",
            "G",
            "GG",
            "XL"
        ]

    },


    "Camisa Dry Fit Nike": {

        cores: [
            "Azul Marinho",
            "Cinza"
        ],

        tamanhos: [
            "M",
            "G",
            "GG"
        ]

    },


    "Camisa Dry Fit Adidas": {

        cores: [
            "Preta",
            "Cinza"
        ],

        tamanhos: [
            "M",
            "G",
            "GG"
        ]

    },


    "Short Compressão ALO": {

        cores: [
            "Cinza",
            "Azul",
            "Preto"
        ],

        tamanhos: [
            "M",
            "G",
            "GG"
        ]

    },


    "Short Dry Fit ON": {

        cores: [
            "Preto"
        ],

        tamanhos: [
            "G",
            "GG",
            "XL",
            "4XL"
        ]

    },


    "Tênis ON": {

        cores: [
            "Branco",
            "Preto"
        ],

        tamanhos: [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42"
        ]

    },


    "Tênis Nike": {

        cores: [
            "Branco",
            "Preto"
        ],

        tamanhos: [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42"
        ]

    },


    "Tênis Adidas": {

        cores: [
            "Branco",
            "Preto"
        ],

        tamanhos: [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42"
        ]

    },


    "Tênis Olympikus": {

        cores: [
            "Branco",
            "Preto"
        ],

        tamanhos: [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42"
        ]

    },


    "Meia ALO": {

        cores: [
            "Rosa"
        ],

        tamanhos: [
            "Único"
        ]

    },


    "Meia Nike": {

        cores: [
            "Branco",
            "Preto"
        ],

        tamanhos: [
            "Único"
        ]

    },


    "Meia Adidas": {

        cores: [
            "Branco",
            "Preto"
        ],

        tamanhos: [
            "Único"
        ]

    }

};


// ======================================================
// ESTOQUE INICIAL
// ======================================================

const GOLD_FIT_ESTOQUE_INICIAL = [

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
        quantidade: 3,
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
        quantidade: 7,
        foto: ""
    },

    {
        id: 4,
        grupo: "Feminino",
        categoria: "Conjuntos",
        produto: "Conjunto Top e Short Canelado",
        marca: "ALO",
        cor: "Terracota",
        tamanho: "G",
        sku: "CTS-ALO-TERRACOTA-G",
        quantidade: 6,
        foto: ""
    },


    {
        id: 5,
        grupo: "Feminino",
        categoria: "Conjuntos",
        produto: "Conjunto Top e Legging ALO",
        marca: "ALO",
        cor: "Preto",
        tamanho: "GG",
        sku: "CTL-ALO-PRETO-GG",
        quantidade: 1,
        foto: ""
    },

    {
        id: 6,
        grupo: "Feminino",
        categoria: "Conjuntos",
        produto: "Conjunto Top e Legging ALO",
        marca: "ALO",
        cor: "Goiaba",
        tamanho: "P",
        sku: "CTL-ALO-GOIABA-P",
        quantidade: 1,
        foto: ""
    },

    {
        id: 7,
        grupo: "Feminino",
        categoria: "Conjuntos",
        produto: "Conjunto Top e Legging ALO",
        marca: "ALO",
        cor: "Verde",
        tamanho: "P",
        sku: "CTL-ALO-VERDE-P",
        quantidade: 1,
        foto: ""
    },

    {
        id: 8,
        grupo: "Feminino",
        categoria: "Conjuntos",
        produto: "Conjunto Top e Legging ALO",
        marca: "ALO",
        cor: "Lilás",
        tamanho: "P",
        sku: "CTL-ALO-LILAS-P",
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
        tamanho: "Único",
        sku: "CRO-ALO-BRANCO",
        quantidade: 3,
        foto: ""
    },

    {
        id: 10,
        grupo: "Feminino",
        categoria: "Croppeds",
        produto: "Cropped ALO",
        marca: "ALO",
        cor: "Rosa",
        tamanho: "Único",
        sku: "CRO-ALO-ROSA",
        quantidade: 1,
        foto: ""
    },


    {
        id: 11,
        grupo: "Feminino",
        categoria: "Jaquetas",
        produto: "Jaqueta Térmica ALO",
        marca: "ALO",
        cor: "Preto",
        tamanho: "G",
        sku: "JAQ-ALO-PRETO-G",
        quantidade: 1,
        foto: ""
    },

    {
        id: 12,
        grupo: "Feminino",
        categoria: "Jaquetas",
        produto: "Jaqueta Térmica ALO",
        marca: "ALO",
        cor: "Branco",
        tamanho: "P",
        sku: "JAQ-ALO-BRANCO-P",
        quantidade: 1,
        foto: ""
    },


    {
        id: 13,
        grupo: "Masculino",
        categoria: "Camisetas",
        produto: "Camiseta Importada ON",
        marca: "ON",
        cor: "Branco",
        tamanho: "XL",
        sku: "CAM-ON-BRANCO-XL",
        quantidade: 1,
        foto: ""
    },

    {
        id: 14,
        grupo: "Masculino",
        categoria: "Camisetas",
        produto: "Camiseta Importada ON",
        marca: "ON",
        cor: "Preto",
        tamanho: "XL",
        sku: "CAM-ON-PRETO-XL",
        quantidade: 1,
        foto: ""
    },


    {
        id: 15,
        grupo: "Masculino",
        categoria: "Camisetas",
        produto: "Camisa Dry Fit Nike",
        marca: "Nike",
        cor: "Azul Marinho",
        tamanho: "M",
        sku: "CAM-NIKE-AZUL-M",
        quantidade: 1,
        foto: ""
    },

    {
        id: 16,
        grupo: "Masculino",
        categoria: "Camisetas",
        produto: "Camisa Dry Fit Nike",
        marca: "Nike",
        cor: "Cinza",
        tamanho: "M",
        sku: "CAM-NIKE-CINZA-M",
        quantidade: 1,
        foto: ""
    },


    {
        id: 17,
        grupo: "Masculino",
        categoria: "Camisetas",
        produto: "Camisa Dry Fit Adidas",
        marca: "Adidas",
        cor: "Preta",
        tamanho: "G",
        sku: "CAM-ADIDAS-PRETA-G",
        quantidade: 1,
        foto: ""
    },


    {
        id: 18,
        grupo: "Masculino",
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
        id: 19,
        grupo: "Masculino",
        categoria: "Shorts",
        produto: "Short Compressão ALO",
        marca: "ALO",
        cor: "Azul",
        tamanho: "GG",
        sku: "SHC-ALO-AZUL-GG",
        quantidade: 1,
        foto: ""
    },

    {
        id: 20,
        grupo: "Masculino",
        categoria: "Shorts",
        produto: "Short Compressão ALO",
        marca: "ALO",
        cor: "Preto",
        tamanho: "GG",
        sku: "SHC-ALO-PRETO-GG",
        quantidade: 1,
        foto: ""
    },


    {
        id: 21,
        grupo: "Masculino",
        categoria: "Shorts",
        produto: "Short Dry Fit ON",
        marca: "ON",
        cor: "Preto",
        tamanho: "4XL",
        sku: "SH-ON-PRETO-4XL",
        quantidade: 1,
        foto: ""
    },


    {
        id: 22,
        grupo: "Calçados",
        categoria: "Tênis",
        produto: "Tênis ON",
        marca: "ON",
        cor: "Branco",
        tamanho: "38",
        sku: "TEN-ON-BRANCO-38",
        quantidade: 1,
        foto: ""
    },


    {
        id: 23,
        grupo: "Acessórios",
        categoria: "Meias",
        produto: "Meia ALO",
        marca: "ALO",
        cor: "Rosa",
        tamanho: "Único",
        sku: "MEIA-ALO-ROSA",
        quantidade: 3,
        foto: ""
    },


    {
        id: 24,
        grupo: "Calçados",
        categoria: "Tênis",
        produto: "Tênis Nike",
        marca: "Nike",
        cor: "Branco",
        tamanho: "38",
        sku: "TEN-NIKE-BRANCO-38",
        quantidade: 2,
        foto: ""
    },

    {
        id: 25,
        grupo: "Calçados",
        categoria: "Tênis",
        produto: "Tênis Nike",
        marca: "Nike",
        cor: "Preto",
        tamanho: "40",
        sku: "TEN-NIKE-PRETO-40",
        quantidade: 1,
        foto: ""
    },


    {
        id: 26,
        grupo: "Calçados",
        categoria: "Tênis",
        produto: "Tênis Adidas",
        marca: "Adidas",
        cor: "Branco",
        tamanho: "39",
        sku: "TEN-ADIDAS-BRANCO-39",
        quantidade: 2,
        foto: ""
    },

    {
        id: 27,
        grupo: "Calçados",
        categoria: "Tênis",
        produto: "Tênis Adidas",
        marca: "Adidas",
        cor: "Preto",
        tamanho: "41",
        sku: "TEN-ADIDAS-PRETO-41",
        quantidade: 1,
        foto: ""
    },


    {
        id: 28,
        grupo: "Calçados",
        categoria: "Tênis",
        produto: "Tênis Olympikus",
        marca: "Olympikus",
        cor: "Branco",
        tamanho: "40",
        sku: "TEN-OLYMPIKUS-BRANCO-40",
        quantidade: 2,
        foto: ""
    },

    {
        id: 29,
        grupo: "Calçados",
        categoria: "Tênis",
        produto: "Tênis Olympikus",
        marca: "Olympikus",
        cor: "Preto",
        tamanho: "41",
        sku: "TEN-OLYMPIKUS-PRETO-41",
        quantidade: 1,
        foto: ""
    },


    {
        id: 30,
        grupo: "Acessórios",
        categoria: "Meias",
        produto: "Meia Nike",
        marca: "Nike",
        cor: "Branco",
        tamanho: "Único",
        sku: "MEIA-NIKE-BRANCO",
        quantidade: 4,
        foto: ""
    },

    {
        id: 31,
        grupo: "Acessórios",
        categoria: "Meias",
        produto: "Meia Nike",
        marca: "Nike",
        cor: "Preto",
        tamanho: "Único",
        sku: "MEIA-NIKE-PRETO",
        quantidade: 2,
        foto: ""
    },


    {
        id: 32,
        grupo: "Acessórios",
        categoria: "Meias",
        produto: "Meia Adidas",
        marca: "Adidas",
        cor: "Branco",
        tamanho: "Único",
        sku: "MEIA-ADIDAS-BRANCO",
        quantidade: 4,
        foto: ""
    },

    {
        id: 33,
        grupo: "Acessórios",
        categoria: "Meias",
        produto: "Meia Adidas",
        marca: "Adidas",
        cor: "Preto",
        tamanho: "Único",
        sku: "MEIA-ADIDAS-PRETO",
        quantidade: 3,
        foto: ""
    }

];


// ======================================================
// CHAVE DO PRODUTO
// ======================================================

function goldFitChaveProduto(
    produto,
    marca
) {

    return (
        `${produto}|${marca}`
    );

}


// ======================================================
// VERIFICAR ÁREA ADMIN
// ======================================================

function goldFitEhAreaAdmin() {

    if (
        typeof window ===
        "undefined"
    ) {

        return false;

    }


    return window.location.pathname
        .replace(
            /\\/g,
            "/"
        )
        .includes(
            "/admin/"
        );

}


// ======================================================
// ESTOQUE BASE
//
// Retorna os registros sem aplicar publicação,
// destaque ou lançamento.
// ======================================================

function goldFitCarregarEstoqueBase() {

    let dados =
        [];


    try {

        const salvo =
            localStorage.getItem(
                GOLD_FIT_STOCK_KEY
            );


        if (
            salvo
        ) {

            const convertido =
                JSON.parse(
                    salvo
                );


            if (
                Array.isArray(
                    convertido
                )
            ) {

                dados =
                    convertido;

            }

        }

    }

    catch (
        erro
    ) {

        console.error(
            "Erro ao carregar estoque.",
            erro
        );

    }


    if (
        dados.length ===
        0 && localStorage.getItem(GOLD_FIT_SERVER_STOCK_FLAG) !== "1"
    ) {

        dados =
            JSON.parse(
                JSON.stringify(
                    GOLD_FIT_ESTOQUE_INICIAL
                )
            );


        localStorage.setItem(

            GOLD_FIT_STOCK_KEY,

            JSON.stringify(
                dados
            )

        );


        localStorage.setItem(

            GOLD_FIT_SEED_VERSION_KEY,

            String(
                GOLD_FIT_SEED_VERSION
            )

        );


        return dados;

    }


    const versaoAtual =
        Number(
            localStorage.getItem(
                GOLD_FIT_SEED_VERSION_KEY
            )
            ||
            0
        );


    if (
        versaoAtual <
        GOLD_FIT_SEED_VERSION && localStorage.getItem(GOLD_FIT_SERVER_STOCK_FLAG) !== "1"
    ) {

        const skusExistentes =
            new Set(

                dados.map(
                    item =>
                        String(
                            item.sku
                            ||
                            ""
                        )
                        .toUpperCase()
                )

            );


        GOLD_FIT_ESTOQUE_INICIAL
            .forEach(
                item => {

                    if (
                        !skusExistentes.has(
                            String(
                                item.sku
                            )
                            .toUpperCase()
                        )
                    ) {

                        dados.push(

                            JSON.parse(
                                JSON.stringify(
                                    item
                                )
                            )

                        );

                    }

                }
            );


        localStorage.setItem(

            GOLD_FIT_STOCK_KEY,

            JSON.stringify(
                dados
            )

        );


        localStorage.setItem(

            GOLD_FIT_SEED_VERSION_KEY,

            String(
                GOLD_FIT_SEED_VERSION
            )

        );

    }


    return dados;

}


// ======================================================
// GERENCIAMENTO DE PRODUTOS DO SITE
// ======================================================

function goldFitCarregarProdutosSite() {

    const estoqueBase =
        goldFitCarregarEstoqueBase();


    let produtos =
        [];


    try {

        const salvo =
            localStorage.getItem(
                GOLD_FIT_PRODUCTS_KEY
            );


        if (
            salvo
        ) {

            const convertido =
                JSON.parse(
                    salvo
                );


            if (
                Array.isArray(
                    convertido
                )
            ) {

                produtos =
                    convertido;

            }

        }

    }

    catch (
        erro
    ) {

        console.error(
            "Erro ao carregar produtos do site.",
            erro
        );

    }


    const primeiraCriacao =
        produtos.length ===
        0;


    const mapaExistente =
        new Map();


    produtos.forEach(
        produto => {

            mapaExistente.set(
                produto.chave,
                produto
            );

        }
    );


    const agrupados =
        new Map();


    estoqueBase.forEach(
        item => {

            const chave =
                goldFitChaveProduto(
                    item.produto,
                    item.marca
                );


            if (
                !agrupados.has(
                    chave
                )
            ) {

                agrupados.set(
                    chave,
                    []
                );

            }


            agrupados
                .get(
                    chave
                )
                .push(
                    item
                );

        }
    );


    let maiorOrdem =
        produtos.reduce(
            (
                maior,
                item
            ) =>
                Math.max(
                    maior,
                    Number(
                        item.ordem
                        ||
                        0
                    )
                ),
            0
        );


    const novasConfiguracoes =
        [];


    agrupados.forEach(
        (
            variacoes,
            chave
        ) => {

            if (
                mapaExistente.has(
                    chave
                )
            ) {

                return;

            }


            const primeiro =
                variacoes[
                    0
                ];


            maiorOrdem +=
                10;


            novasConfiguracoes.push({

                chave:
                    chave,

                produto:
                    primeiro.produto,

                marca:
                    primeiro.marca,

                grupo:
                    primeiro.grupo,

                categoria:
                    primeiro.categoria,

                preco:
                    Number(
                        primeiro.preco
                        ||
                        goldFitPrecoProduto(
                            primeiro.produto
                        )
                        ||
                        0
                    ),

                fotoPrincipal:
                    "",

                publicado:
                    true,

                destaque:
                    primeiraCriacao,

                lancamento:
                    !primeiraCriacao,

                ordem:
                    maiorOrdem

            });

        }
    );


    produtos =
        [
            ...produtos,
            ...novasConfiguracoes
        ];


    // Na primeira criação mantém o comportamento antigo:
    // os últimos quatro produtos são lançamentos.

    if (
        primeiraCriacao
        &&
        produtos.length
    ) {

        produtos.forEach(
            item => {

                item.lancamento =
                    false;

            }
        );


        produtos
            .slice(
                -4
            )
            .forEach(
                item => {

                    item.lancamento =
                        true;

                }
            );

    }


    localStorage.setItem(

        GOLD_FIT_PRODUCTS_KEY,

        JSON.stringify(
            produtos
        )

    );


    return produtos;

}


function goldFitSalvarProdutosSite(produtos) {
    localStorage.setItem(GOLD_FIT_PRODUCTS_KEY, JSON.stringify(produtos));
    return typeof window.goldFitSincronizarPro === "function"
        ? window.goldFitSincronizarPro("produtos", produtos)
        : Promise.resolve();
}


// ======================================================
// ESTOQUE USADO PELO SITE
//
// Na área pública:
// - remove produtos não publicados
// - aplica preço
// - aplica grupo/categoria
// - aplica foto principal
// - aplica destaque/lançamento/ordem
//
// Na área Admin:
// - continua mostrando tudo.
// ======================================================

function goldFitCarregarEstoque() {

    const estoqueBase =
        goldFitCarregarEstoqueBase();


    const configuracoes =
        goldFitCarregarProdutosSite();


    const mapa =
        new Map();


    configuracoes.forEach(
        config => {

            mapa.set(
                config.chave,
                config
            );

        }
    );


    const resultado =
        estoqueBase.map(
            item => {

                const chave =
                    goldFitChaveProduto(
                        item.produto,
                        item.marca
                    );


                const config =
                    mapa.get(
                        chave
                    );


                if (
                    !config
                ) {

                    return {

                        ...item,

                        publicado:
                            true,

                        destaque:
                            true,

                        lancamento:
                            false,

                        ordem:
                            9999

                    };

                }


                return {

                    ...item,

                    grupo:
                        config.grupo
                        ||
                        item.grupo,

                    categoria:
                        config.categoria
                        ||
                        item.categoria,

                    preco:
                        Number(
                            config.preco
                            ??
                            item.preco
                            ??
                            goldFitPrecoProduto(
                                item.produto
                            )
                            ??
                            0
                        ),

                    foto:
                        config.fotoPrincipal
                        ||
                        item.foto,

                    publicado:
                        config.publicado !==
                        false,

                    destaque:
                        Boolean(
                            config.destaque
                        ),

                    lancamento:
                        Boolean(
                            config.lancamento
                        ),

                    ordem:
                        Number(
                            config.ordem
                            ||
                            9999
                        )

                };

            }
        );


    if (
        goldFitEhAreaAdmin()
    ) {

        return resultado;

    }


    return resultado.filter(
        item =>
            item.publicado !==
            false
    );

}


// Modelos publicados são independentes das cores habilitadas para compra.
// O catálogo e a Home usam este mesmo agrupamento, sem criar SKUs artificiais.
function goldFitAgruparModelosVitrine(variacoes = goldFitCarregarEstoque(), configuracoes = goldFitCarregarProdutosSite()) {
    const mapa = new Map();
    for (const config of Array.isArray(configuracoes) ? configuracoes : []) {
        if (!config || !config.chave || config.publicado === false) continue;
        mapa.set(config.chave, {
            chave: config.chave, produto: config.produto, marca: config.marca,
            grupo: config.grupo, categoria: config.categoria,
            preco: Number(config.preco || 0), destaque: Boolean(config.destaque),
            lancamento: Boolean(config.lancamento), ordem: Number(config.ordem || 9999),
            variacoes: []
        });
    }
    for (const item of Array.isArray(variacoes) ? variacoes : []) {
        if (!item || item.publicado === false) continue;
        const chave = goldFitChaveProduto(item.produto, item.marca);
        if (!mapa.has(chave)) {
            mapa.set(chave, {
                chave, produto: item.produto, marca: item.marca,
                grupo: item.grupo, categoria: item.categoria,
                preco: Number(item.preco || 0), destaque: Boolean(item.destaque),
                lancamento: Boolean(item.lancamento), ordem: Number(item.ordem || 9999),
                variacoes: []
            });
        }
        mapa.get(chave).variacoes.push(item);
    }
    return [...mapa.values()].sort((a, b) => a.ordem - b.ordem);
}

// A mesma fonte publica do PostgreSQL alimenta os menus da Home,
// do Catalogo e da pagina de produto. O endpoint ja filtra modelos
// despublicados e so devolve variacoes com foto de modelo aprovada.
// Um modelo sem fotos continua elegivel ao menu/card de demonstracao.
let goldFitConsultaMenuPendente = null;
function goldFitConsultarModelosPublicados() {
    if (goldFitConsultaMenuPendente) return goldFitConsultaMenuPendente;
    const consulta = fetch("/api/loja/estado?visao=publica", {
        credentials: "same-origin", cache: "no-store"
    }).then(async resposta => {
        if (!resposta.ok) throw new Error(`Catalogo indisponivel (HTTP ${resposta.status})`);
        const dados = await resposta.json();
        if (!Array.isArray(dados.produtos) || !Array.isArray(dados.estoque)) {
            throw new Error("Catalogo ainda nao sincronizado com o PostgreSQL");
        }
        return goldFitAgruparModelosVitrine(dados.estoque, dados.produtos);
    });
    goldFitConsultaMenuPendente = consulta.finally(() => { goldFitConsultaMenuPendente = null; });
    return goldFitConsultaMenuPendente;
}

// Normalizacao para cadastros antigos escritos sem acento/espacos.
function goldFitGrupoMenu(valor) {
    const grupo = String(valor || "").normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
    if (grupo === "calcados") return "Calçados";
    if (grupo === "acessorios") return "Acessórios";
    if (grupo === "feminino") return "Feminino";
    return String(valor || "").trim();
}

function goldFitSalvarEstoque(estoque) {
    localStorage.setItem(GOLD_FIT_STOCK_KEY, JSON.stringify(estoque));
    return typeof window.goldFitSincronizarPro === "function"
        ? window.goldFitSincronizarPro("estoque", estoque)
        : Promise.resolve();
}


// ======================================================
// PREÇO
// ======================================================

function goldFitPrecoProduto(
    nome
) {

    return Number(
        GOLD_FIT_PRICES[
            nome
        ]
        ||
        0
    );

}


function goldFitFormatarPreco(
    valor
) {

    if (
        Number(
            valor
        ) <=
        0
    ) {

        return "Consultar preço";

    }


    return Number(
        valor
    ).toLocaleString(

        "pt-BR",

        {

            style:
                "currency",

            currency:
                "BRL"

        }

    );

}


// ======================================================
// SEGURANÇA DO TEXTO
// ======================================================

function goldFitEscapeHtml(
    valor
) {

    return String(
        valor ?? ""
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
// OPÇÕES DE PRODUTO
// ======================================================

function goldFitOpcoesProduto(
    nome,
    variacoes = []
) {

    const configurado =
        GOLD_FIT_PRODUCT_OPTIONS[
            nome
        ]
        ||
        {};


    const coresEstoque =
        [
            ...new Set(

                variacoes
                    .map(
                        item =>
                            item.cor
                    )
                    .filter(
                        Boolean
                    )

            )
        ];


    const tamanhosEstoque =
        [
            ...new Set(

                variacoes
                    .map(
                        item =>
                            item.tamanho
                    )
                    .filter(
                        Boolean
                    )

            )
        ];


    return {

        cores:
            [
                ...new Set([

                    ...(
                        configurado.cores
                        ||
                        []
                    ),

                    ...coresEstoque

                ])
            ],

        tamanhos:
            [
                ...new Set([

                    ...(
                        configurado.tamanhos
                        ||
                        []
                    ),

                    ...tamanhosEstoque

                ])
            ]

    };

}


// ======================================================
// PLACEHOLDER
// ======================================================

function goldFitPlaceholder(
    produto
) {

    const nome =
        goldFitEscapeHtml(
            produto.produto
            ||
            "Produto"
        );


    const marca =
        goldFitEscapeHtml(
            produto.marca
            ||
            "Gold Fit"
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
                        stop-color="#111111"
                    />

                    <stop
                        offset="100%"
                        stop-color="#302800"
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
                fill="#f3c600"
            />


            <text
                x="400"
                y="405"
                text-anchor="middle"
                font-family="Arial"
                font-size="52"
                font-weight="700"
                fill="#111111"
            >
                ${marca}
            </text>


            <text
                x="400"
                y="475"
                text-anchor="middle"
                font-family="Arial"
                font-size="27"
                fill="#111111"
            >
                ${nome}
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
// CARRINHO
// ======================================================

function goldFitCarregarCarrinho() {

    try {

        return (
            JSON.parse(
                localStorage.getItem(
                    GOLD_FIT_CART_KEY
                )
            )
            ||
            []
        );

    }

    catch {

        return [];

    }

}


function goldFitSalvarCarrinho(
    carrinho
) {

    localStorage.setItem(

        GOLD_FIT_CART_KEY,

        JSON.stringify(
            carrinho
        )

    );

}


function goldFitQuantidadeCarrinho() {

    return goldFitCarregarCarrinho()
        .reduce(

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

}


// ======================================================
// SESSÃO
// ======================================================

function goldFitCarregarSessao() {

    try {

        return (
            JSON.parse(
                localStorage.getItem(
                    GOLD_FIT_SESSION_KEY
                )
            )
            ||
            null
        );

    }

    catch {

        return null;

    }

}


function goldFitSalvarSessao(
    usuario
) {

    localStorage.setItem(

        GOLD_FIT_SESSION_KEY,

        JSON.stringify(
            usuario
        )

    );

}


function goldFitSair() {

    localStorage.removeItem(
        GOLD_FIT_SESSION_KEY
    );

}


// ======================================================
// USUÁRIOS
// ======================================================

function goldFitCarregarUsuarios() {

    let usuarios =
        [];


    try {

        usuarios =
            JSON.parse(
                localStorage.getItem(
                    GOLD_FIT_USERS_KEY
                )
            )
            ||
            [];

    }

    catch {

        usuarios =
            [];

    }


    const adminExiste =
        usuarios.some(

            usuario =>
                String(
                    usuario.email
                )
                .toLowerCase()
                ===
                "admin@goldfit.demo"

        );


    if (
        !adminExiste
    ) {

        usuarios.push({

            id:
                "admin-demo",

            nome:
                "Administrador Gold Fit",

            email:
                "admin@goldfit.demo",

            senha:
                "goldfit2026",

            perfil:
                "admin"

        });


        localStorage.setItem(

            GOLD_FIT_USERS_KEY,

            JSON.stringify(
                usuarios
            )

        );

    }


    return usuarios;

}


function goldFitSalvarUsuarios(
    usuarios
) {

    localStorage.setItem(

        GOLD_FIT_USERS_KEY,

        JSON.stringify(
            usuarios
        )

    );

}
// GOLD FIT PRO V18: o PostgreSQL e a referencia para o estoque do site.
// Consultas nunca alteram o banco; salvamentos administrativos sao aguardados.
(function goldFitInicializarSincronizacaoPro() {
    if (window.location.protocol === "file:") return;
    const chaves = [
        { nome: "estoque", chave: GOLD_FIT_STOCK_KEY },
        { nome: "produtos", chave: GOLD_FIT_PRODUCTS_KEY }
    ];
    let carregando = null;
    let salvamentosPendentes = 0;
    let filaGravacao = Promise.resolve();
    let ultimaConsulta = 0;

    function buscarAtualizacoes() {
        if (carregando || salvamentosPendentes) return carregando || Promise.resolve();
        ultimaConsulta = Date.now();
        carregando = fetch(goldFitEhAreaAdmin() ? "/api/loja/estado" : "/api/loja/estado?visao=publica", { credentials: "same-origin", cache: "no-store" })
            .then(async res => {
                if (!res.ok) throw new Error(`API indisponivel (HTTP ${res.status})`);
                return res.json();
            })
            .then(payload => {
                // Se um salvamento comecou durante o GET, a resposta pode
                // estar antiga. Nunca sobrescrever o formulario que salva.
                if (salvamentosPendentes) return;
                // Ao migrar da V17, nao descartar itens novos que ainda
                // possam existir apenas neste navegador (salvamento rejeitado).
                if (goldFitEhAreaAdmin() && Array.isArray(payload.estoque)) {
                    let local = [];
                    try { local = JSON.parse(localStorage.getItem(GOLD_FIT_STOCK_KEY) || "[]"); } catch (_) {}
                    if (Array.isArray(local)) {
                        const skusBanco = new Set(payload.estoque.map(item => String(item.sku || "").toUpperCase()));
                        const skusExemplo = new Set(GOLD_FIT_ESTOQUE_INICIAL.map(item => String(item.sku || "").toUpperCase()));
                        const naoSalvos = local.filter(item => item && item.sku
                            && !skusBanco.has(String(item.sku).toUpperCase())
                            && !skusExemplo.has(String(item.sku).toUpperCase()));
                        if (naoSalvos.length) {
                            console.warn("Gold Fit Pro: itens apenas neste navegador; a leitura do banco nao os apagou:", naoSalvos.map(item => item.sku));
                            if (sessionStorage.getItem("goldfit_aviso_nao_sincronizados_v18") !== "1") {
                                sessionStorage.setItem("goldfit_aviso_nao_sincronizados_v18", "1");
                                alert(`${naoSalvos.length} produto(s) ainda estao apenas neste navegador. Foram preservados. Abra Estoque e salve esses cadastros novamente para confirmar no PostgreSQL.`);
                            }
                            return;
                        }
                    }
                }
                // O banco pode nao estar inicializado ainda: nao transformar null em [].
                // O cadastro inicial legado so vale para banco realmente vazio.
                let alterou = false;
                if (Array.isArray(payload.estoque)) {
                    localStorage.setItem(GOLD_FIT_SERVER_STOCK_FLAG, "1");
                    localStorage.setItem(GOLD_FIT_SEED_VERSION_KEY, String(GOLD_FIT_SEED_VERSION));
                }
                for (const item of chaves) {
                    if (!Array.isArray(payload[item.nome])) continue;
                    const recebido = JSON.stringify(payload[item.nome]);
                    if (localStorage.getItem(item.chave) !== recebido) {
                        localStorage.setItem(item.chave, recebido);
                        alterou = true;
                    }
                }
                // V27: atualizar apenas os componentes que usam os dados.
                // O reload completo aqui causava uma segunda navegacao na
                // abertura de cada pagina (flash/tela branca) e perda de foco.
                if (alterou) {
                    window.dispatchEvent(new CustomEvent("goldfit:estado-atualizado", {
                        detail: { origem: "postgresql" }
                    }));
                }
            })
            .catch(erro => {
                console.warn("Gold Fit Pro: nao foi possivel atualizar o site pelo banco:", erro.message);
            })
            .finally(() => { carregando = null; });
        return carregando;
    }

    window.goldFitSincronizarPro = function(documento, dados) {
        // A sequencia protege o par produtos/estoque dos writes paralelos do painel.
        // A promessa rejeita nos erros: nao mostrar "salvo" antes do banco confirmar.
        salvamentosPendentes++;
        const acao = filaGravacao.catch(() => {}).then(async () => {
            const res = await fetch(`/api/loja/estado/${documento}`, {
                method: "PUT", credentials: "same-origin", cache: "no-store",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dados })
            });
            const resposta = await res.json().catch(() => ({}));
            if (!res.ok || resposta.status !== "ok") {
                throw new Error(resposta.mensagem || `Nao foi possivel salvar no banco (HTTP ${res.status}).`);
            }
            return resposta;
        });
        filaGravacao = acao.catch(() => {});
        return acao.finally(() => { salvamentosPendentes--; });
    };

    // A vitrine aberta em outra aba pode atualizar quando o usuario voltar a ela.
    window.addEventListener("focus", () => {
        if (Date.now() - ultimaConsulta >= 1000) buscarAtualizacoes();
    });
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden && Date.now() - ultimaConsulta >= 1000) buscarAtualizacoes();
    });
    buscarAtualizacoes();
})();
