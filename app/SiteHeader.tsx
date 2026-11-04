import Image from "next/image";
import styles from "./landing.module.css";
import { LandingMobileMenu } from "./LandingMobileMenu";

// Header de las páginas públicas (landing y legales). Los links usan
// "/#seccion" para que funcionen también desde fuera de la landing.
export function SiteHeader() {
  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <a className={styles.logoCombo} href="/">
          <Image src="/logo-con-texto.png" alt="Rodado" width={56} height={40} priority unoptimized />
        </a>
        <div className={styles.navLinks}>
          <a href="/#plataforma">Plataforma</a>
          <a href="/#modulos">Módulos</a>
          <a href="/#movil">Celular</a>
          <a href="/#catalogo">Catálogo</a>
          <a href="/#precios">Precios</a>
        </div>
        <div className={styles.navRight}>
          <a className={styles.loginLink} href="/login">
            Iniciar sesión
          </a>
          <a className={styles.btnGlow} href="/signup">
            Pedí tu demo →
          </a>
          <LandingMobileMenu />
        </div>
      </div>
    </nav>
  );
}
