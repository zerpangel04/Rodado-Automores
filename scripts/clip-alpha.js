// Segunda pasada: el fondo negro original tenía un glow/viñeta muy tenue
// (no negro puro), así que el unpremultiply de remove-black-bg.js dejó un
// halo de alpha bajísimo (~2-10%) alrededor del logo — invisible a tamaño
// nativo, pero al escalar mucho hacia abajo (badges chicos, next/image o
// el propio navegador) ese halo ancho y parejo se nota como una caja tenue.
// Este script corta ese alpha residual a 0 y reescala el resto para que el
// borde real del logo siga siendo suave.
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const THRESHOLD = 24; // 0-255

async function clipAlpha(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    const r = data[o], g = data[o + 1], b = data[o + 2], a = data[o + 3];
    const oo = i * 4;
    if (a <= THRESHOLD) {
      out[oo] = 0;
      out[oo + 1] = 0;
      out[oo + 2] = 0;
      out[oo + 3] = 0;
    } else {
      out[oo] = r;
      out[oo + 1] = g;
      out[oo + 2] = b;
      out[oo + 3] = Math.round(((a - THRESHOLD) / (255 - THRESHOLD)) * 255);
    }
  }
  await sharp(out, { raw: { width, height, channels: 4 } }).png().toFile(outputPath);
}

async function main() {
  const targets = ["public/logo-icono.png", "public/logo-con-texto.png"];
  for (const rel of targets) {
    const full = path.join(__dirname, "..", rel);
    const tmp = full + ".tmp.png";
    await clipAlpha(full, tmp);
    fs.renameSync(tmp, full);
    console.log(`${rel}: halo de alpha residual recortado`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
