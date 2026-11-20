"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import styles from "./tramites.module.css";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import {
  DIAS_TRABADO_OPCIONES,
  NOMBRE_PASO_MAX,
  NOTA_PASO_MAX,
  diasSinMovimiento,
  errorPlantilla,
  estaTrabado,
  progreso,
  proximoPaso,
} from "@/lib/tramites";
import { textoDiasSinMovimiento } from "@/lib/leadsDormidos";

export type PasoDTO = {
  id: string;
  nombre: string;
  orden: number;
  hecho: boolean;
  fecha: string | null; // "YYYY-MM-DD"
  nota: string | null;
  completadoPor: string | null;
  completadoEn: string | null;
};

export type ExpedienteDTO = {
  id: string;
  ultimaActividadEn: string;
  completadoEn: string | null;
  pasos: PasoDTO[];
};

export type VentaTramiteDTO = {
  id: string;
  fecha: string;
  vehiculo: string;
  compradorNombre: string | null;
  vendedorNombre: string;
  // Dueño, Admin o el vendedor de esta venta.
  puedeEditar: boolean;
  expediente: ExpedienteDTO | null;
};

type PlantillaPaso = { id?: string; nombre: string; activo: boolean };
type Filtro = "todos" | "curso" | "trabados" | "completos" | "sin";

const ZONA = "America/Argentina/Buenos_Aires";
const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString("es-AR", { timeZone: ZONA });
const fechaYmd = (ymd: string) => {
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
};

// Convierte el expediente que devuelve la API (fechas como Date/ISO) al DTO.
function aDto(e: {
  id: string;
  ultimaActividadEn: string;
  completadoEn: string | null;
  pasos: { id: string; nombre: string; orden: number; hecho: boolean; fecha: string | null; nota: string | null; completadoPor?: { nombre: string } | null; completadoEn: string | null }[];
}): ExpedienteDTO {
  return {
    id: e.id,
    ultimaActividadEn: e.ultimaActividadEn,
    completadoEn: e.completadoEn,
    pasos: e.pasos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      orden: p.orden,
      hecho: p.hecho,
      fecha: p.fecha ? p.fecha.slice(0, 10) : null,
      nota: p.nota,
      completadoPor: p.completadoPor?.nombre ?? null,
      completadoEn: p.completadoEn,
    })),
  };
}

