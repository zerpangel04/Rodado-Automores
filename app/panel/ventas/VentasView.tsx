"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import styles from "./ventas.module.css";
import { KpiBar } from "../KpiBar";
import { Pill } from "../Pill";
import {
  aUsdParaComparar,
  equivalente,
  formatearPrecio,
  formatearTotales,
  partesKpi,
  sumarPorMoneda,
  sumarVentasEnUsd,
  type Moneda,
  type TotalesPorMoneda,
} from "@/lib/moneda";

export type VentaDTO = {
  id: string;
  fecha: string;
  vehiculo: { marca: string; modelo: string; sucursal: string };
  vendedor: { id: string; nombre: string };
  compradorNombre: string | null;
  // precioFinal y comision están en `moneda`.
  precioFinal: number;
  comision: number;
  moneda: Moneda;
  // Pesos por dólar al registrar la venta (null en ventas viejas).
  cotizacion: number | null;
  estadoCobro: "PENDIENTE" | "COBRADO";
};

type Campo = "precioFinal" | "comision";

// Totales por moneda, nunca sumando dólares con pesos.
function totales(arr: VentaDTO[], k: Campo): TotalesPorMoneda {
  return sumarPorMoneda(arr.map((v) => ({ monto: v[k], moneda: v.moneda })));
}

// Para lo que necesita un único número (%, ticket, ranking): en USD con la
// cotización guardada de cada venta, nunca la de hoy.
function enUsd(arr: VentaDTO[], k: Campo) {
  return sumarVentasEnUsd(arr.map((v) => ({ monto: v[k], moneda: v.moneda, cotizacion: v.cotizacion })));
}
type Periodo = "mes" | "trimestre" | "todo";
type FiltroCobro = "todas" | "pendiente" | "cobrado";

const periodos: { key: Periodo; label: string }[] = [
  { key: "mes", label: "Este mes" },
  { key: "trimestre", label: "Trimestre" },
  { key: "todo", label: "Todo" },
];

const filtrosCobro: { key: FiltroCobro; label: string; dotColor?: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "pendiente", label: "Pendiente", dotColor: "var(--warn)" },
  { key: "cobrado", label: "Cobrado", dotColor: "var(--success)" },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function haceLabel(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "hace 1 día";
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.round(dias / 30);
  return meses === 1 ? "hace 1 mes" : `hace ${meses} meses`;
}

