const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "public", "logo-icono.png");
const APP = path.join(__dirname, "..", "app");

function icoFromPngBuffers(entries) {
  // ICO container holding raw PNG data per entry (modern, widely supported
  // format — no need to re-encode as BMP/DIB).
  const count = entries.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  const imageBuffers = [];
  for (const { size, buffer } of entries) {
    const dir = Buffer.alloc(dirEntrySize);
    dir.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    dir.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 = 256)
    dir.writeUInt8(0, 2); // color palette
    dir.writeUInt8(0, 3); // reserved
    dir.writeUInt16LE(1, 4); // color planes
    dir.writeUInt16LE(32, 6); // bits per pixel
    dir.writeUInt32LE(buffer.length, 8); // size of image data
    dir.writeUInt32LE(offset, 12); // offset of image data
    offset += buffer.length;
    dirEntries.push(dir);
    imageBuffers.push(buffer);
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

async function main() {
  const icon512 = await sharp(SRC).resize(512, 512).ensureAlpha().png().toBuffer();
  fs.writeFileSync(path.join(APP, "icon.png"), icon512);
  console.log("app/icon.png (512x512) generado");

  // apple-icon no debe ser transparente: iOS le rellena el fondo a su
  // manera (a veces negro, inconsistente) si el PNG tiene canal alfa.
  const appleIcon180 = await sharp({
    create: { width: 180, height: 180, channels: 3, background: "#0f1216" },
  })
    .composite([{ input: await sharp(SRC).resize(150, 150).png().toBuffer(), gravity: "center" }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(APP, "apple-icon.png"), appleIcon180);
  console.log("app/apple-icon.png (180x180, fondo sólido) generado");

  const sizes = [16, 32, 48];
  const buffers = [];
  for (const size of sizes) {
    // .ico exige PNGs embebidos en RGBA — la fuente no tiene canal alfa.
    const buffer = await sharp(SRC).resize(size, size).ensureAlpha().png().toBuffer();
    buffers.push({ size, buffer });
  }
  const ico = icoFromPngBuffers(buffers);
  fs.writeFileSync(path.join(APP, "favicon.ico"), ico);
  console.log("app/favicon.ico (16/32/48) generado");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
