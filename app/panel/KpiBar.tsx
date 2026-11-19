import styles from "./panel.module.css";
import { Odometro } from "./Odometro";

export function KpiBar({
  color,
  colorEnd,
  label,
  value,
  unit,
  valueExtra,
  trend,
  percent,
}: {
  color: string;
  colorEnd?: string;
  label: string;
  value: string;
  unit?: string;
  // Un segundo monto en otra moneda ("+ $9.500.000"), al lado de la unidad.
  valueExtra?: string | null;
  trend?: { label: string; positive: boolean | "neutral" };
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
        <span className={`${styles.kpiBarValue} mono`}>
          <Odometro value={value} />
        </span>
        {unit && <span className={styles.kpiBarUnit}>{unit}</span>}
        {valueExtra && <span className={`${styles.kpiBarUnit} mono`}>{valueExtra}</span>}
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
      <div className={styles.kpiBarTrack}>
        <div
          className={styles.kpiBarFill}
          style={{ width: `${clamped}%`, background: `linear-gradient(90deg, ${color}, ${colorEnd ?? color})` }}
        />
      </div>
    </div>
  );
}
