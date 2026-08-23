import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "../panel.module.css";
import reportStyles from "./reportes.module.css";
import { ReportesView } from "./ReportesView";

const canalLabel: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  MERCADO_LIBRE: "Mercado Libre",
  INSTAGRAM: "Instagram",
  WEB: "Web",
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const session = await auth();
  const { tenantId, id: userId, rol } = session!.user;

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

  const vendorFilter = rol === "VENDEDOR" ? { vendedorId: userId } : {};

  const [ventasEnRango, leadsEnRango, ventasParaRotacion, usuariosTenant] = await Promise.all([
    prisma.venta.findMany({
      where: { tenantId, ...vendorFilter, fecha: { gte: from, lte: to } },
      select: { fecha: true, precioFinal: true },
      orderBy: { fecha: "asc" },
    }),
    prisma.lead.findMany({
      where: { tenantId, ...vendorFilter, createdAt: { gte: from, lte: to } },
      select: { canal: true, etapa: true },
    }),
    // Rotación de stock es una métrica de inventario de toda la agencia,
    // no de un vendedor puntual — no se filtra por vendedorId.
    prisma.venta.findMany({
      where: { tenantId, fecha: { gte: from, lte: to } },
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
  ]);

  // --- Ventas en el tiempo: agrupadas por día ---
  const ventasPorDia = new Map<string, { unidades: number; monto: number }>();
  for (const v of ventasEnRango) {
    const key = isoDay(v.fecha);
    const actual = ventasPorDia.get(key) ?? { unidades: 0, monto: 0 };
    actual.unidades += 1;
    actual.monto += Number(v.precioFinal);
    ventasPorDia.set(key, actual);
  }
  const ventasSerie = [...ventasPorDia.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, v]) => ({ fecha, ...v }));

  // --- Leads por canal + conversión a cerrado ---
  const canales = ["WHATSAPP", "MERCADO_LIBRE", "INSTAGRAM", "WEB"] as const;
  const leadsPorCanal = canales.map((canal) => {
    const deEsteCanal = leadsEnRango.filter((l) => l.canal === canal);
    const cerrados = deEsteCanal.filter((l) => l.etapa === "CERRADO").length;
    return {
      canal: canalLabel[canal],
      total: deEsteCanal.length,
      cerrados,
      pct: deEsteCanal.length > 0 ? Math.round((cerrados / deEsteCanal.length) * 100) : 0,
    };
  });

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
  const rotacionMin = rotacion.length > 0 ? Math.min(...rotacion.map((r) => r.dias)) : null;
  const rotacionMax = rotacion.length > 0 ? Math.max(...rotacion.map((r) => r.dias)) : null;

  // --- Performance por vendedor (solo Dueño) ---
  let performanceVendedores: {
    nombre: string;
    leads: number;
    ventas: number;
    comision: number;
  }[] = [];

  if (rol === "DUENIO" && usuariosTenant.length > 0) {
    const [leadsGroup, ventasGroup] = await Promise.all([
      prisma.lead.groupBy({
        by: ["vendedorId"],
        where: { tenantId, createdAt: { gte: from, lte: to }, vendedorId: { not: null } },
        _count: { _all: true },
      }),
      prisma.venta.groupBy({
        by: ["vendedorId"],
        where: { tenantId, fecha: { gte: from, lte: to } },
        _count: { _all: true },
        _sum: { comision: true },
      }),
    ]);

    const leadsPorVendedor = new Map(leadsGroup.map((g) => [g.vendedorId, g._count._all]));
    const ventasPorVendedor = new Map(ventasGroup.map((g) => [g.vendedorId, g._count._all]));
    const comisionPorVendedor = new Map(
      ventasGroup.map((g) => [g.vendedorId, Number(g._sum.comision ?? 0)])
    );

    performanceVendedores = usuariosTenant
      .map((u) => ({
        nombre: u.nombre,
        leads: leadsPorVendedor.get(u.id) ?? 0,
        ventas: ventasPorVendedor.get(u.id) ?? 0,
        comision: comisionPorVendedor.get(u.id) ?? 0,
      }))
      .filter((u) => u.leads > 0 || u.ventas > 0)
      .sort((a, b) => b.ventas - a.ventas || b.comision - a.comision);
  }

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Reportes</h1>
          <div className={styles.topbarSub}>Ventas, leads y rotación de stock</div>
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
          ventasSerie={ventasSerie}
          leadsPorCanal={leadsPorCanal}
          rotacion={rotacion}
          rotacionPromedio={rotacionPromedio}
          rotacionMin={rotacionMin}
          rotacionMax={rotacionMax}
          performanceVendedores={rol === "DUENIO" ? performanceVendedores : null}
        />
      </div>
    </>
  );
}
