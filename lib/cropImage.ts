export type CropAreaPixels = { x: number; y: number; width: number; height: number };

// Tope de resolución de salida: una foto sacada con celular recortada a
// pantalla completa fácil sale en 3000-4000px de lado, para un contenedor
// que en el sitio nunca se muestra a más de ~500px de ancho. Sin este tope,
// el archivo que sube y después descarga cada visitante pesa varias veces
// más de lo que necesita para verse nítido.
const MAX_OUTPUT_DIMENSION = 1600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

export async function getCroppedImageFile(
  imageSrc: string,
  area: CropAreaPixels,
  fileName: string
): Promise<File> {
  const image = await loadImage(imageSrc);

  const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(area.width, area.height));
  const outputWidth = Math.round(area.width * scale);
  const outputHeight = Math.round(area.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");

  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo procesar la imagen"));
          return;
        }
        const base = fileName.replace(/\.[^.]+$/, "");
        resolve(new File([blob], `${base}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9
    );
  });
}
