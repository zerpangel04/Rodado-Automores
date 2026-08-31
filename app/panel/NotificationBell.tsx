"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import styles from "./panel.module.css";
import { actividadIcon, actividadColor, formatRelativo } from "./actividadDisplay";

type NotifItem = {
  id: string;
  tipo: string;
  descripcion: string;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  async function fetchNotificaciones() {
    setLoading(true);
    try {
      const res = await fetch("/api/notificaciones");
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
        setItems(data.items);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggle() {
    setOpen((wasOpen) => {
      if (!wasOpen) fetchNotificaciones();
      return !wasOpen;
    });
  }

  async function marcarTodasLeidas() {
    setMarking(true);
    try {
      const res = await fetch("/api/notificaciones/marcar-leidas", { method: "POST" });
      if (res.ok) {
        setCount(0);
        setItems([]);
      }
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className={styles.bellWrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.bellBtn}
        onClick={toggle}
        aria-label="Notificaciones"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={17} />
        {count > 0 && <span className={styles.bellBadge}>{count > 9 ? "9+" : count}</span>}
      </button>

      {open && (
        <div className={styles.bellDropdown}>
          <div className={styles.bellDropdownHead}>
            <span>Notificaciones</span>
            {items.length > 0 && (
              <button
                type="button"
                className={styles.bellMarkAll}
                onClick={marcarTodasLeidas}
                disabled={marking}
              >
                {marking ? "Marcando…" : "Marcar todos como leídos"}
              </button>
            )}
          </div>
          <div className={styles.bellList}>
            {loading ? (
              <p className={styles.bellEmpty}>Cargando…</p>
            ) : items.length === 0 ? (
              <p className={styles.bellEmpty}>No hay notificaciones nuevas.</p>
            ) : (
              items.map((a) => {
                const Icon = actividadIcon[a.tipo];
                return (
                  <div key={a.id} className={styles.activityRow}>
                    <span
                      className={styles.activityIcon}
                      style={{ background: actividadColor[a.tipo] ?? "var(--ink-soft)" }}
                    >
                      {Icon ? <Icon size={13} /> : "•"}
                    </span>
                    <span className={styles.activityText}>{a.descripcion}</span>
                    <span className={styles.activityTime}>{formatRelativo(a.createdAt)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
