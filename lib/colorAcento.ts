// Color de acento del catálogo público: validación de contraste y paleta
// derivada. Se usa en el servidor (validación y estilos del catálogo) y en
// el panel (vista previa en vivo), así que no depende de nada de Node.

// Fondo del catálogo (--bg en app/globals.css).
export const FONDO_CATALOGO = "#0b0d10";
// Contraste mínimo WCAG AA para texto normal.
export const CONTRASTE_MINIMO = 4.5;
// El ámbar original de Rodado, para "Volver al original".
export const ACENTO_ORIGINAL = "#f0a13c";

const TINTA_OSCURA = "#17130c";
const TINTA_CLARA = "#ffffff";

type RGB = [number, number, number];

export function esHexValido(v: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

export function normalizarHex(v: string): string | null {
  const s = v.trim().toLowerCase();
  const corto = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(s);
  if (corto) return `#${corto[1]}${corto[1]}${corto[2]}${corto[2]}${corto[3]}${corto[3]}`;
  const largo = /^#?([0-9a-f]{6})$/.exec(s);
  return largo ? `#${largo[1]}` : null;
}

function aRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function aHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

function luminancia([r, g, b]: RGB): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contraste(hexA: string, hexB: string): number {
  const a = luminancia(aRgb(hexA));
  const b = luminancia(aRgb(hexB));
  const [claro, oscuro] = a > b ? [a, b] : [b, a];
  return (claro + 0.05) / (oscuro + 0.05);
}

export function contrasteContraFondo(hex: string): number {
  return contraste(hex, FONDO_CATALOGO);
}

export function contrasteSuficiente(hex: string): boolean {
  return contrasteContraFondo(hex) >= CONTRASTE_MINIMO;
}

// Mezcla con blanco (t > 0) o con negro (t < 0).
function mezclar(hex: string, t: number): string {
  const destino = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  return aHex(aRgb(hex).map((c) => c + (destino - c) * k) as RGB);
}

// Texto sobre el acento (botones): negro o blanco, el que contraste más.
export function tintaSobre(hex: string): string {
  return contraste(hex, TINTA_OSCURA) >= contraste(hex, TINTA_CLARA) ? TINTA_OSCURA : TINTA_CLARA;
}

/**
 * Variables CSS que pisan el ámbar del catálogo. Los nombres son los mismos
 * que define app/globals.css, así todo lo que ya usa var(--accent*) toma el
 * color de la agencia sin tocar cada componente.
 */
export function variablesAcento(hex: string): Record<string, string> {
  const tinta = tintaSobre(hex);
  const rgb = aRgb(hex).join(", ");
  const oscuro = mezclar(hex, -0.18);
  return {
    "--accent": hex,
    "--accent-rgb": rgb,
    "--accent-light": mezclar(hex, 0.3),
    "--accent-xlight": mezclar(hex, 0.55),
    "--accent-hero-light": mezclar(hex, 0.42),
    "--accent-dark": oscuro,
    "--accent-shadow-rgb": aRgb(mezclar(hex, -0.08)).join(", "),
    "--accent-grad": `linear-gradient(140deg, ${mezclar(hex, 0.12)}, ${mezclar(hex, -0.08)})`,
    "--accent-mark-grad": `linear-gradient(140deg, ${hex}, ${oscuro})`,
    "--accent-ink": tinta,
    "--accent-ink-rgb": aRgb(tinta).join(", "),
  };
}

/** El color que se aplica al catálogo, o null para usar el ámbar original. */
export function acentoVigente(
  colorAcento: string | null,
  plan: { catalogoPersonalizado: boolean }
): string | null {
  if (!plan.catalogoPersonalizado || !colorAcento) return null;
  return esHexValido(colorAcento) && contrasteSuficiente(colorAcento) ? colorAcento : null;
}
