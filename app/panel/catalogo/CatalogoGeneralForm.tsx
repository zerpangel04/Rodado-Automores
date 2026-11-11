"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import {
  ANIO_INICIO_MIN,
  HORARIOS_MAX,
  SOBRE_NOSOTROS_MAX,
  textoAniosEnMercado,
} from "@/lib/catalogo";
import styles from "./catalogo.module.css";

export type CatalogoGeneralDTO = {
  sobreNosotros: string | null;
  anioInicio: number | null;
  sucursales: { id: string; nombre: string; direccion: string | null; horarios: string | null }[];
};

type FormState = {
  sobreNosotros: string;
  anioInicio: string;
  horarios: Record<string, string>;
};

function aForm(d: CatalogoGeneralDTO): FormState {
  return {
    sobreNosotros: d.sobreNosotros ?? "",
    anioInicio: d.anioInicio != null ? String(d.anioInicio) : "",
    horarios: Object.fromEntries(d.sucursales.map((s) => [s.id, s.horarios ?? ""])),
  };
}

export function CatalogoGeneralForm({ inicial }: { inicial: CatalogoGeneralDTO }) {
  const router = useRouter();
  const [guardado, setGuardado] = useState<FormState>(() => aForm(inicial));
  const [form, setForm] = useState<FormState>(guardado);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

  const anioMax = new Date().getFullYear();
  const anioNum = form.anioInicio.trim() === "" ? null : Number(form.anioInicio);
  const anioValido =
    anioNum === null || (Number.isInteger(anioNum) && anioNum >= ANIO_INICIO_MIN && anioNum <= anioMax);
  const vistaPreviaAnios = anioValido ? textoAniosEnMercado(anioNum) : null;

  const cambiado = useMemo(() => JSON.stringify(form) !== JSON.stringify(guardado), [form, guardado]);

  async function guardar() {
    if (!anioValido) {
      setError(`El año tiene que estar entre ${ANIO_INICIO_MIN} y ${anioMax}`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tenant/catalogo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sobreNosotros: form.sobreNosotros.trim() || null,
          anioInicio: anioNum,
          sucursales: inicial.sucursales.map((s) => ({
            id: s.id,
            horarios: form.horarios[s.id]?.trim() || null,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No se pudieron guardar los cambios");
        return;
      }
      setGuardado(form);
      setToast(true);
      setTimeout(() => setToast(false), 1400);
      router.refresh();
    } catch {
      setError("Error de conexión, intentá de nuevo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.seccion}>
      <div className={styles.seccionHead}>
        <h2 className={styles.seccionTitulo}>Sobre nosotros</h2>
        <p className={styles.seccionDetalle}>
          Se muestra en tu catálogo público, debajo del stock. Si lo dejás vacío, el bloque no aparece.
        </p>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.field}>
        <label htmlFor="sobreNosotros">Presentación de la agencia</label>
        <textarea
          id="sobreNosotros"
          rows={4}
          maxLength={SOBRE_NOSOTROS_MAX}
          value={form.sobreNosotros}
          onChange={(e) => setForm({ ...form, sobreNosotros: e.target.value })}
          placeholder="Somos una agencia familiar de Caballito. Vendemos usados seleccionados con garantía y te ayudamos con la financiación."
        />
        <div className={styles.contador}>
          {form.sobreNosotros.length}/{SOBRE_NOSOTROS_MAX}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="anioInicio">En el mercado desde</label>
        <div className={styles.anioRow}>
          <input
            id="anioInicio"
            className={styles.anioInput}
            inputMode="numeric"
            maxLength={4}
            value={form.anioInicio}
            onChange={(e) => setForm({ ...form, anioInicio: e.target.value.replace(/\D/g, "") })}
            placeholder="2008"
            aria-invalid={!anioValido}
          />
          {vistaPreviaAnios && <span className={styles.anioPreview}>→ “{vistaPreviaAnios}”</span>}
          {!anioValido && form.anioInicio.length === 4 && (
            <span className={styles.anioError}>
              Entre {ANIO_INICIO_MIN} y {anioMax}
            </span>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Locales y horarios</span>
        <p className={styles.fieldAyuda}>Se muestran junto a cada local, al pie del catálogo.</p>
        <div className={styles.locales}>
          {inicial.sucursales.map((s) => (
            <div key={s.id} className={styles.local}>
              <div className={styles.localHead}>
                <MapPin size={13} className={styles.localIcon} />
                <span className={styles.localNombre}>{s.nombre}</span>
                <span className={s.direccion ? styles.localDireccion : styles.localSinDireccion}>
                  {s.direccion ?? "Sin dirección"}
                </span>
                <Link href="/panel/sucursales" className={styles.localEditar}>
                  {s.direccion ? "Editar" : "Cargar dirección"}
                </Link>
              </div>
              <input
                aria-label={`Horarios de ${s.nombre}`}
                maxLength={HORARIOS_MAX}
                value={form.horarios[s.id] ?? ""}
                onChange={(e) =>
                  setForm({ ...form, horarios: { ...form.horarios, [s.id]: e.target.value } })
                }
                placeholder="Lun a vie 9 a 18 · Sáb 9 a 13"
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.acciones}>
        <button
          type="button"
          className={styles.btnGhost}
          onClick={() => {
            setForm(guardado);
            setError(null);
          }}
          disabled={!cambiado || saving}
        >
          Descartar
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={guardar}
          disabled={!cambiado || saving}
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <div className={`${styles.toast} ${toast ? styles.show : ""}`} role="status">
        Guardado ✓
      </div>
    </div>
  );
}