export function TramitesView({
  ventas: ventasIniciales,
  diasTrabado: diasIniciales,
  plantilla,
  ventaAbierta,
  soloTrabados = false,
}: {
  ventas: VentaTramiteDTO[];
  diasTrabado: number;
  // Solo para el Dueño (null para el resto).
  plantilla: PlantillaPaso[] | null;
  ventaAbierta: string | null;
  soloTrabados?: boolean;
}) {
  const [ventas, setVentas] = useState(ventasIniciales);
  useEffect(() => setVentas(ventasIniciales), [ventasIniciales]);
  const [diasTrabado, setDiasTrabado] = useState(diasIniciales);
  const [filtro, setFiltro] = useState<Filtro>(soloTrabados ? "trabados" : "todos");
  const [abiertaId, setAbiertaId] = useState<string | null>(ventaAbierta);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const filas = useMemo(
    () =>
      ventas.map((v) => {
        const e = v.expediente;
        return {
          v,
          prog: e ? progreso(e.pasos) : null,
          proximo: e ? proximoPaso(e.pasos) : null,
          dias: e ? diasSinMovimiento(e.ultimaActividadEn) : null,
          trabado: e ? estaTrabado(e, diasTrabado) : false,
        };
      }),
    [ventas, diasTrabado]
  );

  const cuenta = {
    todos: filas.length,
    curso: filas.filter((f) => f.v.expediente && !f.v.expediente.completadoEn).length,
    trabados: filas.filter((f) => f.trabado).length,
    completos: filas.filter((f) => f.v.expediente?.completadoEn).length,
    sin: filas.filter((f) => !f.v.expediente).length,
  };

  const visibles = filas.filter((f) => {
    if (filtro === "curso") return f.v.expediente && !f.v.expediente.completadoEn;
    if (filtro === "trabados") return f.trabado;
    if (filtro === "completos") return !!f.v.expediente?.completadoEn;
    if (filtro === "sin") return !f.v.expediente;
    return true;
  });

  const abierta = ventas.find((v) => v.id === abiertaId) ?? null;

  function actualizarExpediente(ventaId: string, exp: ExpedienteDTO) {
    setVentas((prev) => prev.map((v) => (v.id === ventaId ? { ...v, expediente: exp } : v)));
  }

  return (
    <div className={styles.wrap}>
      {aviso && (
        <div className={aviso.tipo === "ok" ? styles.avisoOk : styles.avisoError} role="status">
          <span>{aviso.texto}</span>
          <button type="button" onClick={() => setAviso(null)} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}

      {cuenta.trabados > 0 && (
        <div className={styles.alerta}>
          <AlertTriangle size={15} />
          <span>
            {cuenta.trabados} expediente{cuenta.trabados === 1 ? "" : "s"} trabado{cuenta.trabados === 1 ? "" : "s"}: sin
            movimiento hace {diasTrabado} días o más
          </span>
          <button type="button" className={styles.btnPrimary} onClick={() => setFiltro("trabados")}>
            Ver
          </button>
        </div>
      )}

      <div className={styles.filtros}>
        {(
          [
            ["todos", "Todos"],
            ["curso", "En curso"],
            ["trabados", "Trabados"],
            ["completos", "Completos"],
            ["sin", "Sin expediente"],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" className={filtro === k ? styles.filtroActivo : ""} onClick={() => setFiltro(k)}>
            {label} <span className={styles.cuenta}>{cuenta[k]}</span>
          </button>
        ))}
      </div>

      {ventas.length === 0 ? (
        <p className={styles.vacio}>Todavía no hay ventas. El expediente se crea solo al registrar una venta en Stock.</p>
      ) : (
        <div className={styles.tablaCard}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Venta</th>
                <th>Progreso</th>
                <th>Próximo paso</th>
                <th>Último movimiento</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.vacioFila}>
                    Sin expedientes con este filtro
                  </td>
                </tr>
              ) : (
                visibles.map(({ v, prog, proximo, dias, trabado }) => (
                  <tr key={v.id} className={styles.filaClic} onClick={() => setAbiertaId(v.id)}>
                    <td>
                      <span className={styles.celdaMain}>{v.vehiculo}</span>
                      <span className={styles.celdaSub}>
                        {fechaCorta(v.fecha)}
                        {v.compradorNombre ? ` · ${v.compradorNombre}` : ""} · {v.vendedorNombre}
                      </span>
                    </td>
                    <td>
                      {prog ? (
                        <span className={styles.progreso}>
                          <span className={styles.barra}>
                            <span
                              className={prog.completo ? styles.barraCompleta : styles.barraLlena}
                              style={{ width: `${prog.pct}%` }}
                            />
                          </span>
                          <span className="mono">
                            {prog.hechos}/{prog.total}
                          </span>
                        </span>
                      ) : (
                        <span className={styles.celdaSub}>Sin expediente</span>
                      )}
                    </td>
                    <td>
                      {v.expediente?.completadoEn ? (
                        <span className={styles.chipOk}>Completo</span>
                      ) : proximo ? (
                        <span className={styles.celdaMain}>{proximo.nombre}</span>
                      ) : (
                        <span className={styles.celdaSub}>—</span>
                      )}
                    </td>
                    <td>
                      {dias === null ? (
                        <span className={styles.celdaSub}>—</span>
                      ) : trabado ? (
                        <span className={styles.chipTrabado}>Trabado · {dias} d</span>
                      ) : (
                        <span className={styles.celdaSub}>{textoDiasSinMovimiento(dias)}</span>
                      )}
                    </td>
                    <td className={styles.accion}>
                      <span className={styles.linkTexto}>{v.expediente ? "Ver" : "Abrir"}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {plantilla && (
        <PlantillaEditor
          inicial={plantilla}
          diasTrabado={diasTrabado}
          onGuardado={(dias, texto) => {
            setDiasTrabado(dias);
            setAviso({ tipo: "ok", texto });
          }}
          onError={(texto) => setAviso({ tipo: "error", texto })}
        />
      )}

      {abierta && (
        <DetalleExpediente
          venta={abierta}
          diasTrabado={diasTrabado}
          onCerrar={() => setAbiertaId(null)}
          onActualizado={(exp) => actualizarExpediente(abierta.id, exp)}
        />
      )}
    </div>
  );
}

function DetalleExpediente({
  venta,
  diasTrabado,
  onCerrar,
  onActualizado,
}: {
  venta: VentaTramiteDTO;
  diasTrabado: number;
  onCerrar: () => void;
  onActualizado: (exp: ExpedienteDTO) => void;
}) {
  useBodyScrollLock(true);
  const [iniciando, setIniciando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const e = venta.expediente;
  const prog = e ? progreso(e.pasos) : null;
  const trabado = e ? estaTrabado(e, diasTrabado) : false;

  async function iniciar() {
    setIniciando(true);
    setError(null);
    try {
      const res = await fetch("/api/expedientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ventaId: venta.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo iniciar el expediente");
        return;
      }
      onActualizado(aDto(data));
    } catch {
      setError("Error de conexión, intentá de nuevo");
    } finally {
      setIniciando(false);
    }
  }

  return (
    <div className={styles.fondo} onClick={onCerrar}>
      <aside className={styles.panel} onClick={(ev) => ev.stopPropagation()} aria-label={`Trámites de ${venta.vehiculo}`}>
        <div className={styles.panelHead}>
          <div>
            <h3 className="disp">{venta.vehiculo}</h3>
            <div className={styles.celdaSub}>
              Vendido el {fechaCorta(venta.fecha)}
              {venta.compradorNombre ? ` a ${venta.compradorNombre}` : ""} · {venta.vendedorNombre}
            </div>
          </div>
          <button type="button" className={styles.cerrar} onClick={onCerrar} aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        {!e ? (
          <div className={styles.sinExpediente}>
            <p>
              Esta venta es anterior al seguimiento de trámites y no tiene expediente. Si querés llevar el registro de su
              transferencia, inicialo con los pasos de la plantilla de la agencia.
            </p>
            {venta.puedeEditar ? (
              <button type="button" className={styles.btnPrimary} disabled={iniciando} onClick={iniciar}>
                {iniciando ? "Iniciando…" : "Iniciar expediente"}
              </button>
            ) : (
              <p className={styles.celdaSub}>Lo puede iniciar el vendedor de la venta, un admin o el dueño.</p>
            )}
            {error && <p className={styles.errorTexto}>{error}</p>}
          </div>
        ) : (
          <>
            <div className={styles.resumen}>
              {e.completadoEn ? (
                <span className={styles.chipOk}>Completo desde el {fechaCorta(e.completadoEn)}</span>
              ) : (
                <span>
                  {prog!.hechos} de {prog!.total} pasos hechos
                </span>
              )}
              {trabado && <span className={styles.chipTrabado}>Trabado · {diasSinMovimiento(e.ultimaActividadEn)} d</span>}
            </div>
            {!venta.puedeEditar && (
              <p className={styles.celdaSub}>Solo el vendedor de esta venta, un admin o el dueño pueden cambiar sus pasos.</p>
            )}
            <ol className={styles.pasos}>
              {e.pasos.map((p) => (
                <PasoFila
                  key={p.id}
                  paso={p}
                  expedienteId={e.id}
                  puedeEditar={venta.puedeEditar}
                  onActualizado={onActualizado}
                />
              ))}
            </ol>
          </>
        )}
      </aside>
    </div>
  );
}

function PasoFila({
  paso,
  expedienteId,
  puedeEditar,
  onActualizado,
}: {
  paso: PasoDTO;
  expedienteId: string;
  puedeEditar: boolean;
  onActualizado: (exp: ExpedienteDTO) => void;
}) {
  const [nota, setNota] = useState(paso.nota ?? "");
  useEffect(() => setNota(paso.nota ?? ""), [paso.nota]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(cambios: { hecho?: boolean; fecha?: string | null; nota?: string | null }) {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`/api/expedientes/${expedienteId}/pasos/${paso.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar");
        return;
      }
      onActualizado(aDto(data));
    } catch {
      setError("Error de conexión, intentá de nuevo");
    } finally {
      setGuardando(false);
    }
  }

  const notaCambio = (nota.trim() || null) !== (paso.nota ?? null);

  return (
    <li className={`${styles.paso} ${paso.hecho ? styles.pasoHecho : ""}`}>
      <label className={styles.pasoTitulo}>
        <input
          type="checkbox"
          checked={paso.hecho}
          disabled={!puedeEditar || guardando}
          onChange={(ev) => guardar({ hecho: ev.target.checked })}
        />
        <span>{paso.nombre}</span>
      </label>
      <div className={styles.pasoMeta}>
        {paso.hecho && paso.completadoPor && (
          <span>
            Marcado por {paso.completadoPor}
            {paso.completadoEn ? ` el ${fechaCorta(paso.completadoEn)}` : ""}
          </span>
        )}
      </div>
      <div className={styles.pasoCampos}>
        <label className={styles.campoFecha}>
          <span>Fecha</span>
          <input
            type="date"
            value={paso.fecha ?? ""}
            disabled={!puedeEditar || guardando}
            onChange={(ev) => guardar({ fecha: ev.target.value || null })}
            aria-label={`Fecha de ${paso.nombre}`}
          />
        </label>
        <input
          type="text"
          className={styles.inputNota}
          value={nota}
          maxLength={NOTA_PASO_MAX}
          disabled={!puedeEditar || guardando}
          placeholder={puedeEditar ? "Nota (n.º de trámite, gestor…)" : ""}
          onChange={(ev) => setNota(ev.target.value)}
          onBlur={() => notaCambio && guardar({ nota: nota.trim() || null })}
          onKeyDown={(ev) => {
            if (ev.key === "Enter" && notaCambio) guardar({ nota: nota.trim() || null });
          }}
          aria-label={`Nota de ${paso.nombre}`}
        />
      </div>
      {!puedeEditar && paso.fecha && <span className={styles.celdaSub}>{fechaYmd(paso.fecha)}</span>}
      {error && <p className={styles.errorTexto}>{error}</p>}
    </li>
  );
}

function PlantillaEditor({
  inicial,
  diasTrabado,
  onGuardado,
  onError,
}: {
  inicial: PlantillaPaso[];
  diasTrabado: number;
  onGuardado: (dias: number, texto: string) => void;
  onError: (texto: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pasos, setPasos] = useState<PlantillaPaso[]>(inicial);
  const [dias, setDias] = useState(diasTrabado);
  const [guardando, setGuardando] = useState(false);
  const errorLocal = errorPlantilla(pasos);

  function mover(i: number, delta: number) {
    setPasos((prev) => {
      const j = i + delta;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function guardar() {
    setGuardando(true);
    try {
      const res = await fetch("/api/tramites/plantilla", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pasos: pasos.map((p) => ({ ...(p.id ? { id: p.id } : {}), nombre: p.nombre.trim(), activo: p.activo })),
          diasExpedienteTrabado: dias,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        onError(data?.error ?? "No se pudo guardar la plantilla");
        return;
      }
      setPasos(data.pasos.map((p: PlantillaPaso) => ({ id: p.id, nombre: p.nombre, activo: p.activo })));
      setDias(data.diasExpedienteTrabado);
      const activos = data.pasos.filter((p: PlantillaPaso) => p.activo).length;
      onGuardado(
        data.diasExpedienteTrabado,
        `Plantilla guardada: ${activos} paso${activos === 1 ? "" : "s"} activo${activos === 1 ? "" : "s"}. Se usa en los expedientes nuevos; los ya abiertos no cambian.`
      );
    } catch {
      onError("Error de conexión, intentá de nuevo");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className={styles.plantilla}>
      <button type="button" className={styles.plantillaHead} onClick={() => setAbierto((a) => !a)} aria-expanded={abierto}>
        <span>
          <span className={styles.plantillaTitulo}>Pasos del expediente y aviso de trabados</span>
          <span className={styles.celdaSub}>
            Solo el dueño. Los cambios se aplican a los expedientes nuevos; los ya abiertos conservan sus pasos.
          </span>
        </span>
        <span className={styles.linkTexto}>{abierto ? "Cerrar" : "Editar"}</span>
      </button>

      {abierto && (
        <div className={styles.plantillaBody}>
          <ol className={styles.plantillaLista}>
            {pasos.map((p, i) => (
              <li key={p.id ?? `nuevo-${i}`} className={p.activo ? "" : styles.inactivo}>
                <span className={styles.orden}>{i + 1}</span>
                <input
                  type="text"
                  className={styles.inputNombre}
                  value={p.nombre}
                  maxLength={NOMBRE_PASO_MAX}
                  onChange={(ev) => setPasos((prev) => prev.map((x, k) => (k === i ? { ...x, nombre: ev.target.value } : x)))}
                  aria-label={`Nombre del paso ${i + 1}`}
                />
                <label className={styles.activo}>
                  <input
                    type="checkbox"
                    checked={p.activo}
                    onChange={(ev) => setPasos((prev) => prev.map((x, k) => (k === i ? { ...x, activo: ev.target.checked } : x)))}
                  />
                  Activo
                </label>
                <button type="button" className={styles.iconBtn} onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir">
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => mover(i, 1)}
                  disabled={i === pasos.length - 1}
                  aria-label="Bajar"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setPasos((prev) => prev.filter((_, k) => k !== i))}
                  disabled={pasos.length === 1}
                  aria-label={`Quitar ${p.nombre || "paso"}`}
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className={styles.btnGhost} onClick={() => setPasos((prev) => [...prev, { nombre: "", activo: true }])}>
            <Plus size={13} /> Agregar paso
          </button>

          <div className={styles.plantillaPie}>
            <label className={styles.umbral}>
              Marcar como trabado a los
              <select value={dias} onChange={(ev) => setDias(Number(ev.target.value))}>
                {DIAS_TRABADO_OPCIONES.map((d) => (
                  <option key={d} value={d}>
                    {d} días
                  </option>
                ))}
              </select>
              sin movimiento
            </label>
            {errorLocal && <span className={styles.errorTexto}>{errorLocal}</span>}
            <button type="button" className={styles.btnPrimary} disabled={!!errorLocal || guardando} onClick={guardar}>
              {guardando ? "Guardando…" : "Guardar plantilla"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
