// "Clientes dormidos": leads abiertos que quedaron sin movimiento.
//
// Un lead está dormido si no está CERRADO y pasaron `diasUmbral` días o más
// desde su último movimiento real (Lead.ultimaActividadEn: creación, cambio
// de etapa, reasignación o contacto registrado). Se calcula al vuelo — no
// hay job — con esta misma función en el Kanban, Pendientes y el asistente,
// para que todos den lo mismo.

export const DIAS_DORMIDO_DEFAULT = 7;
export const DIAS_DORMIDO_OPCIONES = [3, 5, 7, 10, 14, 21, 30] as const;

const MS_DIA = 24 * 60 * 60 * 1000;

export function esDiasDormidoValido(n: unknown): n is number {
  return typeof n === "number" && (DIAS_DORMIDO_OPCIONES as readonly number[]).includes(n);
}

// Días completos desde el último movimiento (nunca negativo).
export function diasSinMovimiento(ultimaActividad: Date | string, ahora: Date = new Date()): number {
  const t = new Date(ultimaActividad).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((ahora.getTime() - t) / MS_DIA));
}

// Regla común "sin movimiento": algo abierto que lleva `diasUmbral` días o
// más sin cambios. La usan los leads dormidos y los expedientes trabados
// (lib/tramites.ts).
export function estaSinMovimiento(
  abierto: boolean,
  ultimaActividad: Date | string,
  diasUmbral: number,
  ahora: Date = new Date()
): boolean {
  if (!abierto) return false;
  return diasSinMovimiento(ultimaActividad, ahora) >= diasUmbral;
}

export function esDormido(
  lead: { etapa: string; ultimaActividadEn: Date | string },
  diasUmbral: number,
  ahora: Date = new Date()
): boolean {
  return estaSinMovimiento(lead.etapa !== "CERRADO", lead.ultimaActividadEn, diasUmbral, ahora);
}

// Fecha de corte para consultar en la base: dormido <=> ultimaActividadEn <= corte.
export function corteDormidos(diasUmbral: number, ahora: Date = new Date()): Date {
  return new Date(ahora.getTime() - diasUmbral * MS_DIA);
}

// "hoy" / "hace 1 día" / "hace 12 días".
export function textoDiasSinMovimiento(dias: number): string {
  if (dias <= 0) return "hoy";
  return `hace ${dias} día${dias === 1 ? "" : "s"}`;
}
