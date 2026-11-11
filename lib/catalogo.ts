// Datos del bloque "Sobre nosotros" del catálogo público, compartidos entre
// el panel (validación y vista previa) y el catálogo.

export const SOBRE_NOSOTROS_MAX = 300;
export const HORARIOS_MAX = 200;
export const ANIO_INICIO_MIN = 1900;

// Se guarda el año de inicio, no los años: así el texto nunca queda viejo.
export function textoAniosEnMercado(anioInicio: number | null, hoy = new Date()): string | null {
  if (anioInicio == null) return null;
  const anios = hoy.getFullYear() - anioInicio;
  if (anios <= 0) return `En el mercado desde ${anioInicio}`;
  return anios === 1 ? "1 año en el mercado" : `${anios} años en el mercado`;
}
