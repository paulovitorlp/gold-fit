"use strict";
/*
 * GOLD FIT PRO V10 — composicao localizada e PNG sem bibliotecas externas.
 * A API pode regenerar a imagem inteira, mas a composicao final mistura somente
 * a area selecionada com a foto BASE; pixels fora da area permanecem identicos.
 * Suporta PNG nao-entrelaçado 8-bit RGB/RGBA/cinza. Outros formatos falham com
 * mensagem explicita, sem modificar ou apagar nenhuma fotografia.
 */
const zlib = require("node:zlib");
const ASSINATURA = Buffer.from([137,80,78,71,13,10,26,10]);
const LIMITE_PIXELS = 9_000_000;
const LIMITE_ARQUIVO = 35 * 1024 * 1024;
const tabelaCRC = (() => {
    const tabela = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        tabela[n] = c >>> 0;
    }
    return tabela;
})();
function crc32(dados) {
    let crc = 0xffffffff;
    for (const b of dados) crc = tabelaCRC[(crc ^ b) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}
function chunk(tipo, dados) {
    const nome = Buffer.from(tipo, "ascii");
    const cab = Buffer.alloc(4);
    cab.writeUInt32BE(dados.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([nome, dados])));
    return Buffer.concat([cab, nome, dados, crc]);
}
function dimensoesPNG(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 33 || buffer.length > LIMITE_ARQUIVO ||
        !buffer.subarray(0,8).equals(ASSINATURA) || buffer.toString("ascii",12,16) !== "IHDR") {
        throw new Error("A imagem-base nao e um PNG valido.");
    }
    const largura = buffer.readUInt32BE(16);
    const altura = buffer.readUInt32BE(20);
    if (largura < 100 || altura < 100 || largura * altura > LIMITE_PIXELS) {
        throw new Error("As dimensoes do PNG sao invalidas para a edicao localizada.");
    }
    return { largura, altura };
}
function lerPNG(buffer) {
    const { largura, altura } = dimensoesPNG(buffer);
    const profundidade = buffer[24];
    const cor = buffer[25];
    const entrelaca = buffer[28];
    if (profundidade !== 8 || ![0,2,6].includes(cor) || entrelaca !== 0) {
        throw new Error("Esta imagem usa um tipo de PNG nao suportado na correcao localizada (use PNG RGB/RGBA sem entrelacamento).");
    }
    const canais = cor === 6 ? 4 : cor === 2 ? 3 : 1;
    let pos = 8, final = false;
    const blocos = [];
    while (pos + 12 <= buffer.length) {
        const n = buffer.readUInt32BE(pos);
        if (n > LIMITE_ARQUIVO || pos + 12 + n > buffer.length) throw new Error("PNG com bloco invalido.");
        const tipo = buffer.toString("ascii", pos+4, pos+8);
        const dados = buffer.subarray(pos+8, pos+8+n);
        if (tipo === "IDAT") blocos.push(dados);
        if (tipo === "IEND") { final = true; break; }
        pos += 12 + n;
    }
    if (!final || !blocos.length) throw new Error("PNG sem dados completos.");
    const linha = largura * canais;
    const descomprimido = zlib.inflateSync(Buffer.concat(blocos), {
        maxOutputLength: (linha + 1) * altura + 100
    });
    if (descomprimido.length !== (linha+1)*altura) throw new Error("Dimensoes inconsistentes no PNG.");
    const pixels = Buffer.alloc(largura*altura*4);
    let anterior = Buffer.alloc(linha);
    let cursor = 0;
    for (let y = 0; y < altura; y++) {
        const filtro = descomprimido[cursor++];
        const atual = Buffer.allocUnsafe(linha);
        for (let i = 0; i < linha; i++) {
            const dado = descomprimido[cursor++];
            const a = i >= canais ? atual[i-canais] : 0;
            const b = anterior[i];
            const c = i >= canais ? anterior[i-canais] : 0;
            let pred = 0;
            if (filtro === 1) pred = a;
            else if (filtro === 2) pred = b;
            else if (filtro === 3) pred = Math.floor((a+b)/2);
            else if (filtro === 4) {
                const p = a+b-c;
                const pa = Math.abs(p-a), pb = Math.abs(p-b), pc = Math.abs(p-c);
                pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
            } else if (filtro !== 0) throw new Error("Filtro PNG nao suportado.");
            atual[i] = (dado+pred) & 255;
        }
        for (let x = 0; x < largura; x++) {
            const s = x*canais, d = (y*largura+x)*4;
            if (cor === 0) pixels[d] = pixels[d+1] = pixels[d+2] = atual[s];
            else { pixels[d] = atual[s]; pixels[d+1] = atual[s+1]; pixels[d+2] = atual[s+2]; }
            pixels[d+3] = cor === 6 ? atual[s+3] : 255;
        }
        anterior = atual;
    }
    return { largura, altura, pixels };
}
function salvarPNG({ largura, altura, pixels }) {
    const bytesLinha = largura * 4;
    if (!Buffer.isBuffer(pixels) || pixels.length !== largura*altura*4) throw new Error("Pixels inconsistentes.");
    const raw = Buffer.alloc((bytesLinha+1)*altura);
    for (let y=0;y<altura;y++) pixels.copy(raw,y*(bytesLinha+1)+1,y*bytesLinha,(y+1)*bytesLinha);
    const hdr = Buffer.alloc(13);
    hdr.writeUInt32BE(largura,0); hdr.writeUInt32BE(altura,4);
    hdr[8]=8; hdr[9]=6;
    return Buffer.concat([ASSINATURA, chunk("IHDR",hdr), chunk("IDAT",zlib.deflateSync(raw,{level:6})), chunk("IEND",Buffer.alloc(0))]);
}
function normalizarArea(valor, largura, altura) {
    const x=Number(valor?.x),y=Number(valor?.y),w=Number(valor?.w),h=Number(valor?.h);
    if (![x,y,w,h].every(Number.isFinite) || x<0 || y<0 || w<=0 || h<=0 || x+w>1.001 || y+h>1.001 || w*h>0.36 || w<0.015 || h<0.015) {
        throw new Error("Marque uma area menor e bem delimitada sobre o detalhe (ate 36% da foto).");
    }
    const esq = Math.max(0,Math.floor(x*largura));
    const topo = Math.max(0,Math.floor(y*altura));
    const dir = Math.min(largura,Math.ceil((x+w)*largura));
    const baixo = Math.min(altura,Math.ceil((y+h)*altura));
    if (dir-esq<12 || baixo-topo<12) throw new Error("A area selecionada esta pequena demais.");
    return {esq,topo,dir,baixo};
}
function mascaraPNG({largura,altura,area}) {
    const pixels=Buffer.alloc(largura*altura*4,0);
    for (let i=0;i<pixels.length;i+=4) pixels[i+3]=255;
    for (let y=area.topo;y<area.baixo;y++) for(let x=area.esq;x<area.dir;x++) pixels[(y*largura+x)*4+3]=0;
    return salvarPNG({largura,altura,pixels});
}
function composicaoLocalizada(basePNG, resultadoAPI, area) {
    const base = lerPNG(basePNG), gerada = lerPNG(resultadoAPI);
    if (base.largura!==gerada.largura || base.altura!==gerada.altura) throw new Error("A API devolveu uma dimensao diferente da base; versao anterior mantida.");
    const {largura,altura}=base;
    const margem = Math.max(3,Math.min(18,Math.floor(Math.min(area.dir-area.esq,area.baixo-area.topo)*0.08)));
    const mistura = Buffer.from(base.pixels);
    for(let y=area.topo;y<area.baixo;y++) for(let x=area.esq;x<area.dir;x++) {
        const distancia=Math.min(x-area.esq, area.dir-1-x,y-area.topo,area.baixo-1-y);
        const a=Math.max(0,Math.min(1, distancia/margem));
        const indice=(y*largura+x)*4;
        for(let c=0;c<3;c++) mistura[indice+c]=Math.round(base.pixels[indice+c]*(1-a)+gerada.pixels[indice+c]*a);
        // Mantem opacidade original fora da regiao; dentro respeita a foto-base.
        mistura[indice+3]=base.pixels[indice+3];
    }
    return salvarPNG({largura,altura,pixels:mistura});
}
module.exports = { dimensoesPNG, lerPNG, salvarPNG, normalizarArea, mascaraPNG, composicaoLocalizada };
