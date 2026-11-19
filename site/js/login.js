"use strict";
/* GOLD FIT PRO V14 — Uma tela de login; privilégios de administrador
 * SEMPRE dependem da sessão do backend (/api/admin/login).
 * O cadastro local de clientes nunca é usado como autorização de painel.
 */
(() => {
    const $ = id => document.getElementById(id);
    const parametros = new URLSearchParams(location.search);
    // Links sempre relativos à pasta do site, inclusive em /gold-fit/ no GitHub Pages.
    const pastaSite = new URL('./', location.href);
    const urlSite = caminho => new URL(String(caminho).replace(/^\/+/, ''), pastaSite).href;
    let apiDisponivel = false;
    const proximo = parametros.get("next") || "";
    const rotaAdmin = /^\/?admin\/(?:estoque|produtos|gerador-imagens)\.html$/;
    const acessoAdmin = parametros.get("modo") === "admin" || rotaAdmin.test(proximo);
    const destinoAdmin = urlSite(rotaAdmin.test(proximo) ? proximo : "admin/produtos.html");
    const formLogin = $("formLogin");
    const formCadastro = $("formCadastro");
    const area = $("areaAuth");
    const sessaoCaixa = $("sessaoAtual");
    const abas = document.querySelector(".auth-tabs");
    const emailInput = $("loginEmail");
    const senhaInput = $("loginSenha");
    const toast = $("toast");
    const preencherDemo = $("gf17PreencherDemo");
    if (preencherDemo) preencherDemo.addEventListener("click", () => {
        emailInput.value = "admin@goldfit.demo";
        senhaInput.value = "goldfitjade2026";
        senhaInput.focus();
    });
    let timerAviso;

    function aviso(texto) {
        if (!toast) return;
        clearTimeout(timerAviso);
        toast.textContent = texto;
        toast.classList.add("show");
        timerAviso = setTimeout(() => toast.classList.remove("show"), 4400);
    }
    function trocarAba(aba) {
        document.querySelectorAll(".auth-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === aba));
        formLogin.classList.toggle("active", aba === "login");
        formCadastro.classList.toggle("active", aba === "cadastro");
    }
    function limparAdminLocalFalso() {
        const local = goldFitCarregarSessao();
        if (local?.perfil === "admin") goldFitSair();
    }
    async function verificarSessaoAdmin() {
        try {
            // Em GitHub Pages/Live Server a rota não existe. Não assumir que
            // qualquer resposta 200 seja uma API válida (pode ser HTML).
            const r = await fetch(urlSite("api/admin/session"), {
                credentials: "same-origin", cache: "no-store",
                headers: { Accept: "application/json" }
            });
            if (!r.ok) return { api: false, admin: false };
            const dados = await r.json();
            if (dados?.status !== "ok" || typeof dados.admin !== "boolean") {
                return { api: false, admin: false };
            }
            return { api: true, admin: dados.admin };
        } catch (_) {
            return { api: false, admin: false };
        }
    }
    function preencherPainel() {
        area.hidden = true;
        sessaoCaixa.hidden = false;
        sessaoCaixa.replaceChildren();
        const titulo = document.createElement("h2");
        titulo.textContent = "Administrador Gold Fit";
        const descricao = document.createElement("p");
        descricao.textContent = "Acesso administrativo confirmado pelo servidor.";
        sessaoCaixa.append(titulo, descricao);
        for (const [label, endereco] of [
            ["PRODUTOS E ESTOQUE", "admin/produtos.html"],
            ["GERADOR DE IMAGENS", "admin/gerador-imagens.html"]
        ]) {
            const botao = document.createElement("button");
            botao.type = "button"; botao.textContent = label;
            botao.className = "auth-submit";
            botao.style.cssText = "display:block;width:100%;margin:10px 0;padding:14px;font-size:11px";
            botao.addEventListener("click", () => location.assign(urlSite(endereco)));
            sessaoCaixa.append(botao);
        }
        const sair = document.createElement("button");
        sair.type = "button"; sair.textContent = "SAIR DA CONTA";
        sair.className = "auth-submit";
        sair.style.cssText = "background:#eee;display:block;width:100%;margin-top:16px;padding:14px;color:#111";
        sair.addEventListener("click", async () => {
            try { await fetch("/api/admin/logout", {method:"POST", credentials:"same-origin"}); }
            finally { goldFitSair(); location.replace(urlSite("login.html?modo=admin")); }
        });
        sessaoCaixa.append(sair);
    }
    function preencherCliente(usuario) {
        area.hidden = true;
        sessaoCaixa.hidden = false;
        sessaoCaixa.replaceChildren();
        const h = document.createElement("h2"); h.textContent = `Olá, ${usuario.nome || "cliente"}`;
        const d = document.createElement("p"); d.textContent = usuario.email || "Conta Gold Fit";
        const loja = document.createElement("button"); loja.className="auth-submit";
        loja.type="button"; loja.textContent="VOLTAR PARA A LOJA";
        loja.onclick=()=>location.assign(urlSite("index.html"));
        const sair = document.createElement("button"); sair.type="button";
        sair.textContent="SAIR DA CONTA"; sair.style.cssText="padding:12px;margin-top:12px";
        sair.onclick=()=>{ goldFitSair(); location.replace(urlSite("login.html")); };
        sessaoCaixa.append(h,d,loja,sair);
    }
    async function autenticarAdmin(senha) {
        if (!apiDisponivel) {
            // GitHub Pages e Live Server: simula acesso SOMENTE no navegador.
            // Não grava sessão admin do backend e não libera rotas privadas.
            if (senha !== "goldfitjade2026" || emailInput.value.trim().toLowerCase() !== "admin@goldfit.demo") {
                throw new Error("E-mail ou senha de demonstração incorretos.");
            }
            sessionStorage.setItem("gf_static_demo_access", "1");
            location.assign(urlSite("admin/produtos.html"));
            return;
        }
        const resposta = await fetch(urlSite("api/admin/login"), {
            method: "POST", credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({senha})
        });
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok) throw new Error(dados.mensagem || "Senha administrativa incorreta.");
        goldFitSalvarSessao({ id:"painel", nome:"Administrador Gold Fit", email:"admin@goldfit.demo", perfil:"admin" });
        location.assign(destinoAdmin);
    }
    function destinoCliente() {
        if (!proximo || rotaAdmin.test(proximo)) return urlSite("index.html");
        // Somente caminhos internos; nunca redirecionar clientes para hosts externos.
        if (!/^\/?(?:index|catalogo|carrinho|produto)\.html(?:\?[^#]*)?$/.test(proximo)) return urlSite("index.html");
        return urlSite(proximo);
    }
    async function iniciar() {
        const estado = await verificarSessaoAdmin();
        apiDisponivel = estado.api;
        const avisoEstatico = $("gfStaticLoginNotice");
        if (avisoEstatico) avisoEstatico.style.display = apiDisponivel ? "none" : "block";
        if (estado.admin) {
            // Essencial: Produtos e Estoque exige também este registro local.
            // Sem ele, o servidor envia ao painel e o painel devolve ao login
            // indefinidamente, mesmo com o cookie do servidor válido.
            goldFitSalvarSessao({
                id: "painel", nome: "Administrador Gold Fit",
                email: "admin@goldfit.demo", perfil: "admin"
            });
            if (acessoAdmin && rotaAdmin.test(proximo)) {
                location.replace(destinoAdmin); return;
            }
            preencherPainel(); return;
        }
        limparAdminLocalFalso();
        if (!apiDisponivel && sessionStorage.getItem("gf_static_demo_access") === "1") {
            area.hidden = true;
            sessaoCaixa.hidden = false;
            sessaoCaixa.replaceChildren();
            const titulo = document.createElement("h2"); titulo.textContent = "Demonstração Gold Fit";
            const texto = document.createElement("p"); texto.textContent = "Painel demonstrativo com a aparência e os formulários originais. As alterações são locais neste navegador; a geração de imagens está desativada.";
            const painel = document.createElement("button"); painel.className = "auth-submit"; painel.type = "button"; painel.textContent = "ABRIR PRODUTOS E ESTOQUE";
            painel.addEventListener("click", () => location.assign(urlSite("admin/produtos.html")));
            const fotos = document.createElement("button"); fotos.className = "auth-submit"; fotos.type = "button"; fotos.textContent = "VER MODELOS E FOTOS EXPORTADAS"; fotos.style.marginTop = "12px";
            fotos.addEventListener("click", () => location.assign(urlSite("admin/estudio-demo.html")));
            const sair = document.createElement("button"); sair.className="auth-submit"; sair.type="button"; sair.textContent="SAIR DA DEMONSTRAÇÃO";
            sair.style.cssText="background:#eee;color:#111;margin-top:12px";
            sair.addEventListener("click", () => {sessionStorage.removeItem("gf_static_demo_access");location.replace(urlSite("login.html?modo=admin"));});
            sessaoCaixa.append(titulo,texto,painel,fotos,sair);
            return;
        }
        sessaoCaixa.hidden = true; area.hidden = false;
        if (acessoAdmin) {
            if (abas) abas.hidden = true;
            emailInput.value = "admin@goldfit.demo";
            emailInput.readOnly = true;
            formLogin.querySelector("h2").textContent = "Entrar no painel";
            formLogin.querySelector("p").textContent = apiDisponivel
                ? "Informe a senha administrativa configurada no .env do projeto."
                : "No Live Server/GitHub Pages, acesse uma demonstração local (sem PostgreSQL).";
        } else {
            const cliente = goldFitCarregarSessao();
            if (cliente?.perfil === "cliente") preencherCliente(cliente);
        }
    }
    document.querySelectorAll(".auth-tab").forEach(tab => {
        tab.addEventListener("click", () => trocarAba(tab.dataset.tab));
    });
    formLogin.addEventListener("submit", async evento => {
        evento.preventDefault();
        const email = emailInput.value.trim().toLowerCase();
        const senha = senhaInput.value;
        const botao = formLogin.querySelector('button[type="submit"]');
        botao.disabled = true;
        try {
            const usuarioLocal = goldFitCarregarUsuarios().find(u => String(u.email).toLowerCase() === email);
            if (acessoAdmin || email === "admin@goldfit.demo" || email === "admin@goldfit.local" || usuarioLocal?.perfil === "admin") {
                await autenticarAdmin(senha); return;
            }
            if (!usuarioLocal || usuarioLocal.perfil !== "cliente" || usuarioLocal.senha !== senha) {
                throw new Error("E-mail ou senha inválidos.");
            }
            goldFitSalvarSessao({id:usuarioLocal.id,nome:usuarioLocal.nome,email:usuarioLocal.email,perfil:"cliente"});
            location.assign(destinoCliente());
        } catch (erro) { aviso(erro.message); botao.disabled = false; }
    });
    formCadastro.addEventListener("submit", evento => {
        evento.preventDefault();
        const nome = $("cadastroNome").value.trim();
        const email = $("cadastroEmail").value.trim().toLowerCase();
        const senha = $("cadastroSenha").value;
        const usuarios = goldFitCarregarUsuarios();
        if (!nome || !email || !senha || senha.length < 6) return aviso("Preencha corretamente nome, e-mail e senha.");
        if (usuarios.some(u=>String(u.email).toLowerCase() === email)) return aviso("Esse e-mail já está cadastrado.");
        const usuario = {id:`cliente-${Date.now()}`, nome, email, senha, perfil:"cliente"};
        usuarios.push(usuario); goldFitSalvarUsuarios(usuarios);
        goldFitSalvarSessao({id:usuario.id, nome, email, perfil:"cliente"});
        location.assign(destinoCliente());
    });
    trocarAba("login");
    iniciar().catch(erro => aviso(`Falha ao verificar o acesso: ${erro.message}`));
})();
