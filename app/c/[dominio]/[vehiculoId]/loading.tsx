import styles from "../../public.module.css";

export default function VehiculoDetalleLoading() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={`${styles.wrap} ${styles.headerInner}`}>
          <div className={styles.agency}>
            <div className={styles.skeletonBlock} style={{ width: 40, height: 40, borderRadius: 10 }} />
            <div>
              <div className={styles.skeletonBlock} style={{ width: 120, height: 14, marginBottom: 6 }} />
              <div className={styles.skeletonBlock} style={{ width: 90, height: 11 }} />
            </div>
          </div>
        </div>
      </header>

      <div className={`${styles.wrap} ${styles.detail}`}>
        <div className={styles.skeletonBlock} style={{ width: 130, height: 13, marginBottom: 20 }} />

        <div className={styles.detailGrid}>
          <div>
            <div className={styles.galleryMain}>
              <div className={styles.skeletonBlock} style={{ position: "absolute", inset: 0, borderRadius: 0 }} />
            </div>
            <div className={styles.skeletonBlock} style={{ width: "55%", height: 26, margin: "22px 0 10px" }} />
            <div className={styles.skeletonBlock} style={{ width: "35%", height: 14 }} />
          </div>

          <div>
            <div className={styles.sideCard}>
              <div className={styles.skeletonBlock} style={{ width: "60%", height: 30, marginBottom: 14 }} />
              <div className={styles.skeletonBlock} style={{ width: "100%", height: 90, borderRadius: 12 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
