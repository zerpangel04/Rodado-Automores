export type DocsInput = {
  docTitulo: boolean;
  docCedula: boolean;
  docDominio: boolean;
  docLibreDeuda: boolean;
  vtvVencimiento: string | Date | null;
};

export type DocTier = "ok" | "warn" | "expired";

const DIAS_ALERTA_VTV = 30;

export function diasHastaVtv(vtvVencimiento: string | Date | null): number | null {
  if (!vtvVencimiento) return null;
  const vtv = new Date(vtvVencimiento);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  vtv.setHours(0, 0, 0, 0);
  return Math.round((vtv.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export function docStatus(v: DocsInput): { tier: DocTier; label: string } {
  const count = [v.docTitulo, v.docCedula, v.docDominio, v.docLibreDeuda].filter(
    Boolean
  ).length;
  const dias = diasHastaVtv(v.vtvVencimiento);

  if (dias !== null && dias < 0) {
    return { tier: "expired", label: `⚠ VTV vencida hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? "" : "s"}` };
  }
  if (count < 4) {
    return { tier: "expired", label: `Docs ${count}/4 incompletos` };
  }
  if (dias !== null && dias <= DIAS_ALERTA_VTV) {
    return { tier: "warn", label: `VTV vence en ${dias} día${dias === 1 ? "" : "s"}` };
  }
  return { tier: "ok", label: "Documentación completa" };
}
