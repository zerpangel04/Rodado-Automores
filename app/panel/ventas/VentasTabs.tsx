"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./ventas.module.css";

// Pestañas de la sección Ventas: el listado de ventas, la liquidación de
// comisiones y el seguimiento de trámites post-venta.
const TABS = [
  { href: "/panel/ventas", label: "Ventas" },
  { href: "/panel/ventas/comisiones", label: "Comisiones" },
  { href: "/panel/ventas/tramites", label: "Trámites" },
];

export function VentasTabs() {
  const pathname = usePathname();
  return (
    <nav className={styles.tabs} aria-label="Secciones de Ventas">
      {TABS.map((t) => {
        const activa = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={activa ? `${styles.tab} ${styles.tabActiva}` : styles.tab}
            aria-current={activa ? "page" : undefined}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
