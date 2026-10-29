const toast =
    document.getElementById(
        "toast"
    );


const next =
    new URLSearchParams(
        window.location.search
    )
    .get(
        "next"
    );


goldFitCarregarUsuarios();

configurarAbas();

configurarForms();

mostrarSessao();


// ======================================================
// ABAS
// ======================================================

function configurarAbas() {

    document
        .querySelectorAll(
            ".auth-tab"
        )
        .forEach(
            tab => {

                tab.addEventListener(
                    "click",
                    function () {

                        document
                            .querySelectorAll(
                                ".auth-tab"
                            )
                            .forEach(
                                item => {

                                    item.classList.toggle(

                                        "active",

                                        item ===
                                        tab

                                    );

                                }
                            );


                        document
                            .getElementById(
                                "formLogin"
                            )
                            .classList
                            .toggle(

                                "active",

                                tab.dataset.tab ===
                                "login"

                            );


                        document
                            .getElementById(
                                "formCadastro"
                            )
                            .classList
                            .toggle(

                                "active",

                                tab.dataset.tab ===
                                "cadastro"

                            );

                    }
                );

            }
        );

}


// ======================================================
// FORM LOGIN
// ======================================================

function configurarForms() {


    document
        .getElementById(
            "formLogin"
        )
        .addEventListener(
            "submit",
            function (
                event
            ) {

                event.preventDefault();


                const email =
                    document
                        .getElementById(
                            "loginEmail"
                        )
                        .value
                        .trim()
                        .toLowerCase();


                const senha =
                    document
                        .getElementById(
                            "loginSenha"
                        )
                        .value;


                const usuario =
                    goldFitCarregarUsuarios()
                        .find(
                            item =>

                                String(
                                    item.email
                                )
                                .toLowerCase()
                                ===
                                email

                                &&

                                item.senha ===
                                senha
                        );


                if (
                    !usuario
                ) {

                    mostrarToast(
                        "E-mail ou senha inválidos."
                    );


                    return;

                }


                const sessao = {

                    id:
                        usuario.id,

                    nome:
                        usuario.nome,

                    email:
                        usuario.email,

                    perfil:
                        usuario.perfil

                };


                goldFitSalvarSessao(
                    sessao
                );


                if (
                    sessao.perfil ===
                    "admin"
                ) {

                    window.location.href =
                        "./login.html";


                    return;

                }


                redirecionarCliente();

            }
        );


    document
        .getElementById(
            "formCadastro"
        )
        .addEventListener(
            "submit",
            function (
                event
            ) {

                event.preventDefault();


                const nome =
                    document
                        .getElementById(
                            "cadastroNome"
                        )
                        .value
                        .trim();


                const email =
                    document
                        .getElementById(
                            "cadastroEmail"
                        )
                        .value
                        .trim()
                        .toLowerCase();


                const senha =
                    document
                        .getElementById(
                            "cadastroSenha"
                        )
                        .value;


                const usuarios =
                    goldFitCarregarUsuarios();


                const existe =
                    usuarios.some(
                        usuario =>
                            String(
                                usuario.email
                            )
                            .toLowerCase()
                            ===
                            email
                    );


                if (
                    existe
                ) {

                    mostrarToast(
                        "Já existe uma conta com esse e-mail."
                    );


                    return;

                }


                const usuario = {

                    id:
                        `cliente-${Date.now()}`,

                    nome:
                        nome,

                    email:
                        email,

                    senha:
                        senha,

                    perfil:
                        "cliente"

                };


                usuarios.push(
                    usuario
                );


                goldFitSalvarUsuarios(
                    usuarios
                );


                goldFitSalvarSessao({

                    id:
                        usuario.id,

                    nome:
                        usuario.nome,

                    email:
                        usuario.email,

                    perfil:
                        "cliente"

                });


                redirecionarCliente();

            }
        );

}


// ======================================================
// REDIRECIONAMENTO
// ======================================================

function redirecionarCliente() {

    if (
        next
    ) {

        if (
            /^https?:\/\//i.test(
                next
            )
        ) {

            window.location.href =
                next;


            return;

        }


        window.location.href =
            `./${
                next.replace(
                    /^\.\//,
                    ""
                )
            }`;


        return;

    }


    window.location.href =
        "./index.html";

}


// ======================================================
// CONTA
// ======================================================

