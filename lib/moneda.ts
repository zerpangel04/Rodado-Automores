// Moneda del precio de un vehículo (y de una venta): USD o ARS.
//
// Reglas (decididas con el dueño del producto):
// - Cada precio se muestra en la moneda en que se cargó; la otra moneda solo
//   aparece como equivalente aproximado ("≈"), calculado con la cotización
//   que elige la agencia (lib/cotizacion.ts).
// - Los TOTALES que mezclan monedas se muestran separados
//   ("USD 450.000 + $12.000.000"), nunca convertidos a un único número: un
//   total no puede cambiar de un día a otro solo porque se movió la
//   cotización.
// - Para lo que necesita un único valor para comparar (ordenar por precio,
//   el "Desde" de la vitrina) se convierte a USD internamente, sin mostrarlo.

export const MONEDAS = ["USD", "ARS"] as const;
export type Moneda = (typeof MONEDAS)[number];

export function esMoneda(v: unknown): v is Moneda {
  return v === "USD" || v === "ARS";
}

// Interpreta cómo escribe la gente la moneda en una planilla (columna
// "moneda" del CSV). Sin distinguir mayúsculas, acentos, espacios ni puntos.
// null = no se reconoce (quien llama decide: en el CSV es un error de fila).
const ALIAS_MONEDA: Record<string, Moneda> = {
  usd: "USD",
  "u$s": "USD",
  "us$": "USD",
  "u$d": "USD",
  "u$": "USD",
  dolar: "USD",
  dolares: "USD",
  ars: "ARS",
  $: "ARS",
  ar$: "ARS",
  $ars: "ARS",
  peso: "ARS",
  pesos: "ARS",
};

export function monedaDesdeTexto(texto: string): Moneda | null {
  const clave = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[\s.]/g, "");
  return ALIAS_MONEDA[clave] ?? null;
}

export function otraMoneda(m: Moneda): Moneda {
  return m === "USD" ? "ARS" : "USD";
}

// Tope de precio por moneda. Es un techo de "error de tipeo" (un cero de
// más), no de precio real: en USD se mantiene el que ya había; en ARS es
// generoso a propósito porque cualquier techo en pesos queda viejo con la
// inflación. Si algún día queda corto, se sube.
export const PRECIO_MAXIMO: Record<Moneda, number> = {
  USD: 100_000_000,
  ARS: 500_000_000,
};

export function precioDentroDelTope(precio: number, moneda: Moneda): boolean {
  return precio <= PRECIO_MAXIMO[moneda];
}

export function mensajeTopePrecio(moneda: Moneda): string {
  return `El precio no puede superar ${formatearPrecio(PRECIO_MAXIMO[moneda], moneda)}. Revisá que no tenga un cero de más.`;
}

// "USD 28.000" / "$9.500.000" (sin decimales, separador de miles es-AR).
export function formatearPrecio(monto: number, moneda: Moneda): string {
  const n = Math.round(monto).toLocaleString("es-AR");
  return moneda === "USD" ? `USD ${n}` : `$${n}`;
}

// Convierte entre monedas. `cotizacion` = pesos por dólar.
export function convertir(monto: number, de: Moneda, a: Moneda, cotizacion: number): number {
  if (de === a) return monto;
  return de === "USD" ? monto * cotizacion : monto / cotizacion;
}

// Equivalente en la otra moneda, para mostrar como "≈". null si no hay
// cotización (en ese caso no se muestra el equivalente).
export function equivalente(
  monto: number,
  moneda: Moneda,
  cotizacion: number | null | undefined
): { monto: number; moneda: Moneda } | null {
  if (!cotizacion || cotizacion <= 0) return null;
  const a = otraMoneda(moneda);
  return { monto: Math.round(convertir(monto, moneda, a, cotizacion)), moneda: a };
}

// Valor en USD solo para comparar u ordenar (nunca para mostrar un total).
// Sin cotización, un precio en pesos no se puede comparar con uno en
// dólares: devuelve null y quien ordena decide dónde ubicarlo.
export function aUsdParaComparar(
  monto: number,
  moneda: Moneda,
  cotizacion: number | null | undefined
): number | null {
  if (moneda === "USD") return monto;
  if (!cotizacion || cotizacion <= 0) return null;
  return monto / cotizacion;
}

export type TotalesPorMoneda = Record<Moneda, number>;

// Suma montos manteniendo cada moneda por separado.
export function sumarPorMoneda(items: Iterable<{ monto: number; moneda: Moneda }>): TotalesPorMoneda {
  const t: TotalesPorMoneda = { USD: 0, ARS: 0 };
  for (const { monto, moneda } of items) t[moneda] += monto;
  return t;
}

// "USD 450.000 + $12.000.000"; omite la moneda que suma 0. Si las dos son 0,
// "USD 0" (o la moneda indicada).
export function formatearTotales(t: TotalesPorMoneda, siVacio: Moneda = "USD"): string {
  const partes = MONEDAS.filter((m) => t[m] !== 0).map((m) => formatearPrecio(t[m], m));
  return partes.length ? partes.join(" + ") : formatearPrecio(0, siVacio);
}

type ConPrecio = { precio: number; moneda: Moneda };

// Comparador de menor a mayor precio, mezclando monedas vía USD. Sin
// cotización, un precio en pesos no se puede comparar con uno en dólares:
// esos van al final (y entre ellos, por su monto en pesos).
export function compararPrecioAsc(a: ConPrecio, b: ConPrecio, cotizacion: number | null | undefined): number {
  const pa = aUsdParaComparar(a.precio, a.moneda, cotizacion);
  const pb = aUsdParaComparar(b.precio, b.moneda, cotizacion);
  if (pa === null && pb === null) return a.precio - b.precio;
  if (pa === null) return 1;
  if (pb === null) return -1;
  return pa - pb;
}

