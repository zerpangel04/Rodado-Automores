// Lógica pura del botón flotante arrastrable (Rodi, en el panel y el
// catálogo). Sin DOM, para poder testearla. El componente vive en
// app/Arrastrable.tsx.

// Hasta cuántos píxeles de movimiento se sigue considerando un toque/click
// (abre el chat). Más que esto ya es un arrastre (no abre el chat al soltar).
export const UMBRAL_ARRASTRE_PX = 6;
// Distancia mínima entre el botón y el borde de la pantalla.
export const MARGEN_VIEWPORT_PX = 8;

// Desplazamiento del botón respecto de su posición por defecto (abajo a la
// derecha). Es lo que se aplica como transform y lo que se guarda.
export type Desplazamiento = { x: number; y: number };

// Caja del botón en su posición por defecto (sin desplazamiento), en px de
// viewport, como la devuelve getBoundingClientRect.
export type Caja = { left: number; top: number; right: number; bottom: number };

export function superoUmbral(dx: number, dy: number, umbral: number = UMBRAL_ARRASTRE_PX): boolean {
  return dx * dx + dy * dy > umbral * umbral;
}

function limitar(v: number, min: number, max: number): number {
  // Pantalla más chica que el botón + márgenes: se centra en el rango.
  if (min > max) return (min + max) / 2;
  return Math.min(Math.max(v, min), max);
}

// Desplazamiento corregido para que el botón quede entero dentro del
// viewport, con margen.
export function limitarDesplazamiento(
  d: Desplazamiento,
  caja: Caja,
  anchoViewport: number,
  altoViewport: number,
  margen: number = MARGEN_VIEWPORT_PX
): Desplazamiento {
  // Viewport sin tamaño (pestaña oculta, ventana minimizada, prerender):
  // no hay contra qué encuadrar, se deja como está.
  if (!(anchoViewport > 0) || !(altoViewport > 0)) return d;
  return {
    x: limitar(d.x, margen - caja.left, anchoViewport - margen - caja.right),
    y: limitar(d.y, margen - caja.top, altoViewport - margen - caja.bottom),
  };
}

// Lee lo guardado en localStorage. Cualquier cosa rara (JSON roto, números
// inválidos, formato viejo) cuenta como "nada guardado".
export function leerDesplazamiento(raw: string | null): Desplazamiento | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (typeof v?.x !== "number" || typeof v?.y !== "number") return null;
    if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) return null;
    return { x: v.x, y: v.y };
  } catch {
    return null;
  }
}

export function serializarDesplazamiento(d: Desplazamiento): string {
  return JSON.stringify({ x: Math.round(d.x), y: Math.round(d.y) });
}

export function transformDe(d: Desplazamiento): string {
  return d.x === 0 && d.y === 0 ? "" : `translate3d(${Math.round(d.x)}px, ${Math.round(d.y)}px, 0)`;
}
