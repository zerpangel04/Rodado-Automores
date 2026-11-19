// Comisiones de vendedores: cálculo con porcentaje y agrupación de
// pendientes para liquidar. Lógica pura (sin Prisma) para poder testearla;
// la usan el modal de venta, la pestaña Comisiones y la API de liquidar.
import { formatearPrecio, type Moneda } from "./moneda";

// Rango aceptado para el % de comisión (agencia o vendedor).
export const COMISION_PCT_MIN = 0;
export const COMISION_PCT_MAX = 20;

export function esPctComisionValido(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= COMISION_PCT_MIN && n <= COMISION_PCT_MAX;
}

// El % del vendedor pisa al de la agencia; si ninguno está cargado, null
// (la comisión se carga a mano, como antes).
export function pctEfectivo(pctVendedor: number | null | undefined, pctAgencia: number | null | undefined): number | null {
  if (pctVendedor !== null && pctVendedor !== undefined && Number.isFinite(pctVendedor)) return pctVendedor;
  if (pctAgencia !== null && pctAgencia !== undefined && Number.isFinite(pctAgencia)) return pctAgencia;
  return null;
}

// Redondeo de una comisión según la moneda: dólares a la unidad, pesos a la
// centena (decenas y centavos no tienen sentido en una comisión en pesos).
export function redondearComision(monto: number, moneda: Moneda): number {
  if (moneda === "ARS") return Math.round(monto / 100) * 100;
  return Math.round(monto);
}

// Comisión sugerida para una venta. null si no hay % o el precio no sirve.
export function calcularComision(precio: number, pct: number | null, moneda: Moneda): number | null {
  if (pct === null || !Number.isFinite(precio) || precio <= 0) return null;
  return redondearComision((precio * pct) / 100, moneda);
}

// Suma de montos con precisión de centavos (las comisiones son Decimal en
// la base; sumar floats a lo bruto puede dejar 1592.9999…).
export function sumarMontos(montos: number[]): number {
  return Math.round(montos.reduce((s, m) => s + Math.round(m * 100), 0)) / 100;
}

export type VentaComision = {
  id: string;
  vendedorId: string;
  vendedorNombre: string;
  moneda: Moneda;
  comision: number;
  fecha: string | Date;
  liquidacionId: string | null;
};

export type GrupoPendiente = {
  vendedorId: string;
  vendedorNombre: string;
  moneda: Moneda;
  total: number;
  cantidad: number;
  ventaIds: string[];
  desde: string; // fecha de la venta pendiente más vieja (ISO)
  hasta: string; // fecha de la más nueva (ISO)
};

// Comisiones pendientes (sin liquidación) agrupadas por vendedor Y moneda:
// dólares y pesos nunca van en el mismo grupo. Ordenado por vendedor y,
// dentro de cada uno, USD antes que pesos.
export function agruparPendientes(ventas: VentaComision[]): GrupoPendiente[] {
  const grupos = new Map<string, { base: Omit<GrupoPendiente, "total" | "desde" | "hasta">; montos: number[]; fechas: number[] }>();
  for (const v of ventas) {
    if (v.liquidacionId) continue;
    const clave = `${v.vendedorId}|${v.moneda}`;
    let g = grupos.get(clave);
    if (!g) {
      g = {
        base: { vendedorId: v.vendedorId, vendedorNombre: v.vendedorNombre, moneda: v.moneda, cantidad: 0, ventaIds: [] },
        montos: [],
        fechas: [],
      };
      grupos.set(clave, g);
    }
    g.base.cantidad += 1;
    g.base.ventaIds.push(v.id);
    g.montos.push(v.comision);
    g.fechas.push(new Date(v.fecha).getTime());
  }
  return Array.from(grupos.values())
    .map(({ base, montos, fechas }) => ({
      ...base,
      total: sumarMontos(montos),
      desde: new Date(Math.min(...fechas)).toISOString(),
      hasta: new Date(Math.max(...fechas)).toISOString(),
    }))
    .sort(
      (a, b) =>
        a.vendedorNombre.localeCompare(b.vendedorNombre, "es") ||
        (a.moneda === b.moneda ? 0 : a.moneda === "USD" ? -1 : 1)
    );
}

// "Hasta el 30/11" incluye todo ese día en hora de Argentina (UTC-3, sin
// horario de verano). Recibe "YYYY-MM-DD".
export function finDelDiaArgentina(fechaYmd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaYmd)) return null;
  const d = new Date(`${fechaYmd}T23:59:59.999-03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function ventas(n: number): string {
  return `${n} venta${n === 1 ? "" : "s"}`;
}

// Textos para el log de actividad (los ve el vendedor en su campanita).
export function textoLiquidacion(vendedor: string, moneda: Moneda, total: number, cantidad: number): string {
  return `Se liquidaron ${formatearPrecio(total, moneda)} de comisiones a ${vendedor} (${ventas(cantidad)})`;
}

export function textoAnulacion(
  vendedor: string,
  moneda: Moneda,
  total: number,
  cantidad: number,
  motivo?: string | null
): string {
  const base = `Se anuló la liquidación de ${formatearPrecio(total, moneda)} a ${vendedor}: ${ventas(cantidad)} vuelve${cantidad === 1 ? "" : "n"} a pendiente`;
  return motivo ? `${base}. Motivo: ${motivo}` : base;
}
