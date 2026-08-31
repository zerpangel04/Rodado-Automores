import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { diasHastaVtv } from "@/lib/docs";
import { canalLabelEs, etapaLabelEs } from "@/lib/labels";
import styles from "./panel.module.css";
import { KpiRing } from "./KpiRing";
import { Pill, type PillColor } from "./Pill";
import { actividadIcon, actividadColor, formatRelativo } from "./actividadDisplay";
import { PendientesCard, type Pendiente } from "./PendientesCard";

const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);

const canalColor: Record<string, PillColor> = {
  WHATSAPP: "green",
  MERCADO_LIBRE: "amber",
  INSTAGRAM: "purple",
  WEB: "blue",
  WEB_IA: "gray",
};

const etapaColor: Record<string, PillColor> = {
  NUEVO: "gray",
  CONTACTADO: "blue",
  TEST_DRIVE: "purple",
  NEGOCIACION: "amber",
  CERRADO: "green",
};

const BUENOS_AIRES_TZ = "America/Argentina/Buenos_Aires";

function saludoDelDia() {
  const hora = Number(
    new Intl.DateTimeFormat("es-AR", {
      hour: "numeric",
      hour12: false,
      timeZone: BUENOS_AIRES_TZ,
    }).format(new Date())
  );
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

function fechaDeHoy() {
  const fecha = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: BUENOS_AIRES_TZ,
  }).format(new Date());
  return fecha.charAt(0).toUpperCase() + fecha.slice(1);
}

