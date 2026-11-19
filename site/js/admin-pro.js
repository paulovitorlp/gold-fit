"use strict";
(function() {
    document.querySelectorAll('a[href="../login.html"]').forEach(link => {
        if (!/sair/i.test(link.textContent || "")) return;
        link.setAttribute("href", "#sair");
        link.addEventListener("click", async e => {
            e.preventDefault();
            try { if (!window.GoldFitDemoStatic) await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" }); }
            finally {
                if (typeof goldFitSair === "function") goldFitSair();
                if (window.GoldFitDemoStatic) sessionStorage.removeItem("gf_static_demo_access");
                window.location.replace(new URL("../login.html?modo=admin", location.href));
            }
        });
    });
})();
