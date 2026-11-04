import Image from "next/image";
import styles from "./landing.module.css";

// Footer de las páginas públicas (landing y legales).
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.wrap} ${styles.footerInner}`}>
        <div className={styles.logoCombo}>
          <Image src="/logo-con-texto.png" alt="Rodado" width={56} height={40} unoptimized />
        </div>
        <div className={styles.tagline}>La plataforma comercial para concesionarias argentinas</div>
        <div className={styles.footerLinks}>
          <a href="/#plataforma">Plataforma</a>
          <a href="/#precios">Precios</a>
          <a href="mailto:soporte@rodado.com.ar">Contacto</a>
          <a href="/politica-privacidad">Privacidad</a>
          <a href="/terminos-servicio">Términos</a>
        </div>
      </div>
    </footer>
  );
}