export default async function PanelHome() {
  const session = await auth();
  const { tenantId, id: userId, rol, name } = session!.user;
  const canAsignar = rol !== "VENDEDOR";
  const leadFilter =
    rol === "VENDEDOR" ? { tenantId, vendedorId: userId } : { tenantId };
  const ventaFilter =
    rol === "VENDEDOR" ? { tenantId, vendedorId: userId } : { tenantId };
  const actividadFilter =
    rol === "VENDEDOR" ? { tenantId, vendedorId: userId } : { tenantId };

  const [
    stockActivo,
    stockDisponible,
    leadsAbiertos,
    leadsNegociacion,
    leadsTotal,
    ventasCount,
    leadsRecientes,
    vehiculosConVtv,
    actividadReciente,
    leadsNuevos,
    leadsSinAsignar,
    vehiculosDisponibles,
    usuarios,
  ] = await Promise.all([
    prisma.vehiculo.count({
      where: { tenantId, estado: { not: "VENDIDO" } },
    }),
    prisma.vehiculo.count({
      where: { tenantId, estado: "DISPONIBLE" },
    }),
    prisma.lead.count({ where: { ...leadFilter, etapa: { not: "CERRADO" } } }),
    prisma.lead.count({ where: { ...leadFilter, etapa: "NEGOCIACION" } }),
    prisma.lead.count({ where: leadFilter }),
    prisma.venta.count({ where: ventaFilter }),
    prisma.lead.findMany({
      where: leadFilter,
      include: { vehiculo: { select: { marca: true, modelo: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.vehiculo.findMany({
      where: { tenantId, estado: { not: "VENDIDO" }, vtvVencimiento: { not: null } },
      select: { id: true, marca: true, modelo: true, vtvVencimiento: true },
    }),
    prisma.actividadLog.findMany({
      where: actividadFilter,
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.lead.findMany({
      where: { ...leadFilter, etapa: "NUEVO" },
      include: {
        vehiculo: {
          select: { marca: true, modelo: true, estado: true, categoria: true, precioUsd: true },
        },
        vendedor: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    canAsignar
      ? prisma.lead.findMany({
          where: { tenantId, vendedorId: null, etapa: { not: "CERRADO" } },
          include: { vehiculo: { select: { marca: true, modelo: true } } },
          orderBy: { createdAt: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
    prisma.vehiculo.findMany({
      where: { tenantId, estado: { not: "VENDIDO" } },
      select: { id: true, marca: true, modelo: true, categoria: true, precioUsd: true, estado: true },
      orderBy: { fechaIngreso: "desc" },
    }),
    canAsignar
      ? prisma.usuario.findMany({
          where: { tenantId },
          select: { id: true, nombre: true },
          orderBy: { nombre: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const alertasVtv = vehiculosConVtv
    .map((v) => ({ ...v, dias: diasHastaVtv(v.vtvVencimiento) }))
    .filter((v) => v.dias !== null && v.dias <= 30)
    .sort((a, b) => (a.dias as number) - (b.dias as number));

  const pctStockDisponible = pct(stockDisponible, stockActivo);
  const pctLeadsNegociacion = pct(leadsNegociacion, leadsAbiertos);
  const pctConversion = pct(ventasCount, leadsTotal);
  const pctDocsPorVencer = pct(alertasVtv.length, stockActivo);

  const pendientes: Pendiente[] = [
    ...alertasVtv.map((v) => {
      const vencida = (v.dias as number) < 0;
      return {
        id: `vtv-${v.id}`,
        kind: "vtv" as const,
        label: `Renovar VTV — ${v.marca} ${v.modelo}`,
        meta: vencida
          ? `Vencida hace ${Math.abs(v.dias as number)} día${Math.abs(v.dias as number) === 1 ? "" : "s"}`
          : `Vence en ${v.dias} día${v.dias === 1 ? "" : "s"}`,
        urgente: vencida,
      };
    }),
    ...leadsNuevos.map((l) => ({
      id: `lead-nuevo-${l.id}`,
      kind: "contactar" as const,
      label: `Contactar a ${l.nombreCliente}`,
      meta: `Lead sin contactar · ${formatRelativo(l.createdAt)}`,
      urgente: false,
      lead: {
        id: l.id,
        nombreCliente: l.nombreCliente,
        contacto: l.contacto,
        mensaje: l.mensaje,
        canal: l.canal,
        etapa: l.etapa,
        vehiculo: l.vehiculo
          ? {
              marca: l.vehiculo.marca,
              modelo: l.vehiculo.modelo,
              estado: l.vehiculo.estado,
              categoria: l.vehiculo.categoria,
              precioUsd: Number(l.vehiculo.precioUsd),
            }
          : null,
        vendedor: l.vendedor,
        createdAt: l.createdAt.toISOString(),
      },
    })),
    ...leadsSinAsignar.map((l) => ({
      id: `sin-asignar-${l.id}`,
      kind: "asignar" as const,
      label: `Asignar vendedor a ${l.nombreCliente}`,
      meta: "Sin vendedor asignado",
      urgente: false,
      lead: {
        id: l.id,
        nombreCliente: l.nombreCliente,
        vehiculo: l.vehiculo ? { marca: l.vehiculo.marca, modelo: l.vehiculo.modelo } : null,
      },
    })),
  ];

  const vehiculoOptions = vehiculosDisponibles.map((v) => ({
    id: v.id,
    marca: v.marca,
    modelo: v.modelo,
    categoria: v.categoria,
    precioUsd: Number(v.precioUsd),
    estado: v.estado,
  }));

  const primerNombre = (name ?? "").trim().split(" ")[0] || "";

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">
            {saludoDelDia()}
            {primerNombre ? `, ${primerNombre}` : ""}
          </h1>
          <div className={styles.topbarSub}>{fechaDeHoy()}</div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.kpiRow}>
          <KpiRing
            percent={pctStockDisponible}
            color="var(--warn)"
            label="Stock disponible"
            value={`${stockDisponible} / ${stockActivo}`}
          />
          <KpiRing
            percent={pctLeadsNegociacion}
            color="var(--cyan)"
            label="Leads en negociación"
            value={`${leadsNegociacion} / ${leadsAbiertos}`}
            featured
          />
          <KpiRing
            percent={pctConversion}
            color="var(--success)"
            label="Conversión lead→venta"
            value={`${ventasCount} / ${leadsTotal}`}
          />
          <KpiRing
            percent={pctDocsPorVencer}
            color="var(--danger)"
            label="Docs. por vencer"
            value={`${alertasVtv.length} vehículo${alertasVtv.length === 1 ? "" : "s"}`}
          />
        </div>

        <div className={styles.dashRow}>
          <PendientesCard
            pendientes={pendientes}
            vehiculos={vehiculoOptions}
            usuarios={usuarios}
            canAsignar={canAsignar}
          />

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3 className="disp">Leads recientes</h3>
            </div>
            {leadsRecientes.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Sin leads todavía.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Contacto</th>
                      <th>Vehículo</th>
                      <th>Canal</th>
                      <th>Etapa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsRecientes.map((l) => (
                      <tr key={l.id}>
                        <td>{l.nombreCliente}</td>
                        <td className={styles.tableSub}>{l.contacto || "—"}</td>
                        <td className={styles.tableSub}>
                          {l.vehiculo ? `${l.vehiculo.marca} ${l.vehiculo.modelo}` : "Sin vehículo"}
                        </td>
                        <td>
                          <Pill color={canalColor[l.canal] ?? "gray"}>
                            {canalLabelEs[l.canal] ?? l.canal}
                          </Pill>
                        </td>
                        <td>
                          <Pill color={etapaColor[l.etapa] ?? "gray"}>
                            {etapaLabelEs[l.etapa] ?? l.etapa}
                          </Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className={styles.card} style={{ marginTop: 20 }}>
          <div className={styles.cardHead}>
            <h3 className="disp">Actividad reciente</h3>
          </div>
          {actividadReciente.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              Sin actividad todavía.
            </p>
          ) : (
            actividadReciente.map((a) => {
              const Icon = actividadIcon[a.tipo];
              return (
                <div key={a.id} className={styles.activityRow}>
                  <span
                    className={styles.activityIcon}
                    style={{ background: actividadColor[a.tipo] ?? "var(--ink-soft)" }}
                  >
                    {Icon ? <Icon size={13} /> : "•"}
                  </span>
                  <span className={styles.activityText}>{a.descripcion}</span>
                  <span className={styles.activityTime}>{formatRelativo(a.createdAt)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
