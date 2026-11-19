"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode, type PointerEvent, type MouseEvent } from "react";
import styles from "./arrastrable.module.css";
import {
  leerDesplazamiento,
  limitarDesplazamiento,
  serializarDesplazamiento,
  superoUmbral,
  transformDe,
  type Caja,
  type Desplazamiento,
} from "@/lib/arrastre";

// useLayoutEffect solo en el navegador (en el server avisa): así la posición
// guardada se aplica antes del primer pintado, sin "salto" desde la esquina.
const useLayoutEffectCliente = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Después de soltar un arrastre, el navegador todavía puede disparar el
// click (mouse: enseguida; touch: un poco después). Durante esta ventana se
// descarta, para que arrastrar no abra el chat.
const VENTANA_SUPRIMIR_CLICK_MS = 400;

type Arrastre = {
  id: number;
  inicioX: number;
  inicioY: number;
  origen: Desplazamiento;
  caja: Caja;
  anchoViewport: number;
  altoViewport: number;
  movido: boolean;
};

/**
 * Envuelve un botón flotante para que se pueda arrastrar (mouse, touch o
 * lápiz, con Pointer Events) y recuerde dónde lo dejó el usuario.
 *
 * - Un toque/click sin moverse más de UMBRAL_ARRASTRE_PX hace lo de siempre.
 * - Si se arrastró, el click al soltar se descarta.
 * - El botón siempre queda dentro de la pantalla, con margen.
 * - Mientras está apretado, mover/soltar se escucha en window (un arrastre
 *   rápido que se sale del botón no se pierde).
 * - Se mueve solo con `transform` (escrito una vez por frame con rAF); el
 *   layout se lee una sola vez al empezar cada arrastre, nunca por frame.
 * - La posición queda en localStorage (por navegador), bajo `storageKey`.
 */
export function Arrastrable({ storageKey, children }: { storageKey: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef<Desplazamiento>({ x: 0, y: 0 });
  const arrastre = useRef<Arrastre | null>(null);
  const suprimirClickHasta = useRef(0);
  const frame = useRef(0);

  function aplicar(d: Desplazamiento) {
    pos.current = d;
    if (ref.current) ref.current.style.transform = transformDe(d);
  }

  // Caja en la posición por defecto: la actual menos el desplazamiento.
  function cajaPorDefecto(el: HTMLElement): Caja {
    const r = el.getBoundingClientRect();
    const { x, y } = pos.current;
    return { left: r.left - x, top: r.top - y, right: r.right - x, bottom: r.bottom - y };
  }

  useLayoutEffectCliente(() => {
    const el = ref.current;
    if (!el) return;

    let guardado: Desplazamiento | null = null;
    try {
      guardado = leerDesplazamiento(localStorage.getItem(storageKey));
    } catch {
      // localStorage inaccesible (modo privado, bloqueado): posición por defecto.
    }
    if (guardado) {
      aplicar(limitarDesplazamiento(guardado, cajaPorDefecto(el), window.innerWidth, window.innerHeight));
    }

    // Si cambia el tamaño de la pantalla (rotar el celular, achicar la
    // ventana), se vuelve a encuadrar. Una lectura de layout por frame como
    // máximo, y nunca durante un arrastre.
    let pendiente = 0;
    function alRedimensionar() {
      cancelAnimationFrame(pendiente);
      pendiente = requestAnimationFrame(() => {
        const actual = ref.current;
        if (!actual || arrastre.current) return;
        aplicar(limitarDesplazamiento(pos.current, cajaPorDefecto(actual), window.innerWidth, window.innerHeight));
      });
    }
    window.addEventListener("resize", alRedimensionar, { passive: true });
    return () => {
      window.removeEventListener("resize", alRedimensionar);
      cancelAnimationFrame(pendiente);
      cancelAnimationFrame(frame.current);
    };
  }, [storageKey]);

  // Mientras el botón está apretado, el movimiento y el soltar se escuchan
  // en window y no en el botón: si el mouse/dedo se va rápido del botón, el
  // arrastre no se pierde. No se usa setPointerCapture porque haría que un
  // toque simple dispare el click sobre el envoltorio y no sobre el botón.
  const quitarEscuchas = useRef<(() => void) | null>(null);
  useEffect(() => () => quitarEscuchas.current?.(), []);

  function onMover(e: globalThis.PointerEvent) {
    const a = arrastre.current;
    const el = ref.current;
    if (!a || !el || e.pointerId !== a.id) return;
    const dx = e.clientX - a.inicioX;
    const dy = e.clientY - a.inicioY;
    if (!a.movido) {
      if (!superoUmbral(dx, dy)) return;
      a.movido = true;
      el.dataset.arrastrando = "";
    }
    pos.current = limitarDesplazamiento(
      { x: a.origen.x + dx, y: a.origen.y + dy },
      a.caja,
      a.anchoViewport,
      a.altoViewport
    );
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => aplicar(pos.current));
  }

  function onTerminar(e: globalThis.PointerEvent) {
    const a = arrastre.current;
    const el = ref.current;
    if (!a || e.pointerId !== a.id) return;
    arrastre.current = null;
    quitarEscuchas.current?.();
    if (!a.movido || !el) return;
    delete el.dataset.arrastrando;
    cancelAnimationFrame(frame.current);
    aplicar(pos.current);
    suprimirClickHasta.current = performance.now() + VENTANA_SUPRIMIR_CLICK_MS;
    try {
      localStorage.setItem(storageKey, serializarDesplazamiento(pos.current));
    } catch {
      // Sin localStorage: la posición dura hasta recargar.
    }
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = ref.current;
    if (!el) return;
    quitarEscuchas.current?.();
    arrastre.current = {
      id: e.pointerId,
      inicioX: e.clientX,
      inicioY: e.clientY,
      origen: { ...pos.current },
      caja: cajaPorDefecto(el),
      anchoViewport: window.innerWidth,
      altoViewport: window.innerHeight,
      movido: false,
    };
    window.addEventListener("pointermove", onMover, { passive: true });
    window.addEventListener("pointerup", onTerminar);
    window.addEventListener("pointercancel", onTerminar);
    quitarEscuchas.current = () => {
      window.removeEventListener("pointermove", onMover);
      window.removeEventListener("pointerup", onTerminar);
      window.removeEventListener("pointercancel", onTerminar);
      quitarEscuchas.current = null;
    };
  }

  function onClickCapture(e: MouseEvent<HTMLDivElement>) {
    if (performance.now() < suprimirClickHasta.current) {
      e.preventDefault();
      e.stopPropagation();
      suprimirClickHasta.current = 0;
    }
  }

  return (
    <div
      ref={ref}
      className={styles.arrastrable}
      onPointerDown={onPointerDown}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}
