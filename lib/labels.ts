import type { CanalLead, EtapaLead } from "@prisma/client";

// Etiquetas en español compartidas por los puntos server-side que generan
// texto legible (por ahora, sobre todo el log de ActividadLog) — separado
// de las copias locales que ya tienen KanbanView.tsx y panel/page.tsx para
// no tocar ese código existente al agregar este.
export const canalLabelEs: Record<CanalLead, string> = {
  WHATSAPP: "WhatsApp",
  MERCADO_LIBRE: "Mercado Libre",
  INSTAGRAM: "Instagram",
  WEB: "Web",
  WEB_IA: "Asistente IA",
};

export const etapaLabelEs: Record<EtapaLead, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  TEST_DRIVE: "Test drive",
  NEGOCIACION: "Negociación",
  CERRADO: "Cerrado",
};
