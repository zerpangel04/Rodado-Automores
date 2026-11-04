import type { ReactNode } from "react";
import landing from "./landing.module.css";
import styles from "./legal.module.css";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function LegalShell({
  titulo,
  bajada,
  actualizado,
  children,
}: {
  titulo: string;
  bajada: string;
  actualizado: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className={landing.bgLayer}>
        <div className={landing.bgGlow1} />
        <div className={landing.bgGlow2} />
        <div className={landing.bgFade} />
      </div>

      <SiteHeader />

      <main className={styles.main}>
        <header className={styles.head}>
          <h1 className="disp">{titulo}</h1>
          <p className={styles.bajada}>{bajada}</p>
          <p className={styles.actualizado}>Última actualización: {actualizado}</p>
        </header>
        <div className={styles.body}>{children}</div>
      </main>

      <SiteFooter />
    </>
  );
}
