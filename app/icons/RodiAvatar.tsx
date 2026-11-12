import Image from "next/image";
import styles from "./rodi.module.css";

// Ícono de Rodi, el asistente de IA (catálogo público y panel). La imagen
// original (public/assets/asistente-ia.png, 512 px) la optimiza next/image
// al tamaño en que se muestra. Encima: parpadeo y antena (ver
// rodi.module.css), que respetan prefers-reduced-motion.
export function RodiAvatar({ size, className = "" }: { size: number; className?: string }) {
  return (
    <span className={`${styles.rodi} ${className}`} style={{ width: size, height: size }}>
      <Image
        src="/assets/asistente-ia.png"
        alt="Rodi"
        width={size}
        height={size}
        sizes={`${size}px`}
        className={styles.img}
      />
      <span className={`${styles.ojo} ${styles.ojoIzq}`} aria-hidden="true" />
      <span className={`${styles.ojo} ${styles.ojoDer}`} aria-hidden="true" />
      <span className={styles.antena} aria-hidden="true" />
    </span>
  );
}
