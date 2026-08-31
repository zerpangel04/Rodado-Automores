import Image from "next/image";
import styles from "./kanban.module.css";
import { Pill, type PillColor } from "../Pill";
import type { Canal } from "./KanbanView";

const canalLabel: Record<Canal, string> = {
  WHATSAPP: "WhatsApp",
  MERCADO_LIBRE: "Mercado Libre",
  INSTAGRAM: "Instagram",
  WEB: "Web",
  WEB_IA: "Asistente IA",
};

const canalColor: Record<Canal, PillColor> = {
  WHATSAPP: "green",
  MERCADO_LIBRE: "amber",
  INSTAGRAM: "purple",
  WEB: "blue",
  WEB_IA: "gray",
};

// Solo los canales que son marcas reales de terceros tienen logo propio —
// "Web" y "Asistente IA" son categorías internas de Rodado, sin isotipo.
const canalLogo: Partial<Record<Canal, string>> = {
  WHATSAPP: "/logos/whatsapp.svg",
  INSTAGRAM: "/logos/instagram.svg",
  MERCADO_LIBRE: "/logos/mercadolibre.svg",
};

export function ChannelBadge({ canal }: { canal: Canal }) {
  const logo = canalLogo[canal];
  if (logo) {
    return (
      <span className={styles.channelIcon} title={canalLabel[canal]}>
        <Image src={logo} alt={canalLabel[canal]} width={60} height={22} />
      </span>
    );
  }
  return <Pill color={canalColor[canal]}>{canalLabel[canal]}</Pill>;
}
