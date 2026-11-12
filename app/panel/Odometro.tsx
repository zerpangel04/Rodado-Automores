"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./odometro.module.css";

const DIGITOS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
// Cada columna tiene tres vueltas de 0-9 (30 filas). En reposo se muestra la
// vuelta del medio; para el efecto "tragamonedas" se rueda hasta la vuelta de
// abajo o la de arriba y después se vuelve, sin animar, a la del medio.
const PILA = [...DIGITOS, ...DIGITOS, ...DIGITOS];
const FILAS = PILA.length;
const MEDIO = 10;
// Duración de la vuelta en pantallas chicas (tiene que coincidir con el CSS).
const VUELTA_MS = 380;

function aNumero(v: string): number | null {
  const solo = v.replace(/[^\d]/g, "");
  return solo ? Number(solo) : null;
}

type Fase = { tipo: "quieto" } | { tipo: "vuelta"; dir: 1 | -1; anterior: string };

// Número tipo odómetro. Cada dígito es una columna que se desplaza con
// transform (GPU). El HTML del servidor ya trae cada columna en su dígito
// final, así que el número se lee bien desde el primer pintado y sin
// JavaScript; la transición recién se habilita después de montar, de modo
// que solo anima cuando el valor cambia en el cliente (reservar un auto,
// cambiar un filtro). Funciona con cualquier texto ("USD 204.100", "37%"):
// solo los dígitos ruedan, el resto queda fijo.
//
// En pantallas chicas el cambio se marca más: los dígitos que cambian dan
// una vuelta completa y se enciende un destello detrás del número.
//
// Al entrar a una sección (cuando el odómetro se monta) cada dígito da una
// vuelta de "ruleta" que termina en su valor real. Es solo CSS (ver
// odoEntrada en el .module.css), así que corre con el HTML del servidor en
// el primer pintado: arranca mostrando el mismo dígito real (en la vuelta de
// arriba de la pila) y rueda hasta la del medio. Nunca se ve un número falso.
export function Odometro({ value }: { value: string }) {
  const [listo, setListo] = useState(false);
  const [fase, setFase] = useState<Fase>({ tipo: "quieto" });
  const [destellos, setDestellos] = useState(0);
  const previo = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setListo(true));
    return () => {
      cancelAnimationFrame(raf);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Detecta el cambio de valor antes de pintar, para decidir cómo rueda.
  useLayoutEffect(() => {
    const anterior = previo.current;
    if (anterior === value) return;
    previo.current = value;
    if (!listo) return;

    const chico = window.matchMedia("(max-width: 768px)").matches;
    const a = aNumero(anterior);
    const b = aNumero(value);
    if (chico && a !== null && b !== null && a !== b) {
      setFase({ tipo: "vuelta", dir: b > a ? 1 : -1, anterior });
      setDestellos((n) => n + 1);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setFase({ tipo: "quieto" }), VUELTA_MS + 40);
    }
  }, [value, listo]);

  const chars = Array.from(value);
  const charsAnterior = fase.tipo === "vuelta" ? Array.from(fase.anterior) : null;
  let columnaDesdeIzquierda = 0;

  return (
    <span
      className={`${styles.odometro} ${listo ? styles.listo : ""} ${
        fase.tipo === "vuelta" ? styles.enVuelta : ""
      }`}
    >
      {/* Se remonta en cada cambio para reiniciar la animación del destello. */}
      {destellos > 0 && <span key={destellos} className={styles.destello} aria-hidden="true" />}
      {/* El valor real, para lectores de pantalla y para copiar. */}
      <span className={styles.textoReal}>{value}</span>
      <span className={styles.digitos} aria-hidden="true">
        {chars.map((c, i) => {
          // Clave por posición desde la derecha: las unidades siguen siendo
          // la misma columna aunque el número gane o pierda dígitos.
          const desdeDerecha = chars.length - i;
          if (c >= "0" && c <= "9") {
            const d = Number(c);
            let fila = MEDIO + d;
            if (fase.tipo === "vuelta" && charsAnterior) {
              const previoChar = charsAnterior[charsAnterior.length - desdeDerecha];
              // Solo dan la vuelta los dígitos que cambiaron.
              if (previoChar !== c) fila = fase.dir > 0 ? MEDIO + 10 + d : d;
            }
            // --fila: fila de la pila que se muestra (el CSS la convierte en
            // transform). --col: orden de izquierda a derecha, para escalonar
            // la ruleta de entrada.
            const estilo = { "--fila": fila, "--col": columnaDesdeIzquierda++ } as CSSProperties;
            return (
              <span key={`d${desdeDerecha}`} className={styles.columna}>
                <span className={styles.pila} style={estilo}>
                  {PILA.map((p, j) => (
                    <span key={j}>{p}</span>
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
