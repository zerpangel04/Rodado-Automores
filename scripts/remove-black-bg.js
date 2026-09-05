// Destrama un logo renderizado sobre fondo negro sólido, recuperando canal
// alfa por distancia de color: como el compuesto final es
// color_final = color_original * alpha (fondo negro = 0), el canal máximo
// de cada píxel ES el alpha (asumiendo que el arte original satura al
// menos un canal donde no es negro puro), y color_original se recupera
// dividiendo por ese alpha ("unpremultiply"). Con esto el negro de fondo
// desaparece del todo y el logo queda con bordes suaves reales, sin caja.
const sharp = require("sharp");
const path = require("path");

async function removeBlackBackground(inputPath, outputPath) {
  const img = sharp(inputPath);
  const { data, info } = await img
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info; // channels = 4 (RGBA) por ensureAlpha

  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const alpha = Math.max(r, g, b);

    const oo = i * 4;
    if (alpha === 0) {
      out[oo] = 0;
      out[oo + 1] = 0;
      out[oo + 2] = 0;
      out[oo + 3] = 0;
    } else {
      // Un-premultiply: recuperar el color original antes del blend con negro.
      out[oo] = Math.min(255, Math.round((r * 255) / alpha));
      out[oo + 1] = Math.min(255, Math.round((g * 255) / alpha));
      out[oo + 2] = Math.min(255, Math.round((b * 255) / alpha));
      out[oo + 3] = alpha;
    }
  }

  await sharp(out, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath);
}

async function main() {
  const targets = [
    ["public/logo-icono.png", "public/logo-icono.png"],
    ["public/logo-con-texto.png", "public/logo-con-texto.png"],
  ];
  for (const [input, output] of targets) {
    const tmp = output + ".tmp.png";
    await removeBlackBackground(path.join(__dirname, "..", input), path.join(__dirname, "..", tmp));
    require("fs").renameSync(path.join(__dirname, "..", tmp), path.join(__dirname, "..", output));
    console.log(`${output}: fondo negro removido, alpha real aplicado`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
