import styles from "../public.module.css";

export default function CatalogoLoading() {
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

      <section className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroInner}`}>
          <div className={styles.skeletonBlock} style={{ width: "60%", maxWidth: 420, height: 40 }} />
          <div className={styles.skeletonBlock} style={{ width: "80%", maxWidth: 560, height: 16 }} />

          <div className={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div className={styles.card} key={i}>
                <div className={styles.cardPhoto}>
                  <div className={styles.skeletonBlock} style={{ position: "absolute", inset: 0, borderRadius: 0 }} />
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.skeletonBlock} style={{ width: "70%", height: 15, marginBottom: 6 }} />
                  <div className={styles.skeletonBlock} style={{ width: "50%", height: 11 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
