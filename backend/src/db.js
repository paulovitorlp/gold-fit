
const path = require("node:path");
const { Pool } = require("pg");

require("dotenv").config({
    path: path.resolve(__dirname, "..", ".env")
});

// Configuração da conexão com PostgreSQL
const pool = new Pool({
    host: process.env.PGHOST || "127.0.0.1",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "goldfit_db",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000
});

// Monitoramento de erros
pool.on("error", (erro) => {
    console.error(
        "Erro na conexão com PostgreSQL:",
        erro.message
    );
});

module.exports = { pool };
