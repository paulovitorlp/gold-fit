"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

const port = 31000 + Math.floor(Math.random() * 2000);
const origin = `http://127.0.0.1:${port}`;
const senha = "senha-de-teste-local-12345";
let processo;

async function esperar() {
    for (let i = 0; i < 60; i++) {
        try { if ((await fetch(origin + "/api/admin/session")).ok) return; } catch (_) { /* servidor inicializando */ }
        await new Promise(r => setTimeout(r, 100));
    }
    throw new Error("Servidor não iniciou durante o teste.");
}

test("rotas de administração e status da geração", async () => {
    processo = spawn(process.execPath, [path.resolve(__dirname, "../src/server.js")], {
        env: {
            ...process.env,
            PORT: String(port),
            GF_ADMIN_PASSWORD: senha,
            SESSION_SECRET: "abcde12345abcde12345abcde12345abcde12345",
            OPENAI_API_KEY: "",
            PGPASSWORD: "falso",
            PGHOST: "127.0.0.1"
        },
        stdio: ["ignore", "pipe", "pipe"]
    });
    try {
        await esperar();
        let r = await fetch(origin + "/api/geracao-imagens/status");
        assert.equal(r.status, 401);
        r = await fetch(origin + "/admin/gerador-imagens.html", { redirect: "manual" });
        assert.equal(r.status, 302);
        r = await fetch(origin + "/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senha })
        });
        assert.equal(r.status, 200);
        const cookie = r.headers.get("set-cookie")?.split(";")[0];
        assert.ok(cookie);
        r = await fetch(origin + "/api/geracao-imagens/status", { headers: { cookie } });
        assert.equal(r.status, 200);
        const body = await r.json();
        assert.equal(body.disponivel, false);
        r = await fetch(origin + "/admin/gerador-imagens.html", { headers: { cookie } });
        assert.equal(r.status, 200);
        assert.match(await r.text(), /Escolha a modelo/);
        r = await fetch(origin + "/api/geracao-imagens", {
            method: "POST", headers: { cookie }
        });
        assert.equal(r.status, 400);
    } finally {
        processo.kill("SIGTERM");
    }
});
