
const express = require("express");
const path = require("node:path");

const { pool } = require("./db");

const app = express();

const PORT = Number(process.env.PORT || 3000);

// Configurações do servidor
app.disable("x-powered-by");
app.use(express.json());

// =============================================
// ROTA DE TESTE
// =============================================

app.get("/api/health", async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                current_database() AS banco,
                current_setting('port') AS porta,
                NOW() AS data_servidor
        `);

        res.json({
            status: "ok",
            mensagem: "Gold Fit conectado ao PostgreSQL",
            conexao: resultado.rows[0]
        });

    } catch (erro) {
        console.error(
            "Erro de conexão:",
            erro.message
        );

        res.status(500).json({
            status: "erro",
            mensagem: "Não foi possível conectar ao PostgreSQL"
        });
    }
});

// =============================================
// FRONTEND GOLD FIT
// =============================================

const pastaSite = path.join(
    __dirname,
    "..",
    "..",
    "site"
);

app.use(express.static(pastaSite));

app.get("/", (req, res) => {
    res.sendFile(
        path.join(pastaSite, "index.html")
    );
});

// =============================================
// INICIAR SERVIDOR LOCAL
// =============================================

app.listen(PORT, "127.0.0.1", () => {
    console.log("");
    console.log("==================================");
    console.log("       GOLD FIT - BACKEND");
    console.log("==================================");
    console.log(`Servidor: http://127.0.0.1:${PORT}`);
    console.log(`API: http://127.0.0.1:${PORT}/api/health`);
    console.log("==================================");
});
