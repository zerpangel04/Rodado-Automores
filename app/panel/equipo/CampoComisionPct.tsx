"use client";

import { useState } from "react";
import styles from "./equipo.module.css";
import { formatearPct, parsearPct } from "@/lib/comisiones";

// Campo "% de comisión" con su botón Guardar. Lo usan la agencia (Equipo,
// arriba) y cada vendedor (su ficha). Vacío = sin % propio.
export function CampoComisionPct({
  endpoint,
  valorInicial,
  placeholder,
  ayuda,
  onGuardado,
}: {
  endpoint: string;
  valorInicial: number | null;
  placeholder: string;
  ayuda: string;
  onGuardado?: (valor: number | null) => void;
}) {
  const aTexto = (n: number | null) => (n === null ? "" : n.toLocaleString("es-AR", { maximumFractionDigits: 2 }));
  const [guardado, setGuardado] = useState<number | null>(valorInicial);
  const [texto, setTexto] = useState(aTexto(valorInicial));
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const leido = parsearPct(texto);
  const cambio = leido !== "invalido" && leido !== guardado;

  async function guardar() {
    if (leido === "invalido") return;
    setEnviando(true);
    setMensaje(null);
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comisionPct: leido }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMensaje({ tipo: "error", texto: data?.error ?? "No se pudo guardar" });
        return;
      }
      setGuardado(data.comisionPct);
      setTexto(aTexto(data.comisionPct));
      setMensaje({ tipo: "ok", texto: data.comisionPct === null ? "Guardado: sin porcentaje" : `Guardado: ${formatearPct(data.comisionPct)}` });
      onGuardado?.(data.comisionPct);
    } catch {
      setMensaje({ tipo: "error", texto: "Error de conexión, intentá de nuevo" });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={styles.pctCampo}>
      <div className={styles.pctFila}>
        <span className={styles.pctInputWrap}>
          <input
            type="text"
            inputMode="decimal"
            className={styles.pctInput}
            value={texto}
            placeholder={placeholder}
            onChange={(e) => {
              setTexto(e.target.value);
              setMensaje(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && cambio) guardar();
            }}
            aria-label="Porcentaje de comisión"
            aria-invalid={leido === "invalido"}
          />
          <span className={styles.pctSufijo}>%</span>
        </span>
        <button type="button" className={styles.pctGuardar} disabled={!cambio || enviando} onClick={guardar}>
          {enviando ? "Guardando…" : "Guardar"}
        </button>
      </div>
      {leido === "invalido" ? (
        <p className={styles.pctError}>Poné un número entre 0 y 20 (podés usar coma: 2,5).</p>
      ) : mensaje ? (
        <p className={mensaje.tipo === "ok" ? styles.pctOk : styles.pctError}>{mensaje.texto}</p>
      ) : (
        <p className={styles.pctAyuda}>{ayuda}</p>
      )}
    </div>
  );
}
