import type { CSSProperties } from "react";
import styles from "./entrada.module.css";

// Solo las primeras tarjetas entran escalonadas: en escritorio, 8 (25 ms de
// desfase y 220 ms de duración: la octava termina antes de los 400 ms); en
// pantallas chicas, 4 (ver entrada.module.css). El resto (normalmente fuera
// de pantalla) aparece sin animación.
const MAX_ESCALONADAS = 8;
const MAX_ESCALONADAS_MOVIL = 4;

export function entradaEscalonada(indice: number): { className: string; style?: CSSProperties } {
  if (indice >= MAX_ESCALONADAS) return { className: "" };
  return {
    className: `${styles.entrada} ${indice >= MAX_ESCALONADAS_MOVIL ? styles.fueraDePantalla : ""}`,
    style: { "--entrada-i": indice } as CSSProperties,
  };
}
