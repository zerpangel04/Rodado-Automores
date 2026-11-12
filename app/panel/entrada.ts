import type { CSSProperties } from "react";
import styles from "./entrada.module.css";

// Solo las primeras tarjetas entran escalonadas: con 25 ms de desfase y
// 220 ms de duración, la octava termina antes de los 400 ms. El resto
// (normalmente fuera de pantalla) aparece sin animación.
const MAX_ESCALONADAS = 8;

export function entradaEscalonada(indice: number): { className: string; style?: CSSProperties } {
  if (indice >= MAX_ESCALONADAS) return { className: "" };
  return {
    className: styles.entrada,
    style: { "--entrada-i": indice } as CSSProperties,
  };
}
