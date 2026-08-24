"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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

type SucursalOption = { id: string; nombre: string };

export function Sidebar({
  tenantNombre,
  userName,
  rol,
  stockCount,
  leadsCount,
  sucursales,
  selectedSucursalId,
  onLogout,
  onSelectSucursal,
}: {
  tenantNombre: string;
  userName: string;
  rol: string;
  stockCount: number;
  leadsCount: number;
  sucursales: SucursalOption[];
  selectedSucursalId: string | null;
  onLogout: () => void;
  onSelectSucursal: (sucursalId: string) => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

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

  const selectedSucursal = sucursales.find((s) => s.id === selectedSucursalId) ?? null;
  const subtitle = selectedSucursal
    ? selectedSucursal.nombre
    : sucursales.length === 1
    ? "1 sucursal"
    : `Todas las sucursales (${sucursales.length})`;

  function choose(id: string) {
    setOpen(false);
    if (id === (selectedSucursalId ?? "")) return;
    startTransition(() => {
      onSelectSucursal(id);
    });
  }

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
      <div className={styles.workspaceWrap} ref={wrapRef}>
        <button
          type="button"
          className={styles.workspace}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <div className={styles.workspaceMark}>{initial(tenantNombre)}</div>
          <div className={styles.workspaceInfo}>
            <div className={styles.workspaceName}>{tenantNombre}</div>
            <div className={styles.workspacePlan}>{subtitle}</div>
          </div>
          <div className={`${styles.workspaceChevron} ${open ? styles.open : ""}`}>▾</div>
        </button>

        {open && (
          <div className={styles.workspaceDropdown} role="listbox">
            <button
              type="button"
              role="option"
              aria-selected={!selectedSucursalId}
              className={`${styles.workspaceOption} ${!selectedSucursalId ? styles.active : ""}`}
              onClick={() => choose("")}
            >
              Todas las sucursales
              {!selectedSucursalId && <span className={styles.workspaceCheck}>✓</span>}
            </button>
            {sucursales.map((s) => (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={selectedSucursalId === s.id}
                className={`${styles.workspaceOption} ${
                  selectedSucursalId === s.id ? styles.active : ""
                }`}
                onClick={() => choose(s.id)}
              >
                {s.nombre}
                {selectedSucursalId === s.id && <span className={styles.workspaceCheck}>✓</span>}
              </button>
            ))}
          </div>
        )}
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
