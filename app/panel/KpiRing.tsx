import styles from "./panel.module.css";
import { Odometro } from "./Odometro";

const CIRCUMFERENCE = 126;

// Anillo de KPI. Se dibuja directo con el valor final (sin animar el
// llenado): el dato tiene que verse apenas llega la página, y
// stroke-dashoffset no es una propiedad que acelere la GPU.
export function KpiRing({
  percent,
  color,
  label,
  value,
  featured,
}: {
  percent: number;
  color: string;
  label: string;
  value: string;
  featured?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const targetOffset = CIRCUMFERENCE - (CIRCUMFERENCE * clamped) / 100;

  return (
    <div className={`${styles.kpi} ${featured ? styles.kpiFeatured : ""}`}>
      <div className={styles.ring}>
        <svg width="46" height="46" viewBox="0 0 46 46">
          <circle className={styles.bg} cx="23" cy="23" r="20" />
          <circle
            className={styles.fg}
            cx="23"
            cy="23"
            r="20"
            stroke={color}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={targetOffset}
          />
        </svg>
        <div className={`${styles.ringVal} mono`}>{clamped}%</div>
      </div>
      <div className={styles.kpiInfo}>
        <div className={styles.l}>{label}</div>
        <div className={`${styles.v} disp`}>
          <Odometro value={value} />
        </div>
      </div>
    </div>
  );
}
