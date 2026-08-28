"use client";

import { useEffect } from "react";

let lockCount = 0;
let savedScrollY = 0;

/**
 * Bloquea el scroll del body mientras `active` es true (p. ej. un modal
 * abierto). `overflow: hidden` solo no alcanza en mobile Safari, que
 * sigue permitiendo el scroll por detrás de un overlay — el body pasa a
 * `position: fixed` en su posición actual, así ningún gesto (touch,
 * wheel, teclado) puede moverlo, y se restaura el scroll exacto al
 * cerrar. Un contador global soporta modales anidados/rápidos sin que
 * uno pise el unlock del otro.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    if (lockCount === 0) {
      savedScrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        window.scrollTo(0, savedScrollY);
      }
    };
  }, [active]);
}
