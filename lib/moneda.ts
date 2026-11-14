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

export function otraMoneda(m: Moneda): Moneda {
  return m === "USD" ? "ARS" : "USD";
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
