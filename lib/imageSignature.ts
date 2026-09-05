// El `type` de un File en un FormData es el Content-Type que declaró el
// cliente al armar el request — no dice nada sobre el contenido real del
// archivo, un cliente hecho a mano (curl, un script) puede mandar
// cualquier byte con el header que quiera. Esto mira los primeros bytes
// del archivo (magic numbers) para confirmar que el contenido es
// realmente una imagen del tipo que dice ser, antes de aceptarlo.
export async function sniffImageMimeType(file: File): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47 &&
    head[4] === 0x0d &&
    head[5] === 0x0a &&
    head[6] === 0x1a &&
    head[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}
