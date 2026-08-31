import styles from "./panel.module.css";

// Fallback genérico para todas las secciones del panel (Stock, Leads,
// Ventas, Reportes, etc.) mientras su page.tsx resuelve sus queries. No es
// pixel-perfect por pantalla a propósito: el objetivo es que la navegación
// se sienta instantánea (algo aparece ya, en vez de la pantalla anterior
// congelada), no reproducir cada layout exacto.
export default function PanelLoading() {
  return (
    <div className={styles.pageSkeleton}>
      <div className={styles.pageSkeletonTopbar}>
        <div className={styles.skeletonBlock} style={{ width: 160, height: 22, marginBottom: 8 }} />
      </div>
      <div className={styles.pageSkeletonCards}>
        <div className={styles.pageSkeletonCard} />
        <div className={styles.pageSkeletonCard} />
        <div className={styles.pageSkeletonCard} />
        <div className={styles.pageSkeletonCard} />
      </div>
      <div className={styles.pageSkeletonRows}>
        <div className={styles.pageSkeletonRow} />
        <div className={styles.pageSkeletonRow} />
        <div className={styles.pageSkeletonRow} />
        <div className={styles.pageSkeletonRow} />
      </div>
    </div>
  );
}