function csvField(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function fechaArchivo(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function VentasView({
  initialItems,
  verVendedor,
}: {
  initialItems: VentaDTO[];
  verVendedor: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  useEffect(() => setItems(initialItems), [initialItems]);

  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [filtro, setFiltro] = useState<FiltroCobro>("todas");
  const [vendedorId, setVendedorId] = useState("");
  const [listaAbierta, setListaAbierta] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [marcando, setMarcando] = useState(false);

  const vendedorWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listaAbierta) return;
    function handleClick(e: MouseEvent) {
      if (vendedorWrapRef.current && !vendedorWrapRef.current.contains(e.target as Node)) {
        setListaAbierta(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [listaAbierta]);

  const porPeriodo = useMemo(() => {
    if (periodo === "todo") return items;
    if (periodo === "mes") {
      const now = new Date();
      return items.filter((v) => {
        const f = new Date(v.fecha);
        return f.getFullYear() === now.getFullYear() && f.getMonth() === now.getMonth();
      });
    }
    const limite = Date.now() - 90 * 86400000;
    return items.filter((v) => new Date(v.fecha).getTime() >= limite);
  }, [items, periodo]);

  const cobradas = porPeriodo.filter((v) => v.estadoCobro === "COBRADO");
  const pendientes = porPeriodo.filter((v) => v.estadoCobro === "PENDIENTE");
  // Totales que se muestran: por moneda.
  const facturado = totales(porPeriodo, "precioFinal");
  const comisionesTotal = totales(porPeriodo, "comision");
  const comisionPendiente = totales(pendientes, "comision");
  const hayPesos = porPeriodo.some((v) => v.moneda === "ARS");

  // Indicadores de un solo número: en USD con la cotización de cada venta.
  const facturadoUsd = enUsd(porPeriodo, "precioFinal");
  const comisionesUsd = enUsd(porPeriodo, "comision");
  const convertibles = porPeriodo.length - facturadoUsd.omitidas;
  const ticketProm = convertibles > 0 ? Math.round(facturadoUsd.usd / convertibles) : 0;
  const preciosUsd = porPeriodo
    .map((v) => aUsdParaComparar(v.precioFinal, v.moneda, v.cotizacion))
    .filter((x): x is number => x !== null);
  const maxVenta = preciosUsd.length ? Math.max(...preciosUsd) : 0;

  const pctFacturadoCobrado =
    facturadoUsd.usd > 0 ? Math.round((enUsd(cobradas, "precioFinal").usd / facturadoUsd.usd) * 100) : 0;
  const pctUnidadesCobradas = porPeriodo.length
    ? Math.round((cobradas.length / porPeriodo.length) * 100)
    : 0;
  const pctComisionCobrada =
    comisionesUsd.usd > 0 ? Math.round((enUsd(cobradas, "comision").usd / comisionesUsd.usd) * 100) : 0;
  const pctTicketVsMax = maxVenta > 0 ? Math.round((ticketProm / maxVenta) * 100) : 0;

  const kpiFacturado = partesKpi(facturado);
  const kpiComisiones = partesKpi(comisionesTotal);

  const porVendedor = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; ventas: VentaDTO[] }>();
    for (const v of porPeriodo) {
      const entry = map.get(v.vendedor.id) ?? { id: v.vendedor.id, nombre: v.vendedor.nombre, ventas: [] };
      entry.ventas.push(v);
      map.set(v.vendedor.id, entry);
    }
    return Array.from(map.values())
      .map((e) => ({
        id: e.id,
        nombre: e.nombre,
        unidades: e.ventas.length,
        facturado: totales(e.ventas, "precioFinal"),
        comision: totales(e.ventas, "comision"),
        // Solo para ordenar y para el largo de la barra.
        facturadoUsd: enUsd(e.ventas, "precioFinal").usd,
      }))
      .sort((a, b) => b.facturadoUsd - a.facturadoUsd);
  }, [porPeriodo]);
  const maxFacturadoVendedor = porVendedor.length ? porVendedor[0].facturadoUsd || 1 : 1;

  const pendientesPorVendedor = useMemo(() => {
    const map = new Map<string, { nombre: string; ventas: VentaDTO[] }>();
    for (const v of pendientes) {
      const entry = map.get(v.vendedor.id) ?? { nombre: v.vendedor.nombre, ventas: [] };
      entry.ventas.push(v);
      map.set(v.vendedor.id, entry);
    }
    return Array.from(map.values())
      .map((e) => ({
        nombre: e.nombre,
        unidades: e.ventas.length,
        comision: totales(e.ventas, "comision"),
        comisionUsd: enUsd(e.ventas, "comision").usd,
      }))
      .sort((a, b) => b.comisionUsd - a.comisionUsd);
  }, [pendientes]);

  const pasaFiltro = (v: VentaDTO, f: FiltroCobro) =>
    f === "todas" || (f === "pendiente" ? v.estadoCobro === "PENDIENTE" : v.estadoCobro === "COBRADO");

  const lista = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return porPeriodo.filter((v) => {
      if (!pasaFiltro(v, filtro)) return false;
      if (vendedorId && v.vendedor.id !== vendedorId) return false;
      if (q) {
        const haystack = `${v.vehiculo.marca} ${v.vehiculo.modelo} ${v.vendedor.nombre}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [porPeriodo, filtro, vendedorId, searchQuery]);

  async function handleRegistrarPago() {
    if (pendientes.length === 0) return;
    if (
      !confirm(
        `¿Marcar ${pendientes.length} venta${pendientes.length === 1 ? "" : "s"} como cobrada${
          pendientes.length === 1 ? "" : "s"
        }?`
      )
    )
      return;
    setMarcando(true);
    const ids = pendientes.map((v) => v.id);
    const res = await fetch("/api/ventas/marcar-cobradas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setMarcando(false);
    if (res.ok) {
      setItems((prev) =>
        prev.map((v) => (ids.includes(v.id) ? { ...v, estadoCobro: "COBRADO" as const } : v))
      );
    }
  }

  const vendedorSeleccionado = porVendedor.find((v) => v.id === vendedorId);

  function handleExport() {
    const encabezados = [
      "Fecha",
      "Vehículo",
      "Cliente",
      "Vendedor",
      "Moneda",
      "Precio final",
      "Comisión",
      "Cotización al vender (pesos por dólar)",
      "Estado de cobro",
    ];
    const filas = lista.map((v) => [
      new Date(v.fecha).toLocaleDateString("es-AR"),
      `${v.vehiculo.marca} ${v.vehiculo.modelo}`,
      // Ventas registradas antes de sumar este campo quedan sin comprador
      // cargado — no hay forma real de recuperar ese dato, así que se
      // exporta en blanco en vez de inventarlo.
      v.compradorNombre ?? "",
      v.vendedor.nombre,
      v.moneda,
      String(Math.round(v.precioFinal)),
      String(Math.round(v.comision)),
      // En blanco en las ventas registradas antes de guardar la cotización.
      v.cotizacion === null ? "" : String(v.cotizacion),
      v.estadoCobro === "COBRADO" ? "Cobrado" : "Pendiente",
    ]);

    const csv =
      "﻿" +
      [encabezados, ...filas].map((fila) => fila.map(csvField).join(",")).join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas-rodado-${fechaArchivo(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (items.length === 0) {
    return (
      <p className={styles.empty}>
        Todavía no hay ventas registradas. Marcá un vehículo como &quot;Vendido&quot; en Stock.
      </p>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.headRow}>
        <div className={styles.segmented}>
          {periodos.map((p) => (
            <button
              key={p.key}
              type="button"
              className={periodo === p.key ? styles.active : ""}
              onClick={() => setPeriodo(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button type="button" className={styles.exportBtn} onClick={handleExport}>
          Exportar
        </button>
      </div>

      <div className={styles.kpiRow}>
        <KpiBar
          color="var(--success)"
          label="Facturado"
          value={kpiFacturado.valor}
          unit={kpiFacturado.unidad}
          valueExtra={kpiFacturado.extra}
          trend={{ label: `${pctFacturadoCobrado}% cobrado`, positive: "neutral" }}
          percent={pctFacturadoCobrado}
        />
        <KpiBar
          color="var(--info)"
          label="Unidades vendidas"
          value={String(porPeriodo.length)}
          unit="vehículos"
          trend={{ label: `${cobradas.length} cobradas`, positive: "neutral" }}
          percent={pctUnidadesCobradas}
        />
        <KpiBar
          color="var(--warn)"
          label="Comisiones"
          value={kpiComisiones.valor}
          unit={kpiComisiones.unidad}
          valueExtra={kpiComisiones.extra}
          trend={
            pendientes.length
              ? { label: `${formatearTotales(comisionPendiente)} sin pagar`, positive: false }
              : { label: "todo pagado", positive: true }
          }
          percent={pctComisionCobrada}
        />
        <KpiBar
          color="var(--accent)"
          label="Ticket promedio"
          value={ticketProm.toLocaleString("es-AR")}
          unit="USD"
          // Con ventas en pesos, el promedio las pasa a USD con la
          // cotización de cada venta.
          trend={{ label: hayPesos ? "por operación, en USD" : "por operación", positive: "neutral" }}
          percent={pctTicketVsMax}
        />
      </div>

      <div className={styles.filterBar}>
        <div className={styles.segmented}>
          {filtrosCobro.map((f) => {
            const count = porPeriodo.filter((v) => pasaFiltro(v, f.key)).length;
            return (
              <button
                key={f.key}
                type="button"
                className={filtro === f.key ? styles.active : ""}
                onClick={() => setFiltro(f.key)}
              >
                {f.dotColor && <span className={styles.dot} style={{ background: f.dotColor }} />}
                {f.label}
                <span className={styles.count}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.searchWrap}>
          <Search size={14} />
          <input
            className={styles.searchInput}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por vehículo o vendedor…"
          />
        </div>

        {verVendedor && (
          <div className={styles.vendedorDropdown} ref={vendedorWrapRef}>
            <button
              type="button"
              className={`${styles.vendedorBtn} ${vendedorId ? styles.active : ""}`}
              onClick={() => setListaAbierta((v) => !v)}
            >
              <span className={styles.dot} style={{ background: "var(--accent)" }} />
              {vendedorSeleccionado ? vendedorSeleccionado.nombre : "Todos los vendedores"}
              <ChevronDown size={12} />
            </button>
            {listaAbierta && (
              <div className={styles.vendedorMenu}>
                <div className={styles.vendedorMenuTitle}>VENDEDORES CON VENTAS</div>
                <button
                  type="button"
                  className={`${styles.vendedorItem} ${!vendedorId ? styles.vendedorItemActive : ""}`}
                  onClick={() => {
                    setVendedorId("");
                    setListaAbierta(false);
                  }}
                >
                  <span className={styles.avatar} style={{ background: "rgba(255,255,255,0.12)" }}>
                    ★
                  </span>
                  <span className={styles.vendedorItemBody}>
                    <span className={styles.vendedorItemName}>Todos los vendedores</span>
                    <span className={styles.vendedorItemMeta}>sin filtrar</span>
                  </span>
                  <span className={styles.vendedorItemCount}>{porPeriodo.length}</span>
                </button>
                {porVendedor.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`${styles.vendedorItem} ${
                      vendedorId === v.id ? styles.vendedorItemActive : ""
                    }`}
                    onClick={() => {
                      setVendedorId(v.id);
                      setListaAbierta(false);
                    }}
                  >
                    <span className={styles.avatar}>{initials(v.nombre)}</span>
                    <span className={styles.vendedorItemBody}>
                      <span className={styles.vendedorItemName}>{v.nombre}</span>
                      <span className={styles.vendedorItemMeta}>{formatearTotales(v.facturado)} facturado</span>
                    </span>
                    <span className={styles.vendedorItemCount}>{v.unidades}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.layout}>
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Vehículo</th>
                  <th>Cliente</th>
                  {verVendedor && <th>Vendedor</th>}
                  <th style={{ textAlign: "right" }}>Precio final</th>
                  <th style={{ textAlign: "right" }}>Comisión</th>
                  <th style={{ textAlign: "right" }}>Cobro</th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 ? (
                  <tr>
                    <td colSpan={verVendedor ? 7 : 6} className={styles.emptyRow}>
                      Sin ventas con estos filtros
                    </td>
                  </tr>
                ) : (
                  lista.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <div className={styles.cellMain}>
                          {new Date(v.fecha).toLocaleDateString("es-AR")}
                        </div>
                        <div className={styles.cellSub}>{haceLabel(v.fecha)}</div>
                      </td>
                      <td>
                        <div className={styles.cellMain}>
                          {v.vehiculo.marca} {v.vehiculo.modelo}
                        </div>
                        <div className={styles.cellSub}>{v.vehiculo.sucursal}</div>
                      </td>
                      <td>
                        <div className={styles.cellMain}>{v.compradorNombre || "—"}</div>
                      </td>
                      {verVendedor && (
                        <td>
                          <div className={styles.vendedorCell}>
                            <span className={styles.avatar}>{initials(v.vendedor.nombre)}</span>
                            {v.vendedor.nombre}
                          </div>
                        </td>
                      )}
                      <td style={{ textAlign: "right" }}>
                        <div className={styles.cellMain}>{formatearPrecio(v.precioFinal, v.moneda)}</div>
                        {(() => {
                          // Equivalente con la cotización del día de la venta
                          // (no la de hoy). Las ventas viejas no la tienen.
                          const eq = equivalente(v.precioFinal, v.moneda, v.cotizacion);
                          return eq ? (
                            <div
                              className={styles.cellSub}
                              title="Con la cotización del día en que se registró la venta"
                            >
                              ≈ {formatearPrecio(eq.monto, eq.moneda)} al vender
                            </div>
                          ) : null;
                        })()}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className={styles.cellMain}>{formatearPrecio(v.comision, v.moneda)}</div>
                        {v.precioFinal > 0 && (
                          <div className={styles.cellSub}>
                            {((v.comision / v.precioFinal) * 100).toFixed(1).replace(".", ",")}% del total
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Pill color={v.estadoCobro === "COBRADO" ? "green" : "amber"}>
                          {v.estadoCobro === "COBRADO" ? "Cobrado" : "Pendiente"}
                        </Pill>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {lista.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={verVendedor ? 4 : 3} className={styles.totalLabel}>
                      TOTAL {lista.length} {lista.length === 1 ? "OPERACIÓN" : "OPERACIONES"}
                    </td>
                    <td style={{ textAlign: "right" }} className={styles.totalValue}>
                      {formatearTotales(totales(lista, "precioFinal"))}
                    </td>
                    <td style={{ textAlign: "right" }} className={styles.totalComision}>
                      {formatearTotales(totales(lista, "comision"))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {verVendedor && (
          <div className={styles.side}>
            <div className={styles.sideCard}>
              <div className={styles.sideHead}>
                <span>Por vendedor</span>
                <span className={styles.sideHeadMeta}>{periodos.find((p) => p.key === periodo)?.label.toLowerCase()}</span>
              </div>
              <div className={styles.sideBody}>
                {porVendedor.length === 0 ? (
                  <p className={styles.empty}>Sin ventas en este período</p>
                ) : (
                  porVendedor.map((v) => (
                    <div key={v.id} className={styles.rankRow}>
                      <div className={styles.rankHead}>
                        <span className={styles.avatar}>{initials(v.nombre)}</span>
                        <span className={styles.rankInfo}>
                          <span className={styles.rankName}>{v.nombre}</span>
                          <span className={styles.rankMeta}>
                            {v.unidades} {v.unidades === 1 ? "unidad" : "unidades"}
                          </span>
                        </span>
                        <span className={styles.rankTotals}>
                          <span className={styles.rankFacturado}>{formatearTotales(v.facturado)}</span>
                          <span className={styles.rankComision}>{formatearTotales(v.comision)} comisión</span>
                        </span>
                      </div>
                      <div className={styles.rankTrack}>
                        <div
                          className={styles.rankFill}
                          style={{ width: `${Math.round((v.facturadoUsd / maxFacturadoVendedor) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={styles.sideCard}>
              <div className={styles.sideHead}>
                <span>Comisiones a pagar</span>
                <span className={styles.pendCount}>
                  {pendientes.length} {pendientes.length === 1 ? "venta" : "ventas"}
                </span>
              </div>
              <div className={styles.sideBody}>
                {pendientesPorVendedor.length === 0 ? (
                  <p className={styles.empty}>No hay comisiones pendientes de pago.</p>
                ) : (
                  <>
                    {pendientesPorVendedor.map((p) => (
                      <div key={p.nombre} className={styles.pendRow}>
                        <span className={styles.pendDot} />
                        <span className={styles.pendInfo}>
                          <span className={styles.pendName}>{p.nombre}</span>
                          <span className={styles.pendDetalle}>
                            {p.unidades} {p.unidades === 1 ? "venta sin cobrar" : "ventas sin cobrar"}
                          </span>
                        </span>
                        <span className={styles.pendMonto}>{formatearTotales(p.comision)}</span>
                      </div>
                    ))}
                    <div className={styles.pendTotalRow}>
                      <span>Total pendiente</span>
                      <span className={styles.pendTotalValue}>{formatearTotales(comisionPendiente)}</span>
                    </div>
                    <button type="button" className={styles.pagarBtn} onClick={handleRegistrarPago} disabled={marcando}>
                      {marcando ? "Registrando…" : "Registrar pago de comisiones"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
