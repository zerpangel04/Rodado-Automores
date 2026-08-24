"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./panel.module.css";
import { FxBox } from "./FxBox";
import { ThemeToggle } from "../ThemeToggle";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

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
      <div className={styles.workspace}>
        <div className={styles.workspaceMark}>{initial(tenantNombre)}</div>
        <div className={styles.workspaceInfo}>
          <div className={styles.workspaceName}>{tenantNombre}</div>
          <div className={styles.workspacePlan}>1 sucursal</div>
        </div>
        <div className={styles.workspaceChevron}>▾</div>
      </div>

      <div className={styles.themeRow}>
        <ThemeToggle />
      </div>

      <FxBox />

      <div className={styles.navGroup}>
        <span className={styles.navLabel}>Operación</span>
        {navItem("/panel", "P", "Panel general")}
        {navItem("/panel/stock", "S", "Stock", stockCount)}
        {navItem("/panel/leads", "L", "Leads", leadsCount)}
        {navItem("/panel/ventas", "V", "Ventas")}
        {navItem("/panel/reportes", "R", "Reportes")}
      </div>

      {rol === "DUENIO" && (
        <div className={styles.navGroup}>
          <span className={styles.navLabel}>Agencia</span>
          {navItem("/panel/sucursales", "B", "Sucursales")}
          {navItem("/panel/equipo", "E", "Equipo")}
          {navItem("/panel/integraciones", "I", "Integraciones")}
        </div>
      )}

      <div className={styles.sidebarFoot}>
        <div className={styles.avatar}>{initials(userName) || "?"}</div>
        <div>
          <div>{userName}</div>
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
