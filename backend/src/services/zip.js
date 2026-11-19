"use strict";

/* ZIP valido, sem dependencias npm extras. Arquivos PNG/JPG nao sao comprimidos. */
const tabelaCRC = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
    tabelaCRC[n] = c >>> 0;
}
function crc32(buffer) {
    let crc = 0xFFFFFFFF;
    for (const byte of buffer) crc = tabelaCRC[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
}
function criarZip(arquivos) {
    if (!Array.isArray(arquivos) || arquivos.length > 12) throw new Error("Quantidade de arquivos invalida.");
    const partes = [];
    const central = [];
    let deslocamento = 0;
    for (const arquivo of arquivos) {
        if (!/^[a-zA-Z0-9_.-]{1,120}$/.test(arquivo.nome)) throw new Error("Nome de arquivo invalido.");
        const nome = Buffer.from(arquivo.nome, "utf8");
        const dados = arquivo.dados;
        if (!Buffer.isBuffer(dados)) throw new Error("Conteudo de arquivo invalido.");
        const crc = crc32(dados);
        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034B50, 0);
        local.writeUInt16LE(20, 4);
        local.writeUInt16LE(0x800, 6); // nomes UTF-8
        local.writeUInt16LE(0, 8); // armazenamento sem compressao
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(dados.length, 18);
        local.writeUInt32LE(dados.length, 22);
        local.writeUInt16LE(nome.length, 26);
        partes.push(local, nome, dados);

        const meta = Buffer.alloc(46);
        meta.writeUInt32LE(0x02014B50, 0);
        meta.writeUInt16LE(20, 4);
        meta.writeUInt16LE(20, 6);
        meta.writeUInt16LE(0x800, 8);
        meta.writeUInt32LE(crc, 16);
        meta.writeUInt32LE(dados.length, 20);
        meta.writeUInt32LE(dados.length, 24);
        meta.writeUInt16LE(nome.length, 28);
        meta.writeUInt32LE(deslocamento, 42);
        central.push(meta, nome);
        deslocamento += local.length + nome.length + dados.length;
    }
    const centralSize = central.reduce((s, p) => s + p.length, 0);
    const fim = Buffer.alloc(22);
    fim.writeUInt32LE(0x06054B50, 0);
    fim.writeUInt16LE(arquivos.length, 8);
    fim.writeUInt16LE(arquivos.length, 10);
    fim.writeUInt32LE(centralSize, 12);
    fim.writeUInt32LE(deslocamento, 16);
    return Buffer.concat([...partes, ...central, fim]);
}
module.exports = { criarZip };
