"use client";

import { useEffect, useState } from "react";
import styles from "./panel.module.css";

type FxState = {
  oficial: string;
  blue: string;
  live: boolean;
};

export function FxBox() {
  const [fx, setFx] = useState<FxState>({ oficial: "—", blue: "—", live: true });

  useEffect(() => {
    let cancelled = false;

    async function loadFx() {
      try {
        const [ofi, blue] = await Promise.all([
          fetch("https://dolarapi.com/v1/dolares/oficial").then((r) => r.json()),
          fetch("https://dolarapi.com/v1/dolares/blue").then((r) => r.json()),
        ]);
        if (cancelled) return;
        setFx({
          oficial: `$${Math.round(ofi.venta).toLocaleString("es-AR")}`,
          blue: `$${Math.round(blue.venta).toLocaleString("es-AR")}`,
          live: true,
        });
      } catch {
        if (cancelled) return;
        setFx({ oficial: "No disponible", blue: "No disponible", live: false });
      }
    }

    loadFx();
    const interval = setInterval(loadFx, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={styles.fxBox}>
      <div className={styles.fxLabel}>
        <span>Cotización dólar</span>
        <span className={styles.fxLive} style={{ background: fx.live ? "var(--green)" : "var(--red)" }} />
      </div>
      <div className={styles.fxRow}>
        <span>Oficial</span>
        <b>{fx.oficial}</b>
      </div>
      <div className={styles.fxRow}>
        <span>Blue</span>
        <b>{fx.blue}</b>
      </div>
    </div>
  );
}
