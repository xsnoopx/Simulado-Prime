// Converte as telas de abertura geradas pelo @capacitor/assets de PNG para WebP.
//
// Uso: node scripts/optimize-splash.mjs
//
// O gerador escreve splash.png em ~30 pastas de densidade/orientação. Em PNG
// cada arquivo passa de 1 MB e o APK inteiro ia para ~13 MB (numa casca que só
// carrega uma URL). Em WebP com qualidade 92 a diferença média de pixel é
// 0,7/255 — invisível — e o APK volta para a faixa dos 5 MB.
//
// O Android resolve @drawable/splash pelo nome, então trocar a extensão do
// arquivo não exige mudar o styles.xml.

import sharp from 'sharp';
import { readdirSync, statSync, unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';

const RES = path.resolve('android/app/src/main/res');
const QUALITY = 92;

function splashDirs(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('drawable'))
    .map((e) => path.join(dir, e.name));
}

async function main() {
  if (!existsSync(RES)) {
    throw new Error(`Pasta não encontrada: ${RES} (rode dentro de mobile/)`);
  }

  let converted = 0;
  let saved = 0;

  for (const dir of splashDirs(RES)) {
    const png = path.join(dir, 'splash.png');
    if (!existsSync(png)) continue;

    const webp = path.join(dir, 'splash.webp');
    const before = statSync(png).size;
    await sharp(png).webp({ quality: QUALITY, effort: 6 }).toFile(webp);
    const after = statSync(webp).size;

    unlinkSync(png);
    converted++;
    saved += before - after;
  }

  if (!converted) {
    console.log('nenhum splash.png encontrado (já convertido?)');
    return;
  }

  console.log(`${converted} splashes convertidos para WebP`);
  console.log(`economia: ${(saved / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((err) => {
  console.error('erro:', err.message);
  process.exit(1);
});
