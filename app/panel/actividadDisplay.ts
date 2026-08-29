// Compartido entre el widget "Actividad reciente" del Panel general y la
// campanita de notificaciones — mismo ícono/color por tipo y mismo cálculo
// de tiempo relativo en los dos lugares donde se muestra un ActividadLog.
export const actividadIcon: Record<string, string> = {
  NUEVO_LEAD: "+",
  CAMBIO_ETAPA_LEAD: "→",
  VENTA_REGISTRADA: "$",
  VEHICULO_VENDIDO: "V",
  VEHICULO_RESERVADO: "R",
};

export const actividadColor: Record<string, string> = {
  NUEVO_LEAD: "var(--cyan)",
  CAMBIO_ETAPA_LEAD: "var(--violet)",
  VENTA_REGISTRADA: "var(--success)",
  VEHICULO_VENDIDO: "var(--ink-soft)",
  VEHICULO_RESERVADO: "var(--warn)",
};

export function formatRelativo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "hace un momento";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `hace ${diffHoras} hora${diffHoras === 1 ? "" : "s"}`;
  const diffDias = Math.floor(diffHoras / 24);
  return `hace ${diffDias} día${diffDias === 1 ? "" : "s"}`;
}
