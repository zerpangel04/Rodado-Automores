// Expedientes de trámites post-venta (transferencia, etc.). Lógica pura (sin
// Prisma) para poder testearla; la usan la API y la pestaña Ventas → Trámites.
import { corteDormidos, diasSinMovimiento, estaSinMovimiento } from "./leadsDormidos";

// Plantilla por defecto de una venta de usado de agencia a particular en
// Argentina. Es una base: los requisitos cambian por jurisdicción y en el
// tiempo, por eso cada agencia la puede editar (solo el Dueño).
export const PASOS_DEFAULT = [
  "Boleto de compraventa firmado",
  "Pago total recibido",
  "Informe de dominio actualizado",
  "Patentes al día (libre deuda)",
  "Infracciones / multas al día",
  "Verificación policial",
  "Formulario 08 firmado y certificado",
  "Transferencia presentada en el Registro",
  "Título y cédula del comprador recibidos",
  "Entrega del vehículo",
] as const;

export const NOMBRE_PASO_MAX = 80;
export const NOTA_PASO_MAX = 300;
export const PASOS_PLANTILLA_MAX = 30;

export const DIAS_TRABADO_DEFAULT = 10;
export const DIAS_TRABADO_OPCIONES = [5, 7, 10, 14, 21, 30] as const;

export function esDiasTrabadoValido(n: unknown): n is number {
  return typeof n === "number" && (DIAS_TRABADO_OPCIONES as readonly number[]).includes(n);
}

export type PasoPlantilla = { nombre: string; orden: number; activo: boolean };
export type PasoEstado = { hecho: boolean; orden: number; nombre: string };

// Pasos con los que nace un expediente: los activos de la plantilla, en su
// orden, renumerados 1..n (la plantilla puede tener huecos tras desactivar).
export function pasosParaExpediente(plantilla: PasoPlantilla[]): { nombre: string; orden: number }[] {
  return plantilla
    .filter((p) => p.activo)
    .sort((a, b) => a.orden - b.orden)
    .map((p, i) => ({ nombre: p.nombre.trim(), orden: i + 1 }));
}

// Plantilla inicial de una agencia (la primera vez que usa Trámites).
export function plantillaDefault(): PasoPlantilla[] {
  return PASOS_DEFAULT.map((nombre, i) => ({ nombre, orden: i + 1, activo: true }));
}

export function progreso(pasos: { hecho: boolean }[]): { hechos: number; total: number; completo: boolean; pct: number } {
  const total = pasos.length;
  const hechos = pasos.filter((p) => p.hecho).length;
  return { hechos, total, completo: total > 0 && hechos === total, pct: total ? Math.round((hechos / total) * 100) : 0 };
}

// Primer paso pendiente según el orden (null si está todo hecho).
export function proximoPaso<T extends PasoEstado>(pasos: T[]): T | null {
  return [...pasos].sort((a, b) => a.orden - b.orden).find((p) => !p.hecho) ?? null;
}

// Trabado: en curso (no completo) y sin movimiento hace `dias` o más.
export function estaTrabado(
  exp: { completadoEn: Date | string | null; ultimaActividadEn: Date | string },
  dias: number,
  ahora: Date = new Date()
): boolean {
  return estaSinMovimiento(exp.completadoEn === null, exp.ultimaActividadEn, dias, ahora);
}

export { diasSinMovimiento };

// Fecha de corte para contar trabados en la base: ultimaActividadEn <= corte.
export function corteTrabados(dias: number, ahora: Date = new Date()): Date {
  return corteDormidos(dias, ahora);
}

// Tildar pasos: Dueño, Admin y el vendedor de esa venta.
export function puedeEditarPasos(rol: string, userId: string, vendedorIdVenta: string): boolean {
  return rol !== "VENDEDOR" || userId === vendedorIdVenta;
}

// Se puede revertir la venta solo si ningún paso del expediente está hecho
// (si no hay expediente, también).
export function puedeRevertirConExpediente(pasos: { hecho: boolean }[] | null): boolean {
  return !pasos || pasos.every((p) => !p.hecho);
}

// Validación de la plantilla que guarda el Dueño. Devuelve el primer error
// en castellano, o null si está bien.
export function errorPlantilla(pasos: { nombre: string; activo: boolean }[]): string | null {
  if (pasos.length === 0) return "La plantilla tiene que tener al menos un paso";
  if (pasos.length > PASOS_PLANTILLA_MAX) return `La plantilla puede tener hasta ${PASOS_PLANTILLA_MAX} pasos`;
  const vistos = new Set<string>();
  for (const p of pasos) {
    const nombre = p.nombre.trim();
    if (!nombre) return "Hay un paso sin nombre";
    if (nombre.length > NOMBRE_PASO_MAX) return `Cada paso puede tener hasta ${NOMBRE_PASO_MAX} caracteres`;
    const clave = nombre.toLocaleLowerCase("es");
    if (vistos.has(clave)) return `El paso "${nombre}" está repetido`;
    vistos.add(clave);
  }
  if (!pasos.some((p) => p.activo)) return "Tiene que quedar al menos un paso activo";
  return null;
}

// "YYYY-MM-DD" de hoy en hora de Argentina (para precargar la fecha al
// tildar un paso).
export function hoyArgentina(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(ahora);
}

export function esFechaYmd(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
