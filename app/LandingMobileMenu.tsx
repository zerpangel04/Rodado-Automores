"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LandingMobileMenu.module.css";

// Hamburguesa de la landing en mobile: agrupa los links de navegación
// (que ya se ocultan en la barra a partir de 800px) y "Iniciar sesión"
// (que ahí también deja de tener lugar en la barra) — así un cliente
// existente siempre tiene forma de llegar a /login desde el celular.
export function LandingMobileMenu() {
  const [open, setOpen] = useState(false);
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

  const close = () => setOpen(false);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <>
          <div className={styles.overlay} onClick={close} />
          <nav className={styles.panel}>
            <a href="#plataforma" onClick={close}>
              Plataforma
            </a>
            <a href="#modulos" onClick={close}>
              Módulos
            </a>
            <a href="#movil" onClick={close}>
              Celular
            </a>
            <a href="#catalogo" onClick={close}>
              Catálogo
            </a>
            <a href="#precios" onClick={close}>
              Precios
            </a>
            <div className={styles.divider} />
            <a href="/login" className={styles.loginRow} onClick={close}>
              Iniciar sesión
            </a>
          </nav>
        </>
      )}
    </div>
  );
}
