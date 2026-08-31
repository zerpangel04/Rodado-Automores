import styles from "./panel.module.css";

export function KpiBar({
  color,
  colorEnd,
  label,
  value,
  unit,
  trend,
  percent,
}: {
  color: string;
  colorEnd?: string;
  label: string;
  value: string;
  unit?: string;
  trend?: { label: string; positive: boolean };
  percent: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
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
          <span className={`${styles.kpiBarTrend} ${trend.positive ? styles.up : styles.down}`}>
            {trend.label}
          </span>
        )}
      </div>
      <div className={styles.kpiBarTrack}>
        <div
          className={styles.kpiBarFill}
          style={{ width: `${clamped}%`, background: `linear-gradient(90deg, ${color}, ${colorEnd ?? color})` }}
        />
      </div>
    </div>
  );
}
