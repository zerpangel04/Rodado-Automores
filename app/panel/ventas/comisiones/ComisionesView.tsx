"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Download } from "lucide-react";
import styles from "./comisiones.module.css";
import { Pill } from "../../Pill";
import { formatearPrecio, type Moneda } from "@/lib/moneda";
import { agruparPendientes, sumarMontos, type GrupoPendiente } from "@/lib/comisiones";

export type VentaPendienteDTO = {
  id: string;
  fecha: string;
  vehiculo: string;
  compradorNombre: string | null;
  vendedorId: string;
  vendedorNombre: string;
  moneda: Moneda;
  comision: number;
};

export type LiquidacionDTO = {
  id: string;
  fecha: string;
  historica: boolean;
  vendedorNombre: string;
  moneda: Moneda;
  total: number;
  cantidadVentas: number;
  nota: string | null;
  creadaPor: string | null;
  anuladaEn: string | null;
  anuladaPor: string | null;
  ventas: {
    id: string;
    fecha: string | null;
    vehiculo: string;
    compradorNombre: string | null;
    comision: number | null;
  }[];
};

const NOTA_MAX = 200;
const ZONA = "America/Argentina/Buenos_Aires";

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { timeZone: ZONA });
}

function fechaHora(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: ZONA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function monedaTexto(m: Moneda) {
  return m === "USD" ? "en dólares" : "en pesos";
}

function csvField(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// Comprobante de una liquidación en CSV (se abre bien en Excel: BOM + CRLF).
function descargarCsv(l: LiquidacionDTO) {
  const filas = [
    ["Liquidación", l.id],
    ["Vendedor", l.vendedorNombre],
    ["Fecha", l.historica ? "Desconocida (registrada antes de las liquidaciones)" : fechaHora(l.fecha)],
    ["Moneda", l.moneda],
    ["Total", String(l.total)],
    ["Ventas", String(l.cantidadVentas)],
    ["Liquidó", l.creadaPor ?? ""],
    ["Estado", l.anuladaEn ? `Anulada el ${fechaHora(l.anuladaEn)}${l.anuladaPor ? ` por ${l.anuladaPor}` : ""}` : "Vigente"],
    ["Nota", l.nota ?? ""],
    [],
    ["Fecha de venta", "Vehículo", "Comprador", "Comisión"],
    ...l.ventas.map((v) => [
      v.fecha ? fecha(v.fecha) : "",
      v.vehiculo,
      v.compradorNombre ?? "",
      v.comision === null ? "" : String(v.comision),
    ]),
  ];
  const csv = "﻿" + filas.map((f) => f.map(csvField).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `liquidacion-${l.vendedorNombre.replace(/\s+/g, "-").toLowerCase()}-${l.moneda}-${l.fecha.slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ComisionesView({
  pendientes,
  historial,
  puedeLiquidar,
}: {
  pendientes: VentaPendienteDTO[];
  historial: LiquidacionDTO[];
  puedeLiquidar: boolean;
}) {
  const router = useRouter();
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const grupos = useMemo(
    () => agruparPendientes(pendientes.map((v) => ({ ...v, liquidacionId: null }))),
    [pendientes]
  );
  const ventasPorId = useMemo(() => new Map(pendientes.map((v) => [v.id, v])), [pendientes]);

  // El aviso queda arriba: se sube para que se vea aunque la acción haya
  // sido al final del historial.
  function mostrarAviso(a: { tipo: "ok" | "error"; texto: string }) {
    setAviso(a);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function despuesDeCambiar(texto: string) {
    mostrarAviso({ tipo: "ok", texto });
    router.refresh();
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

      <section>
        <h2 className={styles.titulo}>Pendientes de liquidar</h2>
        <p className={styles.subtitulo}>
          Por vendedor y moneda: dólares y pesos se liquidan por separado, nunca sumados.
        </p>
        {grupos.length === 0 ? (
          <p className={styles.vacio}>No hay comisiones pendientes. Todo está liquidado.</p>
        ) : (
          <div className={styles.grupos}>
            {grupos.map((g) => (
              <GrupoCard
                key={`${g.vendedorId}-${g.moneda}`}
                grupo={g}
                ventas={g.ventaIds.map((id) => ventasPorId.get(id)!).filter(Boolean)}
                puedeLiquidar={puedeLiquidar}
                onLiquidado={despuesDeCambiar}
                onError={(texto) => mostrarAviso({ tipo: "error", texto })}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className={styles.titulo}>Historial de liquidaciones</h2>
        {historial.length === 0 ? (
          <p className={styles.vacio}>Todavía no hay liquidaciones.</p>
        ) : (
          <div className={styles.tablaCard}>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  {puedeLiquidar && <th>Vendedor</th>}
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th>Ventas</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {historial.map((l) => (
                  <FilaLiquidacion
                    key={l.id}
                    liq={l}
                    puedeLiquidar={puedeLiquidar}
                    onAnulada={despuesDeCambiar}
                    onError={(texto) => mostrarAviso({ tipo: "error", texto })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function GrupoCard({
  grupo,
  ventas,
  puedeLiquidar,
  onLiquidado,
  onError,
}: {
  grupo: GrupoPendiente;
  ventas: VentaPendienteDTO[];
  puedeLiquidar: boolean;
  onLiquidado: (texto: string) => void;
  onError: (texto: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  // Por defecto, todas las pendientes del grupo.
  const [elegidas, setElegidas] = useState<Set<string>>(() => new Set(grupo.ventaIds));
  const [nota, setNota] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const seleccion = ventas.filter((v) => elegidas.has(v.id));
  const totalSeleccion = sumarMontos(seleccion.map((v) => v.comision));

  function alternar(id: string) {
    setElegidas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirmando(false);
  }

  async function liquidar() {
    setEnviando(true);
    try {
      const res = await fetch("/api/comisiones/liquidar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendedorId: grupo.vendedorId,
          moneda: grupo.moneda,
          ventaIds: seleccion.map((v) => v.id),
          nota: nota.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        onError(data?.error ?? "No se pudo liquidar");
        setConfirmando(false);
        return;
      }
      onLiquidado(
        `Liquidaste ${formatearPrecio(data.total, grupo.moneda)} a ${grupo.vendedorNombre} (${data.cantidadVentas} venta${data.cantidadVentas === 1 ? "" : "s"}).`
      );
    } catch {
      onError("Error de conexión, intentá de nuevo");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={styles.grupo}>
      <button type="button" className={styles.grupoHead} onClick={() => setAbierto((a) => !a)} aria-expanded={abierto}>
        <span className={styles.grupoInfo}>
          <span className={styles.grupoNombre}>{grupo.vendedorNombre}</span>
          <span className={styles.grupoMeta}>
            {grupo.cantidad} venta{grupo.cantidad === 1 ? "" : "s"} {monedaTexto(grupo.moneda)} · del {fecha(grupo.desde)}
            {grupo.cantidad > 1 ? ` al ${fecha(grupo.hasta)}` : ""}
          </span>
        </span>
        <span className={`${styles.grupoTotal} mono`}>{formatearPrecio(grupo.total, grupo.moneda)}</span>
        <ChevronDown size={14} className={abierto ? styles.chevAbierto : styles.chev} />
      </button>

      {abierto && (
        <div className={styles.grupoBody}>
          <ul className={styles.ventas}>
            {ventas.map((v) => (
              <li key={v.id}>
                <label className={styles.ventaFila}>
                  {puedeLiquidar && (
                    <input type="checkbox" checked={elegidas.has(v.id)} onChange={() => alternar(v.id)} />
                  )}
                  <span className={styles.ventaInfo}>
                    <span>{v.vehiculo}</span>
                    <span className={styles.ventaSub}>
                      {fecha(v.fecha)}
                      {v.compradorNombre ? ` · ${v.compradorNombre}` : ""}
                    </span>
                  </span>
                  <span className="mono">{formatearPrecio(v.comision, v.moneda)}</span>
                </label>
              </li>
            ))}
          </ul>

          {puedeLiquidar && (
            <div className={styles.liquidarBox}>
              <input
                type="text"
                className={styles.input}
                value={nota}
                maxLength={NOTA_MAX}
                placeholder="Nota opcional (ej. transferencia del 30/11)"
                onChange={(e) => setNota(e.target.value)}
                aria-label="Nota de la liquidación (opcional)"
              />
              {confirmando ? (
                <div className={styles.confirmar}>
                  <span>
                    ¿Liquidar {formatearPrecio(totalSeleccion, grupo.moneda)} a {grupo.vendedorNombre} ({seleccion.length} venta
                    {seleccion.length === 1 ? "" : "s"})? Queda registrado y el vendedor recibe el aviso.
                  </span>
                  <button type="button" className={styles.btnGhost} disabled={enviando} onClick={() => setConfirmando(false)}>
                    Cancelar
                  </button>
                  <button type="button" className={styles.btnPrimary} disabled={enviando} onClick={liquidar}>
                    {enviando ? "Liquidando…" : "Sí, liquidar"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={seleccion.length === 0}
                  onClick={() => setConfirmando(true)}
                >
                  Liquidar {formatearPrecio(totalSeleccion, grupo.moneda)}
                  {seleccion.length !== ventas.length ? ` (${seleccion.length} de ${ventas.length})` : ""}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilaLiquidacion({
  liq,
  puedeLiquidar,
  onAnulada,
  onError,
}: {
  liq: LiquidacionDTO;
  puedeLiquidar: boolean;
  onAnulada: (texto: string) => void;
  onError: (texto: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function anular() {
    setEnviando(true);
    try {
      const res = await fetch(`/api/comisiones/${liq.id}/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: motivo.trim() || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        onError(data?.error ?? "No se pudo anular la liquidación");
        return;
      }
      onAnulada(
        `Anulaste la liquidación de ${formatearPrecio(liq.total, liq.moneda)} a ${liq.vendedorNombre}: ${data.ventasLiberadas} venta${data.ventasLiberadas === 1 ? "" : "s"} volvi${data.ventasLiberadas === 1 ? "ó" : "eron"} a pendiente.`
      );
    } catch {
      onError("Error de conexión, intentá de nuevo");
    } finally {
      setEnviando(false);
      setAnulando(false);
    }
  }

  const columnas = puedeLiquidar ? 6 : 5;

  return (
    <>
      <tr className={liq.anuladaEn ? styles.filaAnulada : ""}>
        <td>
          {liq.historica ? (
            <span title="Se pagó antes de que Rodado guardara la fecha de cada liquidación">
              <span className={styles.celdaMain}>Fecha desconocida</span>
              <span className={styles.celdaSub}>histórica</span>
            </span>
          ) : (
            <>
              <span className={styles.celdaMain}>{fechaHora(liq.fecha)}</span>
              {liq.creadaPor && <span className={styles.celdaSub}>por {liq.creadaPor}</span>}
            </>
          )}
        </td>
        {puedeLiquidar && <td>{liq.vendedorNombre}</td>}
        <td style={{ textAlign: "right" }} className="mono">
          {formatearPrecio(liq.total, liq.moneda)}
        </td>
        <td>
          <button type="button" className={styles.linkBtn} onClick={() => setAbierto((a) => !a)} aria-expanded={abierto}>
            {liq.cantidadVentas} venta{liq.cantidadVentas === 1 ? "" : "s"} <ChevronDown size={12} className={abierto ? styles.chevAbierto : styles.chev} />
          </button>
        </td>
        <td>
          {liq.anuladaEn ? (
            <span title={`Anulada el ${fechaHora(liq.anuladaEn)}${liq.anuladaPor ? ` por ${liq.anuladaPor}` : ""}`}>
              <Pill color="gray">Anulada</Pill>
            </span>
          ) : (
            <Pill color="green">Vigente</Pill>
          )}
        </td>
        <td className={styles.acciones}>
          <button type="button" className={styles.iconBtn} onClick={() => descargarCsv(liq)} title="Descargar comprobante (CSV)" aria-label="Descargar comprobante (CSV)">
            <Download size={14} />
          </button>
          {puedeLiquidar && !liq.anuladaEn && !anulando && (
            <button type="button" className={styles.btnGhost} onClick={() => setAnulando(true)}>
              Anular
            </button>
          )}
        </td>
      </tr>

      {anulando && (
        <tr className={styles.filaDetalle}>
          <td colSpan={columnas}>
            <div className={styles.confirmar}>
              <span>
                ¿Anular esta liquidación?{" "}
                {liq.cantidadVentas === 1
                  ? "Su venta vuelve a pendiente"
                  : `Sus ${liq.cantidadVentas} ventas vuelven a pendiente`}{" "}
                y queda registrado en el log.
              </span>
              <input
                type="text"
                className={styles.input}
                value={motivo}
                maxLength={NOTA_MAX}
                placeholder="Motivo (opcional)"
                onChange={(e) => setMotivo(e.target.value)}
                aria-label="Motivo de la anulación (opcional)"
              />
              <button type="button" className={styles.btnGhost} disabled={enviando} onClick={() => setAnulando(false)}>
                Cancelar
              </button>
              <button type="button" className={styles.btnPeligro} disabled={enviando} onClick={anular}>
                {enviando ? "Anulando…" : "Sí, anular"}
              </button>
            </div>
          </td>
        </tr>
      )}

      {abierto && (
        <tr className={styles.filaDetalle}>
          <td colSpan={columnas}>
            {liq.nota && <p className={styles.nota}>Nota: {liq.nota}</p>}
            {liq.anuladaEn && (
              <p className={styles.nota}>
                Anulada el {fechaHora(liq.anuladaEn)}
                {liq.anuladaPor ? ` por ${liq.anuladaPor}` : ""}.
              </p>
            )}
            <ul className={styles.ventas}>
              {liq.ventas.map((v) => (
                <li key={v.id} className={styles.ventaFila}>
                  <span className={styles.ventaInfo}>
                    <span>{v.vehiculo}</span>
                    <span className={styles.ventaSub}>
                      {v.fecha ? fecha(v.fecha) : ""}
                      {v.compradorNombre ? ` · ${v.compradorNombre}` : ""}
                    </span>
                  </span>
                  <span className="mono">{v.comision === null ? "—" : formatearPrecio(v.comision, liq.moneda)}</span>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}
