"use client";

import { useEffect, useRef } from "react";
import styles from "./panel.module.css";

const CIRCUMFERENCE = 126;

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
  const circleRef = useRef<SVGCircleElement>(null);
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const targetOffset = CIRCUMFERENCE - (CIRCUMFERENCE * clamped) / 100;

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    el.style.strokeDashoffset = String(CIRCUMFERENCE);
    const frame = requestAnimationFrame(() => {
      el.style.strokeDashoffset = String(targetOffset);
    });
    return () => cancelAnimationFrame(frame);
  }, [targetOffset]);

  return (
    <div className={`${styles.kpi} ${featured ? styles.kpiFeatured : ""}`}>
      <div className={styles.ring}>
        <svg width="46" height="46" viewBox="0 0 46 46">
          <circle className={styles.bg} cx="23" cy="23" r="20" />
          <circle
            ref={circleRef}
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
        <div className={`${styles.v} disp`}>{value}</div>
      </div>
    </div>
  );
}
