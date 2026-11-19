"use strict";
(() => {
    const form = document.getElementById("gfLoginForm");
    const mensagem = document.getElementById("gfLoginMensagem");
    fetch("/api/admin/session", { credentials: "same-origin" })
        .then(r => r.json())
        .then(data => {
            if (data.admin === true) window.location.replace("/admin/gerador-imagens.html");
        }).catch(() => {});
    form.addEventListener("submit", async e => {
        e.preventDefault();
        const btn = form.querySelector("button");
        btn.disabled = true;
        mensagem.textContent = "Verificando acesso...";
        try {
            const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ senha: document.getElementById("gfSenha").value })
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body.mensagem || "Não foi possível entrar.");
            // Compatibilidade com as telas antigas do projeto, que usam sessão local para exibição.
            if (typeof goldFitSalvarSessao === "function") {
                goldFitSalvarSessao({ id: "painel", nome: "Administrador Gold Fit", email: "admin@goldfit.local", perfil: "admin" });
            }
            window.location.href = "/admin/gerador-imagens.html";
        } catch (error) {
            mensagem.textContent = error.message;
            btn.disabled = false;
        }
    });
})();
