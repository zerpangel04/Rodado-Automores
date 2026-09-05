import Image from "next/image";
import styles from "./panel.module.css";

// Placeholder mostrado mientras SidebarData resuelve sus queries (lista de
// sucursales, contador de stock, contador de leads). Reproduce el mismo
// ancho/fondo que .sidebar y .mobileTopbar para que no haya salto de layout
// cuando el contenido real aparece.
export function SidebarSkeleton() {
  return (
    <>
      <div className={styles.mobileTopbar}>
        <div className={styles.skeletonBlock} style={{ width: 36, height: 36, borderRadius: 9 }} />
        <div style={{ flex: 1 }}>
          <div className={styles.skeletonBlock} style={{ width: "50%", height: 12 }} />
        </div>
      </div>

      <aside className={styles.sidebar}>
        <div className={styles.brandRow}>
          <div className={styles.brandMark}>
            <Image src="/logo-icono.png" alt="" width={26} height={26} aria-hidden="true" unoptimized />
          </div>
          <span className={styles.brandName}>Rodado</span>
        </div>
        <div className={styles.workspaceWrap}>
          <div className={styles.workspace}>
            <div className={styles.skeletonBlock} style={{ width: 30, height: 30, borderRadius: 9 }} />
            <div className={styles.workspaceInfo}>
              <div className={styles.skeletonBlock} style={{ width: "70%", height: 12, marginBottom: 6 }} />
              <div className={styles.skeletonBlock} style={{ width: "50%", height: 10 }} />
            </div>
          </div>
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navLabel}>Operación</span>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.skeletonNavItem} />
          ))}
        </div>
      </aside>
    </>
  );
}
