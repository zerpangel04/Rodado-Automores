"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Lock, AlertTriangle } from "lucide-react";
import {
  ACENTO_ORIGINAL,
  CONTRASTE_MINIMO,
  contrasteContraFondo,
  normalizarHex,
  variablesAcento,
} from "@/lib/colorAcento";
import { CatalogoPortada } from "./CatalogoPortada";
import styles from "./catalogo.module.css";

export type CatalogoPersonalizacionDTO = {
  habilitada: boolean;
  colorAcento: string | null;
  portadaUrl: string | null;
};

export function CatalogoPersonalizacion({ inicial }: { inicial: CatalogoPersonalizacionDTO }) {
  if (!inicial.habilitada) {
    return (
      <div className={`${styles.seccion} ${styles.bloqueada}`}>
        <div className={styles.bloqueadaIcono}>
          <Lock size={16} />
        </div>
        <h2 className={styles.seccionTitulo}>Personalizá tu catálogo</h2>
        <p className={styles.seccionDetalle}>
          Con los planes Profesional y Empresa podés elegir el color de tu catálogo para que combine
          con tu marca y sumar una foto de portada. Pronto también vas a poder destacar vehículos.
        </p>
        {(inicial.colorAcento || inicial.portadaUrl) && (
          <p className={styles.seccionDetalle}>
            Lo que ya tenías guardado ({[inicial.colorAcento && `color ${inicial.colorAcento}`, inicial.portadaUrl && "foto de portada"].filter(Boolean).join(" y ")}) se conserva y vuelve a aplicarse si actualizás el plan.
          </p>
        )}
        <Link href="/panel/plan" className={styles.btnPrimary}>
          Actualizar plan →
        </Link>
      </div>
    );
  }
  return (
    <>
      <FormularioColor inicial={inicial.colorAcento} />
      <CatalogoPortada inicial={inicial.portadaUrl} />
    </>
  );
}

function FormularioColor({ inicial }: { inicial: string | null }) {
  const router = useRouter();
  const [guardado, setGuardado] = useState<string | null>(inicial);
  const [texto, setTexto] = useState(inicial ?? ACENTO_ORIGINAL);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

  const hex = normalizarHex(texto);
  const ratio = hex ? contrasteContraFondo(hex) : null;
  const contrasteOk = ratio !== null && ratio >= CONTRASTE_MINIMO;
  // Lo que se va a guardar: null si es el ámbar original.
  const aGuardar = hex && hex !== ACENTO_ORIGINAL ? hex : null;
  const cambiado = aGuardar !== guardado;

  async function guardar(valor: string | null) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tenant/catalogo/personalizacion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colorAcento: valor }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar el color");
        return;
      }
      setGuardado(valor);
      setTexto(valor ?? ACENTO_ORIGINAL);
      setToast(true);
      setTimeout(() => setToast(false), 1400);
      router.refresh();
    } catch {
      setError("Error de conexión, intentá de nuevo");
    } finally {
      setSaving(false);
    }
  }

  // Vista previa con la misma paleta que va a usar el catálogo.
  const vistaPrevia = (hex && contrasteOk ? variablesAcento(hex) : variablesAcento(ACENTO_ORIGINAL)) as CSSProperties;

  return (
    <div className={styles.seccion}>
      <div className={styles.seccionHead}>
        <h2 className={styles.seccionTitulo}>Color de acento</h2>
        <p className={styles.seccionDetalle}>
          Se usa en los botones, precios y detalles de tu catálogo, el detalle de cada vehículo y el
          chat. Tiene que leerse bien sobre el fondo oscuro del catálogo.
        </p>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.colorRow}>
        <input
          type="color"
          className={styles.colorPicker}
          value={hex ?? ACENTO_ORIGINAL}
          onChange={(e) => setTexto(e.target.value)}
          aria-label="Elegir color"
        />
        <div className={styles.field} style={{ marginBottom: 0 }}>
          <input
            className={styles.colorTexto}
            value={texto}
            maxLength={7}
            onChange={(e) => setTexto(e.target.value)}
            aria-label="Código del color"
            aria-invalid={!hex || !contrasteOk}
            spellCheck={false}
          />
        </div>
        {!hex ? (
          <span className={styles.contrasteMal}>
            <AlertTriangle size={13} /> Código inválido (ej. #F0A13C)
          </span>
        ) : contrasteOk ? (
          <span className={styles.contrasteBien}>
            <Check size={13} /> Buen contraste ({ratio!.toFixed(1)}:1)
          </span>
        ) : (
          <span className={styles.contrasteMal}>
            <AlertTriangle size={13} /> Se lee poco ({ratio!.toFixed(1)}:1, mínimo {CONTRASTE_MINIMO}:1).
            Probá uno más claro.
          </span>
        )}
      </div>

      <div className={styles.preview} style={vistaPrevia}>
        <span className={styles.previewEtiqueta}>Vista previa</span>
        <div className={styles.previewFila}>
          <span className={styles.previewTitulo}>
            Las unidades de <span className={styles.previewNombre}>tu agencia</span>
          </span>
        </div>
        <div className={styles.previewFila}>
          <span className={styles.previewPrecio}>USD 27.500</span>
          <span className={styles.previewChip}>18 años en el mercado</span>
          <span className={styles.previewBoton}>Ver detalle</span>
        </div>
      </div>

      <div className={styles.acciones}>
        <button
          type="button"
          className={styles.btnGhost}
          onClick={() => guardar(null)}
          disabled={saving || guardado === null}
          title="Vuelve al ámbar de Rodado"
        >
          Volver al original
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => guardar(aGuardar)}
          disabled={saving || !hex || !contrasteOk || !cambiado}
        >
          {saving ? "Guardando…" : "Guardar color"}
        </button>
      </div>

      <div className={`${styles.toast} ${toast ? styles.show : ""}`} role="status">
        Guardado ✓
      </div>
    </div>
  );
}
