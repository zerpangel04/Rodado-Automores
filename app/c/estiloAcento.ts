import type { CSSProperties } from "react";
import { variablesAcento } from "@/lib/colorAcento";

// Variables del color de la agencia, para el style del contenedor de cada
// página pública. El header, el chat y el botón de WhatsApp están adentro,
// así que heredan el color aunque sean position: fixed.
export function estiloAcento(hex: string): CSSProperties {
  return variablesAcento(hex) as CSSProperties;
}
