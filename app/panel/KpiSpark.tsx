import styles from "./panel.module.css";

export function KpiSpark({
  color,
  label,
  value,
  unit,
  trend,
  spark,
}: {
  color: string;
  label: string;
  value: string;
  unit?: string;
  trend?: { label: string; positive: boolean | "neutral" };
  spark: number[];
}) {
  const max = Math.max(...spark, 1);
  return (
    <div className={styles.kpiBar}>
      <div
        className={styles.kpiBarHairline}
        style={{ background: `linear-gradient(90deg, ${color}, transparent 65%)` }}
      />
      <div className={styles.kpiBarHead}>
        <span className={styles.kpiBarDot} style={{ background: color, boxShadow: `0 0 7px ${color}` }} />
        <span className={styles.kpiBarLabel}>{label}</span>
      </div>
      <div className={styles.kpiBarValueRow}>
        <span className={`${styles.kpiBarValue} mono`}>{value}</span>
        {unit && <span className={styles.kpiBarUnit}>{unit}</span>}
        {trend && (
          <span
            className={`${styles.kpiBarTrend} ${
              trend.positive === "neutral" ? styles.neutral : trend.positive ? styles.up : styles.down
            }`}
          >
            {trend.label}
          </span>
        )}
      </div>
      <div className={styles.kpiSparkRow}>
        {spark.map((v, i) => (
          <div
            key={i}
            className={styles.kpiSparkBar}
            style={{ height: `${Math.max(12, Math.round((v / max) * 100))}%`, background: color, opacity: 0.5 }}
          />
        ))}
      </div>
    </div>
  );
}