// El más barato (para el "Desde" de la vitrina), con el mismo criterio que
// compararPrecioAsc. null si la lista está vacía.
export function masBarato<T extends ConPrecio>(items: readonly T[], cotizacion: number | null | undefined): T | null {
  let mejor: T | null = null;
  for (const v of items) if (mejor === null || compararPrecioAsc(v, mejor, cotizacion) < 0) mejor = v;
  return mejor;
}

// Monto abreviado para espacios chicos: "18,5k", "9,5M".
export function formatearCompacto(monto: number): string {
  const [div, sufijo] = monto >= 1_000_000 ? [1_000_000, "M"] : [1000, "k"];
  return `${(monto / div).toFixed(1).replace(".", ",")}${sufijo}`;
}

// Cómo nombrar las monedas de una lista de precios en un texto ("precios
// en dólares", "en pesos", "en dólares y en pesos").
export function textoMonedas(monedas: Iterable<Moneda>): string {
  const s = new Set(monedas);
  if (s.has("USD") && s.has("ARS")) return "en dólares y en pesos";
  return s.has("ARS") ? "en pesos" : "en dólares";
}

// ---------------- Ventas ----------------
//
// Una venta guarda su moneda y la cotización del día en que se registró
// (pesos por dólar). Los TOTALES de ventas se muestran por moneda
// (sumarPorMoneda / formatearTotales). Lo que necesita un único número
// (gráficos, % de comisión liquidada, ticket promedio, ranking) convierte cada venta
// a USD con SU cotización guardada, nunca con la de hoy: así un mes viejo
// no cambia de valor cuando se mueve el dólar.

export type MontoVenta = { monto: number; moneda: Moneda; cotizacion: number | null };

// Suma en USD para comparar o graficar. Una venta en pesos sin cotización
// guardada no se puede convertir: se cuenta aparte en `omitidas`.
export function sumarVentasEnUsd(items: Iterable<MontoVenta>): { usd: number; omitidas: number } {
  let usd = 0;
  let omitidas = 0;
  for (const { monto, moneda, cotizacion } of items) {
    const v = aUsdParaComparar(monto, moneda, cotizacion);
    if (v === null) omitidas++;
    else usd += v;
  }
  return { usd, omitidas };
}

// Partes de un KPI de montos: el número grande y su unidad en la moneda
// principal (USD si hay), y el monto de la otra moneda aparte
// ("+ $9.500.000"), sin convertir ni sumar entre monedas.
export function partesKpi(t: TotalesPorMoneda): { valor: string; unidad: string; extra: string | null } {
  const n = (x: number) => Math.round(x).toLocaleString("es-AR");
  if (t.ARS !== 0 && t.USD === 0) return { valor: n(t.ARS), unidad: "pesos", extra: null };
  return { valor: n(t.USD), unidad: "USD", extra: t.ARS !== 0 ? `+ ${formatearPrecio(t.ARS, "ARS")}` : null };
}

// Precio final del formulario de venta al cambiar la moneda de la venta.
// Si el precio sigue siendo el del auto tal cual se precargó, se convierte
// con la cotización (pesos redondeados a miles, dólares a unidades) para
// que nunca quede, por ejemplo, "27500" leído como $27.500. Si se vuelve a
// la moneda del auto sin haber tocado el valor convertido, vuelve su precio
// original. En cualquier otro caso (el usuario ya lo editó, o no hay
// cotización) el número no se toca.
export function precioAlCambiarMonedaVenta(p: {
  precioActual: string;
  monedaActual: Moneda;
  monedaNueva: Moneda;
  precioAuto: number;
  monedaAuto: Moneda;
  cotizacion: number | null | undefined;
}): string {
  const { precioActual, monedaActual, monedaNueva, precioAuto, monedaAuto, cotizacion } = p;
  if (monedaNueva === monedaActual || !cotizacion || cotizacion <= 0) return precioActual;
  const otra = otraMoneda(monedaAuto);
  const c = convertir(precioAuto, monedaAuto, otra, cotizacion);
  const convertido = String(otra === "ARS" ? Math.round(c / 1000) * 1000 : Math.round(c));
  if (monedaActual === monedaAuto && precioActual === String(precioAuto)) return convertido;
  if (monedaNueva === monedaAuto && precioActual === convertido) return String(precioAuto);
  return precioActual;
}

// Monto por moneda abreviado para tarjetas chicas, con la nota de abajo.
// Solo USD queda como siempre ("1,25k" · "USD del mes"); solo pesos,
// "$9,5M" · "pesos del mes"; con las dos, "1,25k + $9,5M" · "del mes".
export function montoCortoPorMoneda(
  t: TotalesPorMoneda,
  { decimalesUsd = 1, periodo = "del mes" }: { decimalesUsd?: number; periodo?: string } = {}
): { valor: string; nota: string } {
  const usdCorto = `${(t.USD / 1000).toFixed(decimalesUsd).replace(".", ",")}k`;
  if (t.ARS === 0) return { valor: usdCorto, nota: `USD ${periodo}` };
  const arsCorto = `$${formatearCompacto(t.ARS)}`;
  if (t.USD === 0) return { valor: arsCorto, nota: `pesos ${periodo}` };
  return { valor: `${usdCorto} + ${arsCorto}`, nota: periodo };
}

// Precio y moneda tal como los pide la API de Mercado Libre Argentina, que
// acepta clasificados de autos en dólares ("USD") o en pesos ("ARS"): se
// publica en la moneda del vehículo, nunca convertido.
export function precioParaMercadoLibre(precio: number, moneda: Moneda): { price: number; currency_id: Moneda } {
  return { price: precio, currency_id: moneda };
}
