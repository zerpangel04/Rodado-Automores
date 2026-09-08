"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Download, Upload, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import styles from "./stock.module.css";
import panelStyles from "../panel.module.css";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

type PreviewFila = {
  numeroFila: number;
  marca: string;
  modelo: string;
  anio: string;
  precioUsd: string;
  sucursalNombre: string | null;
  error: string | null;
  excedeLimite: boolean;
};

type PreviewResumen = {
  total: number;
  validas: number;
  conError: number;
  importables: number;
  omitidosPorLimite: number;
  limiteAlcanzado: boolean;
  errorLimite?: string;
  avisoLimite?: string;
};

type Resultado = {
  creados: number;
  omitidosPorError: number;
  omitidosPorLimite: number;
  limiteAlcanzado: boolean;
  aviso?: string;
};

type Fase = "elegir" | "vistaPrevia" | "resultado";

export function ImportarCsvModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [fase, setFase] = useState<Fase>("elegir");
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
  const [csvTexto, setCsvTexto] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [filas, setFilas] = useState<PreviewFila[]>([]);
  const [resumen, setResumen] = useState<PreviewResumen | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useBodyScrollLock(open);

  function reset() {
    setFase("elegir");
    setArchivoNombre(null);
    setCsvTexto(null);
    setErrorGeneral(null);
    setFilas([]);
    setResumen(null);
    setResultado(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleArchivoSeleccionado(file: File) {
    setErrorGeneral(null);
    setArchivoNombre(file.name);
    const texto = await file.text();
    setCsvTexto(texto);
  }

  async function handleVerVistaPrevia() {
    if (!csvTexto) {
      setErrorGeneral("Elegí un archivo CSV primero");
      return;
    }
    setCargando(true);
    setErrorGeneral(null);
    try {
      const res = await fetch("/api/vehiculos/importar/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvTexto }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorGeneral(data?.error ?? "No se pudo leer el archivo");
        return;
      }
      setFilas(data.filas);
      setResumen(data.resumen);
      setFase("vistaPrevia");
    } catch {
      setErrorGeneral("Error de conexión, intentá de nuevo");
    } finally {
      setCargando(false);
    }
  }

  async function handleConfirmar() {
    if (!csvTexto) return;
    setCargando(true);
    setErrorGeneral(null);
    try {
      const res = await fetch("/api/vehiculos/importar/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvTexto }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorGeneral(data?.error ?? "No se pudo importar el archivo");
        return;
      }
      setResultado(data);
      setFase("resultado");
      onImported();
    } catch {
      setErrorGeneral("Error de conexión, intentá de nuevo");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className={`${styles.modalBg} ${open ? styles.show : ""}`} onClick={handleClose}>
      <div
        className={`${styles.modal} ${styles.modalWide}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="disp">Importar vehículos por CSV</h3>

        {fase === "elegir" && (
          <>
            <div className={styles.avisoBox}>
              La importación crea los vehículos <b>sin fotos</b>. Después de importar, tenés que
              entrar a cada uno y agregarlas manualmente con el editor habitual.
            </div>

            <p className={styles.importHelp}>
              Descargá la plantilla para ver las columnas exactas (marca, modelo, año, km, precio,
              etc.), completala con tu stock y subila acá.
            </p>

            <a href="/api/vehiculos/plantilla" className={styles.btnGhost} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18 }}>
              <Download size={14} />
              Descargar plantilla
            </a>

            <div className={styles.field}>
              <label>Archivo CSV</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleArchivoSeleccionado(file);
                }}
              />
              {archivoNombre && <div className={styles.importFileName}>{archivoNombre}</div>}
            </div>

            {errorGeneral && <div className={styles.errorBox} style={{ marginTop: 14 }}>{errorGeneral}</div>}

            <div className={styles.modalActions}>
              <button className={styles.btnGhost} onClick={handleClose}>
                Cancelar
              </button>
              <button className={styles.btnPrimary} onClick={handleVerVistaPrevia} disabled={!csvTexto || cargando}>
                {cargando ? "Leyendo…" : "Ver vista previa"}
              </button>
            </div>
          </>
        )}

        {fase === "vistaPrevia" && resumen && (
          <>
            <p className={styles.importHelp}>
              {resumen.importables} de {resumen.total} fila{resumen.total === 1 ? "" : "s"} se van
              a importar{resumen.conError > 0 ? ` · ${resumen.conError} con error` : ""}
              {resumen.omitidosPorLimite > 0 ? ` · ${resumen.omitidosPorLimite} fuera del límite de tu plan` : ""}.
            </p>

            {resumen.limiteAlcanzado && (
              <div className={styles.errorBox} style={{ marginBottom: 14 }}>
                {resumen.errorLimite ?? "Alcanzaste el límite de vehículos de tu plan."}{" "}
                {resumen.omitidosPorLimite > 0 && `${resumen.omitidosPorLimite} fila(s) no se van a importar por eso.`}{" "}
                <Link href="/panel/plan" style={{ textDecoration: "underline", fontWeight: 600 }}>
                  Actualizar plan →
                </Link>
              </div>
            )}

            <div className={panelStyles.tableWrap} style={{ maxHeight: 340, overflowY: "auto" }}>
              <table className={panelStyles.table}>
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Vehículo</th>
                    <th>Año</th>
                    <th>Precio USD</th>
                    <th>Sucursal</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.numeroFila}>
                      <td>{f.numeroFila}</td>
                      <td>
                        {f.marca} {f.modelo}
                      </td>
                      <td>{f.anio}</td>
                      <td>{f.precioUsd}</td>
                      <td>{f.sucursalNombre ?? "—"}</td>
                      <td>
                        {f.error ? (
                          <span className={styles.importEstadoError}>
                            <XCircle size={13} /> {f.error}
                          </span>
                        ) : f.excedeLimite ? (
                          <span className={styles.importEstadoLimite}>
                            <AlertTriangle size={13} /> Excede el límite del plan
                          </span>
                        ) : (
                          <span className={styles.importEstadoOk}>
                            <CheckCircle2 size={13} /> Se va a crear
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {errorGeneral && <div className={styles.errorBox} style={{ marginTop: 14 }}>{errorGeneral}</div>}

            <div className={styles.modalActions}>
              <button className={styles.btnGhost} onClick={() => setFase("elegir")}>
                Volver
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleConfirmar}
                disabled={resumen.importables === 0 || cargando}
              >
                {cargando ? (
                  <>
                    <Loader2 size={14} className={panelStyles.spinning} /> Importando…
                  </>
                ) : (
                  `Confirmar importación (${resumen.importables})`
                )}
              </button>
            </div>
          </>
        )}

        {fase === "resultado" && resultado && (
          <>
            <div className={styles.importResultado}>
              <CheckCircle2 size={32} color="var(--success)" />
              <p>
                Se importaron <b>{resultado.creados}</b> vehículo{resultado.creados === 1 ? "" : "s"}.
              </p>
              {resultado.omitidosPorError > 0 && (
                <p className={styles.importHelp}>
                  {resultado.omitidosPorError} fila(s) no se importaron por errores en los datos.
                </p>
              )}
              {resultado.omitidosPorLimite > 0 && (
                <p className={styles.importHelp}>
                  {resultado.omitidosPorLimite} fila(s) no se importaron porque superaban el límite
                  de tu plan.{" "}
                  <Link href="/panel/plan" style={{ textDecoration: "underline", fontWeight: 600 }}>
                    Actualizar plan →
                  </Link>
                </p>
              )}
              <div className={styles.avisoBox} style={{ textAlign: "left" }}>
                Recordá que estos vehículos se crearon <b>sin fotos</b>. Entrá a cada uno desde
                Stock y agregalas manualmente.
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnPrimary} onClick={handleClose}>
                Listo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
