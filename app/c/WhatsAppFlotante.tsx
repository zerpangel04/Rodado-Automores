import { WhatsAppGlyph } from "../icons/WhatsAppGlyph";
import styles from "./public.module.css";

// Botón fijo abajo a la izquierda: abajo a la derecha está el chat del
// asistente (app/c/ChatWidget.tsx).
export function WhatsAppFlotante({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.waFlotante}
      aria-label="Escribinos por WhatsApp"
      title="Escribinos por WhatsApp"
    >
      <WhatsAppGlyph size={26} />
    </a>
  );
}
