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

// Agrega el país si la dirección no lo trae, para que Google no la ubique
// en otro lado (hay "Av. Rivadavia" en varios países).
function consultaDireccion(direccion: string): string {
  const d = direccion.trim();
  return /argentina/i.test(d) ? d : `${d}, Argentina`;
}

// Embed sin API key. No es un formato documentado por Google: por eso
// siempre va acompañado del link "Cómo llegar", que sí lo es.
export function urlMapaEmbed(direccion: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(consultaDireccion(direccion))}&output=embed`;
}

// Maps URLs (formato documentado): abre la app o la web con la ruta.
export function urlComoLlegar(direccion: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(consultaDireccion(direccion))}`;
}