function mostrarSessao() {

    const sessao =
        goldFitCarregarSessao();


    if (
        !sessao
    ) {

        return;

    }


    document
        .getElementById(
            "areaAuth"
        )
        .hidden =
        true;


    const box =
        document.getElementById(
            "sessaoAtual"
        );


    box.hidden =
        false;


    const inicial =
        String(
            sessao.nome
            ||
            "U"
        )
        .charAt(
            0
        )
        .toUpperCase();


    const ehAdmin =
        sessao.perfil ===
        "admin";


    box.innerHTML =
        `

        <div
            style="
                display:flex;
                align-items:center;
                gap:14px;
                margin-bottom:22px;
            "
        >

            <div
                style="
                    width:52px;
                    height:52px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    border-radius:50%;
                    background:#f3c600;
                    color:#111;
                    font-size:20px;
                    font-weight:900;
                "
            >
                ${goldFitEscapeHtml(
                    inicial
                )}
            </div>


            <div>

                <small
                    style="
                        display:block;
                        margin-bottom:4px;
                        color:#888;
                        font-size:10px;
                        font-weight:900;
                        letter-spacing:1px;
                    "
                >
                    CONTA GOLD FIT
                </small>


                <strong
                    style="
                        font-size:20px;
                        font-weight:900;
                    "
                >
                    ${goldFitEscapeHtml(
                        sessao.nome
                    )}
                </strong>

            </div>

        </div>


        <div
            style="
                padding:18px 0;
                border-top:1px solid #e5e5e5;
                border-bottom:1px solid #e5e5e5;
            "
        >

            <div
                style="
                    margin-bottom:14px;
                "
            >

                <small
                    style="
                        display:block;
                        margin-bottom:4px;
                        color:#999;
                        font-size:10px;
                        font-weight:900;
                    "
                >
                    E-MAIL
                </small>


                <strong
                    style="
                        font-size:12px;
                    "
                >
                    ${goldFitEscapeHtml(
                        sessao.email
                    )}
                </strong>

            </div>


            <div>

                <small
                    style="
                        display:block;
                        margin-bottom:4px;
                        color:#999;
                        font-size:10px;
                        font-weight:900;
                    "
                >
                    PERFIL
                </small>


                <strong
                    style="
                        font-size:12px;
                    "
                >
                    ${
                        ehAdmin
                            ?
                            "Administrador"
                            :
                            "Cliente"
                    }
                </strong>

            </div>

        </div>


        <div
            style="
                margin-top:18px;
                display:grid;
                gap:8px;
            "
        >


            ${
                ehAdmin

                    ?

                    `

                    <button
                        type="button"
                        id="btnGerenciarProdutos"
                        style="
                            width:100%;
                            height:48px;
                            margin:0;
                            border:0;
                            background:#f3c600;
                            color:#111;
                            font-size:10px;
                            font-weight:900;
                        "
                    >
                        GERENCIAR PRODUTOS DO SITE
                    </button>


                    <button
                        type="button"
                        id="btnGerenciarEstoque"
                        style="
                            width:100%;
                            height:48px;
                            margin:0;
                            border:1px solid #111;
                            background:white;
                            color:#111;
                            font-size:10px;
                            font-weight:900;
                        "
                    >
                        GERENCIAMENTO DE ESTOQUE
                    </button>

                    `

                    :

                    ""
            }


            <button
                type="button"
                id="btnVoltarLoja"
                style="
                    width:100%;
                    height:46px;
                    margin:0;
                    border:1px solid #111;
                    background:#111;
                    color:white;
                    font-size:10px;
                    font-weight:900;
                "
            >
                VOLTAR PARA A LOJA
            </button>


            ${
                next
                &&
                !ehAdmin

                    ?

                    `
                    <button
                        type="button"
                        id="btnContinuarCompra"
                        style="
                            width:100%;
                            height:46px;
                            margin:0;
                            border:1px solid #ddd;
                            background:white;
                            color:#111;
                            font-size:10px;
                            font-weight:900;
                        "
                    >
                        CONTINUAR COMPRA
                    </button>
                    `

                    :

                    ""
            }


            <button
                type="button"
                id="btnSair"
                style="
                    width:100%;
                    height:42px;
                    margin:4px 0 0;
                    border:0;
                    background:#f2f2f2;
                    color:#8a3030;
                    font-size:10px;
                    font-weight:900;
                "
            >
                SAIR DA CONTA
            </button>

        </div>

        `;


    if (
        ehAdmin
    ) {

        document
            .getElementById(
                "btnGerenciarProdutos"
            )
            .addEventListener(
                "click",
                function () {

                    window.location.href =
                        "./admin/produtos.html";

                }
            );


        document
            .getElementById(
                "btnGerenciarEstoque"
            )
            .addEventListener(
                "click",
                function () {

                    window.location.href =
                        "./admin/estoque.html";

                }
            );

    }


    document
        .getElementById(
            "btnVoltarLoja"
        )
        .addEventListener(
            "click",
            function () {

                window.location.href =
                    "./index.html";

            }
        );


    const continuar =
        document.getElementById(
            "btnContinuarCompra"
        );


    if (
        continuar
    ) {

        continuar.addEventListener(
            "click",
            redirecionarCliente
        );

    }


    document
        .getElementById(
            "btnSair"
        )
        .addEventListener(
            "click",
            function () {

                goldFitSair();


                window.location.href =
                    "./index.html";

            }
        );

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