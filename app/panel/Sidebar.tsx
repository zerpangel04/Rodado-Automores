"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  HandCoins,
  BarChart3,
  Building2,
  UserCog,
  Plug,
  ChevronDown,
  Check,
  Power,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import styles from "./panel.module.css";
import { FxBox } from "./FxBox";
import { NotificationBell } from "./NotificationBell";

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
  const [mobileOpen, setMobileOpen] = useState(false);
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

  // Cierra el drawer mobile al navegar a otra sección del panel.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
    Icon: LucideIcon,
    label: string,
    badge?: number
  ) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`${styles.navItem} ${active ? styles.active : ""}`}
      >
        <span className={styles.navIcon}>
          <Icon size={14} />
        </span>
        {label}
        {typeof badge === "number" && (
          <span className={styles.navBadge}>{badge}</span>
        )}
      </Link>
    );
  };

  return (
    <>
      <div className={styles.mobileTopbar}>
        <button
          type="button"
          className={styles.hamburger}
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
        <div>
          <div className={styles.mobileTopbarName}>{tenantNombre}</div>
          <div className={styles.mobileTopbarSub}>{subtitle}</div>
        </div>
        <div className={styles.mobileBell}>
          <NotificationBell />
        </div>
      </div>

      <div
        className={`${styles.mobileOverlay} ${mobileOpen ? styles.open : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ""}`}>
      <div className={styles.brandRow}>
        <div className={styles.brandMark}>
          <Image src="/logo-icono.png" alt="" width={26} height={26} aria-hidden="true" unoptimized />
        </div>
        <span className={styles.brandName}>Rodado</span>
      </div>
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
          <div className={`${styles.workspaceChevron} ${open ? styles.open : ""}`}>
            <ChevronDown size={13} />
          </div>
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
              {!selectedSucursalId && (
                <span className={styles.workspaceCheck}>
                  <Check size={12} />
                </span>
              )}
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
                {selectedSucursalId === s.id && (
                  <span className={styles.workspaceCheck}>
                    <Check size={12} />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <FxBox />

      <div className={styles.sidebarNav}>
        <div className={styles.navGroup}>
          <span className={styles.navLabel}>Operación</span>
          {navItem("/panel", LayoutDashboard, "Panel general")}
          {navItem("/panel/stock", Package, "Stock", stockCount)}
          {navItem("/panel/leads", Users, "Leads", leadsCount)}
          {navItem("/panel/ventas", HandCoins, "Ventas")}
          {navItem("/panel/reportes", BarChart3, "Reportes")}
        </div>

        {rol === "DUENIO" && (
          <div className={styles.navGroup}>
            <span className={styles.navLabel}>Agencia</span>
            {navItem("/panel/sucursales", Building2, "Sucursales")}
            {navItem("/panel/equipo", UserCog, "Equipo")}
            {navItem("/panel/integraciones", Plug, "Integraciones")}
          </div>
        )}
      </div>

      <div className={styles.sidebarFoot}>
        <div className={styles.avatar}>{initials(userName) || "?"}</div>
        <div>
          <div>{userName}</div>
          <div className={styles.role}>{rol === "DUENIO" ? "Dueño" : rol === "ADMIN" ? "Admin" : "Vendedor"}</div>
        </div>
        <form action={onLogout}>
          <button type="submit" className={styles.logoutBtn} title="Cerrar sesión">
            <Power size={14} />
          </button>
        </form>
      </div>
      </aside>
    </>
  );
}
