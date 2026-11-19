import Link from "next/link";
import { Lock } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSucursalActual } from "@/lib/sucursalFiltro";
import { getPlanTenant } from "@/lib/planes";
import {
  aUsdParaComparar,
  sumarPorMoneda,
  sumarVentasEnUsd,
  type MontoVenta,
  type TotalesPorMoneda,
} from "@/lib/moneda";
import styles from "../panel.module.css";
import reportStyles from "./reportes.module.css";
import { ReportesView, type Etapa } from "./ReportesView";

const canalLabel: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  MERCADO_LIBRE: "Mercado Libre",
  INSTAGRAM: "Instagram",
  WEB: "Web",
  WEB_IA: "Asistente IA",
};

const etapaOrder: Record<Etapa, number> = {
  NUEVO: 0,
  CONTACTADO: 1,
  TEST_DRIVE: 2,
  NEGOCIACION: 3,
  CERRADO: 4,
};

const embudoLabels = ["Consultas recibidas", "Contactados", "Test drive", "Negociación", "Cerrados"];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ReportesPage(
  props: {
    searchParams: Promise<{ range?: string; from?: string; to?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const { tenantId, id: userId, rol } = session!.user;

  const plan = await getPlanTenant(tenantId);
  if (!plan.reportesAvanzados) {
    return (
      <>
        <div className={styles.topbar}>
          <div>
            <h1 className="disp">Reportes</h1>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.card} style={{ textAlign: "center", padding: "48px 24px" }}>
            <Lock size={28} style={{ color: "var(--ink-soft)", marginBottom: 12 }} />
            <h3 className="disp" style={{ marginBottom: 6 }}>
              Reportes avanzados disponibles en plan Profesional o superior
            </h3>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 18 }}>
              Estás en el plan {plan.nombre}. Actualizá tu plan para ver ventas en el tiempo, embudo de
              conversión, leads por canal, rotación de stock y performance por vendedor.
            </p>
            <Link
              href="/panel/plan"
              style={{
                display: "inline-block",
                background: "var(--accent)",
                color: "#1a1206",
                fontWeight: 600,
                fontSize: 13,
                padding: "9px 18px",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              Actualizar plan →
            </Link>
          </div>
        </div>
      </>
    );
  }

  const now = new Date();
  let from: Date;
  let to: Date;
  let range: "30" | "90" | "custom";

  if (searchParams.range === "custom" && searchParams.from && searchParams.to) {
    range = "custom";
    from = startOfDay(new Date(`${searchParams.from}T00:00:00`));
    to = endOfDay(new Date(`${searchParams.to}T00:00:00`));
  } else {
    range = searchParams.range === "90" ? "90" : "30";
    const days = range === "90" ? 90 : 30;
    to = endOfDay(now);
    from = startOfDay(new Date(now.getTime() - days * 86400000));
  }

  // Período anterior de igual duración, inmediatamente antes de "from" —
  // usado solo para las tendencias (nunca se muestra un delta inventado).
  const rangeDurationMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - rangeDurationMs);

  const sucursalActual = await getSucursalActual(tenantId);
  const sucursalFilter = sucursalActual
    ? { vehiculo: { sucursalId: sucursalActual.id } }
    : {};

  const vendorFilter = rol === "VENDEDOR" ? { vendedorId: userId } : {};

  const [
    ventasEnRango,
    leadsEnRango,
    ventasParaRotacion,
    usuariosTenant,
    ventasPrev,
    leadsPrev,
    ventasParaRotacionPrev,
  ] = await Promise.all([
    prisma.venta.findMany({
      where: { tenantId, ...vendorFilter, ...sucursalFilter, fecha: { gte: from, lte: to } },
      select: { fecha: true, precioFinal: true, moneda: true, cotizacion: true },
      orderBy: { fecha: "asc" },
    }),
    prisma.lead.findMany({
      where: { tenantId, ...vendorFilter, ...sucursalFilter, createdAt: { gte: from, lte: to } },
      select: { canal: true, etapa: true },
    }),
    // Rotación de stock es una métrica de inventario de toda la agencia,
    // no de un vendedor puntual — no se filtra por vendedorId, pero sí
    // por sucursal cuando se está mirando una en particular.
    prisma.venta.findMany({
      where: { tenantId, ...sucursalFilter, fecha: { gte: from, lte: to } },
      select: {
        fecha: true,
        vehiculo: { select: { marca: true, modelo: true, fechaIngreso: true } },
      },
      orderBy: { fecha: "asc" },
    }),
    rol === "DUENIO"
      ? prisma.usuario.findMany({
          where: { tenantId },
          select: { id: true, nombre: true },
          orderBy: { nombre: "asc" },
        })
      : Promise.resolve([]),
    prisma.venta.findMany({
      where: { tenantId, ...vendorFilter, ...sucursalFilter, fecha: { gte: prevFrom, lte: prevTo } },
      select: { precioFinal: true, moneda: true, cotizacion: true },
    }),
    prisma.lead.findMany({
      where: { tenantId, ...vendorFilter, ...sucursalFilter, createdAt: { gte: prevFrom, lte: prevTo } },
      select: { etapa: true },
    }),
    prisma.venta.findMany({
      where: { tenantId, ...sucursalFilter, fecha: { gte: prevFrom, lte: prevTo } },
      select: { fecha: true, vehiculo: { select: { fechaIngreso: true } } },
    }),
  ]);

  // Montos de cada venta con su moneda y la cotización guardada al venderse.
  const montoVenta = (v: { precioFinal: unknown; moneda: MontoVenta["moneda"]; cotizacion: unknown }): MontoVenta => ({
    monto: Number(v.precioFinal),
    moneda: v.moneda,
    cotizacion: v.cotizacion === null ? null : Number(v.cotizacion),
  });

  // --- Ventas en el tiempo: agrupadas por día ---
  // El gráfico necesita un único monto por día: cada venta en pesos se pasa
  // a USD con la cotización guardada al registrarla (nunca la de hoy). Las
  // que no tienen cotización guardada se cuentan en unidades pero no en el
  // monto, y se avisa debajo del gráfico.
  const ventasPorDia = new Map<string, { unidades: number; monto: number }>();
  for (const v of ventasEnRango) {
    const key = isoDay(v.fecha);
    const actual = ventasPorDia.get(key) ?? { unidades: 0, monto: 0 };
    actual.unidades += 1;
    const m = montoVenta(v);
    actual.monto += aUsdParaComparar(m.monto, m.moneda, m.cotizacion) ?? 0;
    ventasPorDia.set(key, actual);
  }
  const ventasSerie = [...ventasPorDia.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, v]) => ({ fecha, ...v }));

  const totalUnidades = ventasEnRango.length;
  // Lo que se muestra: un total por moneda.
  const totalMonto = sumarPorMoneda(ventasEnRango.map(montoVenta));
  // Solo para el "% vs. período anterior": los dos períodos en USD.
  const enRangoUsd = sumarVentasEnUsd(ventasEnRango.map(montoVenta));
  const totalMontoUsd = enRangoUsd.usd;
  const totalMontoPrevUsd = sumarVentasEnUsd(ventasPrev.map(montoVenta)).usd;
  const ventasSinCotizacion = enRangoUsd.omitidas;
  const hayPesos = ventasEnRango.some((v) => v.moneda === "ARS");
  const totalUnidadesPrev = ventasPrev.length;

  // --- Leads por canal + conversión a cerrado ---
  const canales = ["WHATSAPP", "MERCADO_LIBRE", "INSTAGRAM", "WEB", "WEB_IA"] as const;
  const leadsPorCanal = canales.map((canal) => {
    const deEsteCanal = leadsEnRango.filter((l) => l.canal === canal);
    const cerrados = deEsteCanal.filter((l) => l.etapa === "CERRADO").length;
    return {
      canal: canalLabel[canal],
      canalKey: canal,
      total: deEsteCanal.length,
      cerrados,
      pct: deEsteCanal.length > 0 ? Math.round((cerrados / deEsteCanal.length) * 100) : 0,
    };
  });

  // --- Embudo de conversión: cuenta leads que llegaron a cada etapa o más
  // allá, asumiendo progresión monótona (no se trackea historial de etapas
  // intermedias, solo la etapa actual) ---
  const embudo = embudoLabels.map((label, i) => ({
    label,
    n: leadsEnRango.filter((l) => etapaOrder[l.etapa as Etapa] >= i).length,
  }));
  const totalLeads = embudo[0].n;
  const totalCerrados = embudo[4].n;
  const conversionPct = totalLeads > 0 ? Math.round((totalCerrados / totalLeads) * 100) : 0;

  const totalLeadsPrev = leadsPrev.length;
  const totalCerradosPrev = leadsPrev.filter((l) => l.etapa === "CERRADO").length;
  const conversionPctPrev =
    totalLeadsPrev > 0 ? Math.round((totalCerradosPrev / totalLeadsPrev) * 100) : null;

  // --- Rotación de stock: días entre fechaIngreso y la venta ---
  const rotacion = ventasParaRotacion.map((v) => {
    const dias = Math.round(
      (v.fecha.getTime() - v.vehiculo.fechaIngreso.getTime()) / 86400000
    );
    return {
      vehiculo: `${v.vehiculo.marca} ${v.vehiculo.modelo}`,
      dias: Math.max(0, dias),
    };
  });
  const rotacionPromedio =
    rotacion.length > 0
      ? Math.round(rotacion.reduce((acc, r) => acc + r.dias, 0) / rotacion.length)
      : null;

  const rotacionPrevDias = ventasParaRotacionPrev.map((v) =>
    Math.max(0, Math.round((v.fecha.getTime() - v.vehiculo.fechaIngreso.getTime()) / 86400000))
  );
  const rotacionPromedioPrev =
    rotacionPrevDias.length > 0
      ? Math.round(rotacionPrevDias.reduce((a, b) => a + b, 0) / rotacionPrevDias.length)
      : null;

  // --- Performance por vendedor (solo Dueño) ---
  let performanceVendedores: {
    nombre: string;
    leads: number;
    ventas: number;
    facturado: TotalesPorMoneda;
    comision: TotalesPorMoneda;
  }[] = [];

  if (rol === "DUENIO" && usuariosTenant.length > 0) {
    const [leadsGroup, ventasGroup] = await Promise.all([
      prisma.lead.groupBy({
        by: ["vendedorId"],
        where: {
          tenantId,
          ...sucursalFilter,
          createdAt: { gte: from, lte: to },
          vendedorId: { not: null },
        },
        _count: { _all: true },
      }),
      // Ventas una por una (no groupBy con _sum): sumar precioFinal de
      // distintas monedas daría un número sin sentido.
      prisma.venta.findMany({
        where: { tenantId, ...sucursalFilter, fecha: { gte: from, lte: to } },
        select: { vendedorId: true, precioFinal: true, comision: true, moneda: true, cotizacion: true },
      }),
    ]);

    const leadsPorVendedor = new Map(leadsGroup.map((g) => [g.vendedorId, g._count._all]));
    const ventasDe = (id: string) => ventasGroup.filter((v) => v.vendedorId === id);

    performanceVendedores = usuariosTenant
      .map((u) => {
        const suyas = ventasDe(u.id);
        const comisiones = suyas.map((v) => montoVenta({ ...v, precioFinal: v.comision }));
        return {
          nombre: u.nombre,
          leads: leadsPorVendedor.get(u.id) ?? 0,
          ventas: suyas.length,
          facturado: sumarPorMoneda(suyas.map(montoVenta)),
          comision: sumarPorMoneda(comisiones),
          // Solo para desempatar el orden.
          comisionUsd: sumarVentasEnUsd(comisiones).usd,
        };
      })
      .filter((u) => u.leads > 0 || u.ventas > 0)
      .sort((a, b) => b.ventas - a.ventas || b.comisionUsd - a.comisionUsd)
      .map(({ comisionUsd: _, ...resto }) => resto);
  }

  // --- Lecturas automáticas: solo se generan cuando hay datos reales que
  // las sustenten, nunca con placeholders ---
  const lecturas: { tono: "success" | "warn" | "danger"; titulo: string; detalle: string }[] = [];

  const canalesConDatos = leadsPorCanal.filter((c) => c.total > 0);
  if (canalesConDatos.length > 0) {
    const mejor = canalesConDatos.slice().sort((a, b) => b.pct - a.pct)[0];
    lecturas.push({
      tono: "success",
      titulo: `${mejor.canal} es tu mejor canal`,
      detalle: `Cierra el ${mejor.pct}% de sus ${mejor.total} consulta${mejor.total === 1 ? "" : "s"} en este período.`,
    });

    const peor = canalesConDatos.slice().sort((a, b) => a.pct - b.pct)[0];
    if (peor.canal !== mejor.canal && peor.pct < 30) {
      lecturas.push({
        tono: "warn",
        titulo: `${peor.canal} no está cerrando`,
        detalle: `${peor.total} consulta${peor.total === 1 ? "" : "s"} y ${peor.cerrados} venta${
          peor.cerrados === 1 ? "" : "s"
        } en el período. Revisá precio y tiempo de respuesta.`,
      });
    }
  }

  if (rotacion.length > 0 && rotacionPromedio !== null) {
    const lenta = rotacion.slice().sort((a, b) => b.dias - a.dias)[0];
    if (lenta.dias >= rotacionPromedio * 1.5 && lenta.dias >= 20) {
      lecturas.push({
        tono: "danger",
        titulo: `${lenta.vehiculo} tiene rotación lenta`,
        detalle: `${lenta.dias} días en stock, contra un promedio de ${rotacionPromedio}. Considerá ajustar el precio o rotarla de sucursal.`,
      });
    }
  }

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Reportes</h1>
          <div className={styles.topbarSub}>
            Ventas, leads y rotación de stock
            {sucursalActual ? ` · ${sucursalActual.nombre}` : ""}
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <div className={reportStyles.filterBar}>
          <a
            href="/panel/reportes?range=30"
            className={`${reportStyles.fbtn} ${range === "30" ? reportStyles.active : ""}`}
          >
            Últimos 30 días
          </a>
          <a
            href="/panel/reportes?range=90"
            className={`${reportStyles.fbtn} ${range === "90" ? reportStyles.active : ""}`}
          >
            Últimos 90 días
          </a>
          <form className={reportStyles.customRange} action="/panel/reportes" method="GET">
            <input type="hidden" name="range" value="custom" />
            <input
              type="date"
              name="from"
              defaultValue={searchParams.from ?? isoDay(from)}
              required
            />
            <span>a</span>
            <input
              type="date"
              name="to"
              defaultValue={searchParams.to ?? isoDay(to)}
              required
            />
            <button type="submit" className={reportStyles.fbtn}>
              Aplicar
            </button>
          </form>
        </div>

        <ReportesView
          totalUnidades={totalUnidades}
          totalMonto={totalMonto}
          totalMontoUsd={totalMontoUsd}
          totalUnidadesPrev={totalUnidadesPrev}
          totalMontoPrevUsd={totalMontoPrevUsd}
          hayPesos={hayPesos}
          ventasSinCotizacion={ventasSinCotizacion}
          ventasSerie={ventasSerie}
          embudo={embudo}
          conversionPct={conversionPct}
          conversionPctPrev={conversionPctPrev}
          leadsPorCanal={leadsPorCanal}
          rotacion={rotacion}
          rotacionPromedio={rotacionPromedio}
          rotacionPromedioPrev={rotacionPromedioPrev}
          performanceVendedores={rol === "DUENIO" ? performanceVendedores : null}
          lecturas={lecturas}
        />
      </div>
    </>
  );
}
