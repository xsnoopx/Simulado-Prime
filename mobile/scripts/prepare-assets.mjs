// Prepara as artes do app a partir de uma única imagem de origem.
//
// Uso:  node scripts/prepare-assets.mjs [caminho-da-imagem]
//
// Entrada: uma arte quadrada (ideal 1024x1024 ou maior), com ou sem o texto
//          "SIMULADO PRIME" embaixo.
// Saída:   resources/icon.png   1024x1024, só o emblema (texto cortado), para
//                               o ícone do Android (que recorta em círculo)
//          resources/splash.png 2732x2732, arte completa centralizada no fundo
//                               escuro, para a tela de abertura
//
// Depois disso: npx capacitor-assets generate --android

import sharp from 'sharp';
import { existsSync, readdirSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const BG = { r: 11, g: 16, b: 32, alpha: 1 }; // #0b1020
const RES = path.resolve('resources');
const ICON_SIZE = 1024;
const SPLASH_SIZE = 2732;

function findSource() {
  const explicit = process.argv[2];
  if (explicit) {
    if (!existsSync(explicit)) throw new Error(`Arquivo não encontrado: ${explicit}`);
    return explicit;
  }
  const preferred = path.join(RES, 'icon-source.png');
  if (existsSync(preferred)) return preferred;
  const candidates = readdirSync(RES).filter(
    (f) => /\.(png|jpe?g|webp)$/i.test(f) && !/^(icon|splash)(-dark)?\.(png|jpe?g)$/i.test(f)
  );
  if (!candidates.length) {
    throw new Error('Nenhuma imagem em resources/. Salve a arte como resources/icon-source.png');
  }
  return path.join(RES, candidates[0]);
}

// Procura o topo do texto do rodapé: linhas na parte de baixo com muitos pixels
// quase brancos. Se não achar, considera que a arte não tem texto.
async function findTextTop(src, width, height) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const startY = Math.floor(height * 0.7);
  const minWhite = Math.max(8, Math.floor(width * 0.01)); // 1% da largura
  let textTop = height;

  for (let y = height - 1; y >= startY; y--) {
    let white = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * info.width + x) * info.channels;
      if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) white++;
      if (white >= minWhite) break;
    }
    if (white >= minWhite) {
      textTop = y;
    } else if (textTop < height) {
      break; // passou da faixa do texto
    }
  }

  return textTop === height ? height : textTop;
}

async function main() {
  mkdirSync(RES, { recursive: true });
  const src = findSource();
  const meta = await sharp(src).metadata();
  const w = meta.width;
  const h = meta.height;
  console.log(`origem: ${path.basename(src)} (${w}x${h})`);

  const textTop = await findTextTop(src, w, h);
  const artHeight = textTop < h ? textTop - Math.round(h * 0.01) : h;
  console.log(textTop < h ? `texto detectado a partir de y=${textTop}, será cortado` : 'sem texto no rodapé');

  // Fundo: a própria arte esticada e desfocada. Assim a moldura emenda com o
  // gradiente da imagem, em vez de virar um retângulo de cor sólida.
  // Usa só a parte de cima (sem o texto): o texto é branco e, desfocado,
  // viraria uma faixa clara na borda do ícone.
  async function blurredBackdrop(size, brightness) {
    return sharp(src)
      .extract({ left: 0, top: 0, width: w, height: Math.min(artHeight, h) })
      .resize(size, size, { fit: 'cover' })
      .blur(Math.round(size / 24))
      .modulate({ brightness })
      .toBuffer();
  }

  // Ícone: recorte quadrado da parte de cima (o emblema), com uma folga da
  // borda. O Android recorta o ícone em círculo/quadrado arredondado, então o
  // emblema fica menor que o arquivo de propósito.
  const side = Math.min(w, artHeight);
  const emblem = await sharp(src)
    .extract({
      left: Math.round((w - side) / 2),
      top: 0,
      width: side,
      height: side,
    })
    .resize(Math.round(ICON_SIZE * 0.92), Math.round(ICON_SIZE * 0.92))
    .toBuffer();

  await sharp(await blurredBackdrop(ICON_SIZE, 1))
    .composite([{ input: emblem, gravity: 'center' }])
    .png()
    .toFile(path.join(RES, 'icon.png'));

  // Splash: só o emblema (sem o texto do rodapé), centralizado. As bordas
  // recebem um desvanecimento radial para dissolver no fundo; como o emblema
  // fica no centro, o desvanecimento só atinge o fundo vazio.
  const splashLogo = await sharp(src)
    .extract({
      left: Math.round((w - side) / 2),
      top: 0,
      width: side,
      height: side,
    })
    .resize({ width: Math.round(SPLASH_SIZE * 0.62) })
    .png()
    .toBuffer();

  const logoMeta = await sharp(splashLogo).metadata();
  const fadeMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${logoMeta.width}" height="${logoMeta.height}">
       <defs>
         <radialGradient id="g" cx="50%" cy="50%" r="50%">
           <stop offset="60%" stop-color="#fff" stop-opacity="1"/>
           <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
         </radialGradient>
       </defs>
       <rect width="100%" height="100%" fill="url(#g)"/>
     </svg>`
  );

  const splashLogoFaded = await sharp(splashLogo)
    .ensureAlpha()
    .composite([{ input: fadeMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  await sharp(await blurredBackdrop(SPLASH_SIZE, 1))
    .composite([{ input: splashLogoFaded, gravity: 'center' }])
    .png()
    .toFile(path.join(RES, 'splash.png'));

  // Cor do canto da arte, para o fundo do ícone adaptativo combinar.
  const { data: corner } = await sharp(src)
    .extract({ left: 2, top: 2, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const hex = '#' + [corner[0], corner[1], corner[2]].map((v) => v.toString(16).padStart(2, '0')).join('');

  console.log('gerado: resources/icon.png (1024x1024)');
  console.log('gerado: resources/splash.png (2732x2732)');
  console.log(`cor de fundo da arte: ${hex}`);
}

main().catch((err) => {
  console.error('erro:', err.message);
  process.exit(1);
});
