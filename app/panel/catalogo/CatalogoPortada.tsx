"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Upload, Trash2 } from "lucide-react";
import { LogoCropModal } from "../LogoCropModal";
import { PORTADA_ALLOWED_TYPES, PORTADA_ASPECT, PORTADA_MAX_BYTES } from "@/lib/validation";
import styles from "./catalogo.module.css";

// La portada se muestra a todo el ancho del hero: 2000px de lado alcanza
// para pantallas grandes sin que el archivo pese de más.
const PORTADA_MAX_DIMENSION = 2000;

export function CatalogoPortada({ inicial }: { inicial: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [portadaUrl, setPortadaUrl] = useState<string | null>(inicial);
  const [recorte, setRecorte] = useState<{ url: string; file: File } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!PORTADA_ALLOWED_TYPES.includes(file.type as (typeof PORTADA_ALLOWED_TYPES)[number])) {
      setError("Formato no permitido, usá JPG, PNG o WEBP");
      return;
    }
    // El límite real lo pone el archivo ya recortado; esto solo evita
    // abrir en el navegador fotos enormes.
    if (file.size > PORTADA_MAX_BYTES * 4) {
      setError("La imagen es demasiado grande");
      return;
    }
    setRecorte({ url: URL.createObjectURL(file), file });
  }

  function cerrarRecorte() {
    if (recorte) URL.revokeObjectURL(recorte.url);
    setRecorte(null);
  }

  async function subir(file: File) {
    setOcupado(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/tenant/portada", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo subir la portada");
        return;
      }
      setPortadaUrl(data.portadaUrl);
      router.refresh();
    } catch {
      setError("Error de conexión subiendo la portada");
    } finally {
      cerrarRecorte();
      setOcupado(false);
    }
  }

  async function quitar() {
    if (!confirm("¿Quitar la foto de portada del catálogo?")) return;
    setOcupado(true);
    setError(null);
    try {
      const res = await fetch("/api/tenant/portada", { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo quitar la portada");
        return;
      }
      setPortadaUrl(null);
      router.refresh();
    } catch {
      setError("Error de conexión, intentá de nuevo");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className={styles.seccion}>
      <div className={styles.seccionHead}>
        <h2 className={styles.seccionTitulo}>Foto de portada</h2>
        <p className={styles.seccionDetalle}>
          Se muestra de fondo en la parte de arriba del catálogo, con un velo oscuro para que el
          texto se siga leyendo. Usá una foto horizontal del local o de tus autos.
        </p>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.portadaMarco}>
        {portadaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portadaUrl} alt="Portada actual del catálogo" className={styles.portadaImg} />
        ) : (
          <div className={styles.portadaVacia}>
            <ImageIcon size={20} />
            <span>Sin portada</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={PORTADA_ALLOWED_TYPES.join(",")}
        hidden
        onChange={elegirArchivo}
      />
      <div className={styles.acciones}>
        {portadaUrl && (
          <button type="button" className={styles.btnGhost} onClick={quitar} disabled={ocupado}>
            <Trash2 size={13} className={styles.btnIcono} />
            Quitar
          </button>
        )}
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => inputRef.current?.click()}
          disabled={ocupado}
        >
          <Upload size={13} className={styles.btnIcono} />
          {ocupado ? "Subiendo…" : portadaUrl ? "Cambiar imagen" : "Subir imagen"}
        </button>
      </div>

      {recorte && (
        <LogoCropModal
          imageUrl={recorte.url}
          fileName={recorte.file.name}
          aspect={PORTADA_ASPECT}
          titulo="Encuadrá la portada"
          maxDimension={PORTADA_MAX_DIMENSION}
          onCancel={cerrarRecorte}
          onConfirm={subir}
        />
      )}
    </div>
  );
}
