"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./panel.module.css";
import { FxBox } from "./FxBox";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export function Sidebar({
  tenantNombre,
  userName,
  rol,
  stockCount,
  leadsCount,
  onLogout,
}: {
  tenantNombre: string;
  userName: string;
  rol: string;
  stockCount: number;
  leadsCount: number;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  const navItem = (
    href: string,
    icon: string,
    label: string,
    badge?: number
  ) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`${styles.navItem} ${active ? styles.active : ""}`}
      >
        <span className={styles.navIcon}>{icon}</span>
        {label}
        {typeof badge === "number" && (
          <span className={styles.navBadge}>{badge}</span>
        )}
      </Link>
    );
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logoMark} />
        <span className="disp">Rodado</span>
      </div>

      <FxBox />

      <div className={styles.navGroup}>
        <span className={styles.navLabel}>Operación</span>
        {navItem("/panel", "P", "Panel general")}
        {navItem("/panel/stock", "S", "Stock", stockCount)}
        {navItem("/panel/leads", "L", "Leads", leadsCount)}
        {navItem("/panel/ventas", "V", "Ventas")}
      </div>

      {rol === "DUENIO" && (
        <div className={styles.navGroup}>
          <span className={styles.navLabel}>Agencia</span>
          {navItem("/panel/equipo", "E", "Equipo")}
        </div>
      )}

      <div className={styles.sidebarFoot}>
        <div className={styles.avatar}>{initials(userName) || "?"}</div>
        <div>
          <div>{tenantNombre}</div>
          <div className={styles.role}>{rol === "DUENIO" ? "Dueño" : rol === "ADMIN" ? "Admin" : "Vendedor"}</div>
        </div>
        <form action={onLogout}>
          <button type="submit" className={styles.logoutBtn} title="Cerrar sesión">
            ⏻
          </button>
        </form>
      </div>
    </aside>
  );
}
