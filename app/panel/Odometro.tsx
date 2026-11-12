"use client";

import { useEffect, useState } from "react";
import styles from "./odometro.module.css";

const DIGITOS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

// Número tipo odómetro: cada dígito es una columna 0-9 que se desplaza con
// transform (GPU). El HTML del servidor ya trae cada columna en su dígito
// final, así que el número se lee bien desde el primer pintado y sin
// JavaScript; la transición recién se habilita después de montar, de modo
// que solo anima cuando el valor cambia en el cliente (reservar un auto,
// cambiar un filtro). Funciona con cualquier texto ("USD 204.100", "37%"):
// solo los dígitos ruedan, el resto queda fijo.
export function Odometro({ value }: { value: string }) {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setListo(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const chars = Array.from(value);
  return (
    <span className={`${styles.odometro} ${listo ? styles.listo : ""}`}>
      {/* El valor real, para lectores de pantalla y para copiar. */}
      <span className={styles.textoReal}>{value}</span>
      <span className={styles.digitos} aria-hidden="true">
        {chars.map((c, i) => {
          // Clave por posición desde la derecha: las unidades siguen siendo
          // la misma columna aunque el número gane o pierda dígitos.
          const desdeDerecha = chars.length - i;
          if (c >= "0" && c <= "9") {
            return (
              <span key={`d${desdeDerecha}`} className={styles.columna}>
                <span
                  className={styles.pila}
                  style={{ transform: `translateY(-${Number(c) * 10}%)` }}
                >
                  {DIGITOS.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </span>
              </span>
            );
          }
          return (
            <span key={`s${desdeDerecha}${c}`} className={styles.simbolo}>
              {c}
            </span>
          );
        })}
      </span>
    </span>
  );
}
