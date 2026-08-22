import styles from "./public.module.css";
import { ThemeToggle } from "../ThemeToggle";

export function PublicHeader({ nombre }: { nombre: string }) {
  return (
    <header className={styles.header}>
      <div className={`${styles.wrap} ${styles.headerInner}`}>
        <div className={styles.agency}>
          <div className={`${styles.agencyMark} disp`}>{nombre.charAt(0).toUpperCase()}</div>
          <div>
            <div className={`${styles.agencyName} disp`}>{nombre}</div>
            <div className={styles.agencySub}>Catálogo actualizado en vivo</div>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
