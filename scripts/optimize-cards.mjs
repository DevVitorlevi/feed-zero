/* eslint-disable no-undef */
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'assets-originais';
const OUT = 'public/cards';
const CARD_WIDTH = 600;
const CHAR_WIDTH = 400;

const MAP = [
  [
    'AMEACA/feedzero-ameaca-algoritmo-recomenda-odio.png',
    'ameaca-algoritmo-recomenda-odio',
    CARD_WIDTH,
  ],
  ['AMEACA/feedzero-ameaca-bot-de-odio.png', 'ameaca-bot-de-odio', CARD_WIDTH],
  [
    'AMEACA/feedzero-ameaca-comentario-ofensivo-em-post-de-vaga.png',
    'ameaca-comentario-ofensivo-vaga',
    CARD_WIDTH,
  ],
  ['AMEACA/feedzero-ameaca-mensagem-privada-com-ameaca.png', 'ameaca-mensagem-privada', CARD_WIDTH],
  [
    'AMEACA/feedzero-ameaca-noticia-falsa-sobre-grupo-racial.png',
    'ameaca-noticia-falsa',
    CARD_WIDTH,
  ],
  ['DILEMA/brincadeira-no-grupo-da-turma.png', 'dilema-brincadeira', CARD_WIDTH],
  ['DILEMA/print-que-expoe-a-vitima.png', 'dilema-print', CARD_WIDTH],
  ['DILEMA/usuario-popular.png', 'dilema-usuario-popular', CARD_WIDTH],
  ['EVENTO/algoritmo-impulsiona-polemica.png', 'evento-polemica', CARD_WIDTH],
  ['EVENTO/campanha-de-conscientizacao.png', 'evento-campanha', CARD_WIDTH],
  ['EVENTO/noticia-viral.png', 'evento-noticia-viral', CARD_WIDTH],
  ['PERSONAGENS/marina-carta.png', 'char-marina', CHAR_WIDTH],
  ['PERSONAGENS/caio-carta.png', 'char-caio', CHAR_WIDTH],
  ['PERSONAGENS/rafa-carta.png', 'char-rafa', CHAR_WIDTH],
  ['PERSONAGENS/helena-carta-HD.png', 'char-helena', CHAR_WIDTH],
  ['RESPOSTA/feedzero-resposta-denunciar.png', 'resp-denunciar', CARD_WIDTH],
  ['RESPOSTA/feedzero-resposta-responder-com-dados.png', 'resp-dados', CARD_WIDTH],
  ['RESPOSTA/feedzero-resposta-acolher-a-vitima.png', 'resp-acolher', CARD_WIDTH],
  ['RESPOSTA/feedzero-resposta-bloquear-perfil.png', 'resp-bloquear', CARD_WIDTH],
  ['RESPOSTA/feedzero-resposta-mobilizar-a-comunidade.png', 'resp-mobilizar', CARD_WIDTH],
  ['RESPOSTA/cancelamento-em-massa.png', 'resp-cancelamento', CARD_WIDTH],
];

await mkdir(OUT, { recursive: true });

const ratios = [];
let failed = 0;

for (const [file, name, width] of MAP) {
  const input = path.join(SRC, file);
  try {
    await stat(input);
    const meta = await sharp(input).metadata();
    const output = path.join(OUT, `${name}.webp`);
    const info = await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(output);
    const ratio = info.width / info.height;
    ratios.push({ name, ratio });

    console.log(
      `ok  ${name}.webp  ${meta.width}x${meta.height} -> ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`,
    );
  } catch (err) {
    failed += 1;

    console.error(`ERRO ${file}: ${err.message}`);
  }
}

if (ratios.length > 0) {
  const sorted = ratios.map((r) => r.ratio).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const odd = ratios.filter((r) => Math.abs(r.ratio - median) / median > 0.01);
  console.log(`\nProporção mediana: ${median.toFixed(4)} (largura/altura)`);
  if (odd.length > 0) {
    console.log('Fora da proporção (conferir):');
    for (const o of odd) console.log(`  ${o.name}: ${o.ratio.toFixed(4)}`);
  } else {
    console.log('Todas as cartas têm a mesma proporção.');
  }
}

if (failed > 0) process.exit(1);
