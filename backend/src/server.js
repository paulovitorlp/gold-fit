"use strict";

/* GOLD FIT PRO — painel/estoque/geração (container independente). */
const express = require("express");
const session = require("express-session");
const path = require("node:path");
const { timingSafeEqual } = require("node:crypto");
const { pool } = require("./db");
const modelos = require("./routes/modelos-virtuais");
const geracao = require("./routes/geracao-imagens");
const historico = require("./routes/geracoes-historico");
const correcoes = require("./routes/correcoes-imagens");
const loja = require("./routes/loja");
const galeriaProdutos = require("./routes/galeria-produtos");
const variacoes = require("./routes/variacoes-automaticas");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const pastaSite = path.resolve(__dirname, "..", "..", "site");
const uploadDir = path.resolve(__dirname, "..", "uploads");
const senhaAdmin = process.env.GF_ADMIN_PASSWORD || "";
const sessionSecret = process.env.SESSION_SECRET || "";

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));
if (sessionSecret.length < 32 || senhaAdmin.length < 12) {
    console.warn("ATENÇÃO: defina SESSION_SECRET (>=32 caracteres) e GF_ADMIN_PASSWORD (>=12 caracteres) no .env.");
}
app.use(session({
    name: "goldfit_admin",
    secret: sessionSecret.length >= 32 ? sessionSecret : "DESENVOLVIMENTO-INSEGURO-ALTERAR-ANTES-DO-USO",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: process.env.COOKIE_SECURE === "true", maxAge: 1000 * 60 * 60 * 4 }
}));

function exigirAdmin(req, res, next) {
    if (req.session?.admin === true) return next();
    return res.status(401).json({ status: "erro", mensagem: "Acesso administrativo necessário. Entre novamente." });
}
function iguais(a, b) {
    const x = Buffer.from(String(a));
    const y = Buffer.from(String(b));
    return x.length === y.length && timingSafeEqual(x, y);
}

app.post("/api/admin/login", (req, res) => {
    const password = String(req.body?.senha || "");
    if (sessionSecret.length < 32) return res.status(503).json({ status: "erro", mensagem: "Configure SESSION_SECRET (>=32 caracteres)." });
    if (senhaAdmin.length < 12) return res.status(503).json({ status: "erro", mensagem: "Configure GF_ADMIN_PASSWORD com 12 ou mais caracteres." });
    if (!iguais(password, senhaAdmin)) return res.status(401).json({ status: "erro", mensagem: "Senha administrativa incorreta." });
    req.session.regenerate(err => {
        if (err) return res.status(500).json({ status: "erro", mensagem: "Não foi possível iniciar a sessão." });
        req.session.admin = true;
        return res.json({ status: "ok", admin: true });
    });
});
app.get("/api/admin/session", (req, res) => res.json({ status: "ok", admin: req.session?.admin === true }));
app.post("/api/admin/logout", exigirAdmin, (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("goldfit_admin");
        res.json({ status: "ok" });
    });
});
app.get("/api/health", async (_req, res) => {
    try {
        const { rows } = await pool.query("SELECT current_database() AS banco, NOW() AS hora");
        res.json({ status: "ok", servico: "Gold Fit Pro", conexao: rows[0] });
    } catch (error) {
        console.error("Banco indisponível:", error.message);
        res.status(503).json({ status: "erro", mensagem: "Banco indisponível. Confira PGHOST, PGPASSWORD e o container postgres." });
    }
});

app.use("/api/loja", loja);
app.use("/api/galeria-produtos", galeriaProdutos);
app.use("/api/modelos-virtuais", exigirAdmin, modelos);
app.use("/api/geracao-imagens", exigirAdmin, geracao);
app.use("/api/geracoes-imagens", exigirAdmin, historico);
app.use("/api/correcoes-imagens", exigirAdmin, correcoes);
app.use("/api/variacoes-automaticas", exigirAdmin, variacoes);
app.use("/arquivos/modelos", exigirAdmin, express.static(path.join(uploadDir, "modelos"), { index: false, dotfiles: "deny" }));
app.use("/arquivos/geradas", exigirAdmin, express.static(path.join(uploadDir, "geradas"), { index: false, dotfiles: "deny" }));
app.use("/arquivos/produtos-ia", exigirAdmin, express.static(path.join(uploadDir, "produtos-ia"), { index: false, dotfiles: "deny" }));
app.use("/arquivos/correcoes-referencias", exigirAdmin, express.static(path.join(uploadDir, "correcoes-referencias"), { index: false, dotfiles: "deny" }));
// Apenas fotos explicitamente aprovadas e vinculadas a produtos sao copiadas aqui.
app.use("/midia/galeria", express.static(path.join(uploadDir, "galeria-loja"), { index: false, dotfiles: "deny" }));
app.use("/midia/produtos", express.static(path.join(uploadDir, "publicadas"), { index: false, dotfiles: "deny" }));

app.get("/admin/acesso.html", (_req, res) => res.redirect("/login.html?modo=admin"));
app.use("/admin", (req, res, next) => {
    if (req.session?.admin === true) return next();
    if (req.accepts("html")) return res.redirect("/login.html?modo=admin&next=" + encodeURIComponent(req.originalUrl));
    return res.status(401).json({ status: "erro", mensagem: "Acesso restrito." });
});
app.use(express.static(pastaSite, { dotfiles: "deny", index: "index.html" }));
app.use((err, _req, res, _next) => {
    console.error("Erro:", err.message);
    res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : (err.status || 500)).json({
        status: "erro",
        mensagem: err.code === "LIMIT_FILE_SIZE" ? "Imagem acima de 10 MB." : (err.status && err.status < 500 ? err.message : "Erro interno do servidor.")
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gold Fit Pro | API e administração: porta ${PORT}`);
    // Lotes interrompidos por reinicio do painel ficam visiveis como incompletos.
    pool.query(`
        UPDATE public.lotes_geracao_ia AS l
        SET status = CASE WHEN EXISTS (
            SELECT 1 FROM public.imagens_geradas_ia AS i
            JOIN public.geracoes_imagens_ia AS g ON g.id = i.geracao_id
            WHERE g.lote_id = l.id
        ) THEN 'parcial' ELSE 'erro' END,
        mensagem_erro = 'Processamento interrompido por reinicio do painel; imagens anteriores foram preservadas.',
        atualizado_em = NOW()
        WHERE status = 'processando'
    `).catch(erro => console.warn("Recuperacao de lotes indisponivel:", erro.message));
    pool.query(`UPDATE public.lotes_variacoes_ia SET status='erro',
        mensagem_erro='Processamento interrompido por reinicio do painel. Os arquivos concluidos foram preservados.',
        atualizado_em=NOW() WHERE status='processando'`)
        .catch(erro => console.warn("Recuperacao V12 indisponivel:", erro.message));
});
