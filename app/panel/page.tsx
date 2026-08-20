import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { diasHastaVtv } from "@/lib/docs";
import styles from "./panel.module.css";

const canalLabel: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  MERCADO_LIBRE: "Mercado Libre",
  INSTAGRAM: "Instagram",
  WEB: "Web",
};

export default async function PanelHome() {
  const session = await auth();
  const { tenantId, id: userId, rol } = session!.user;
  const leadFilter =
    rol === "VENDEDOR" ? { tenantId, vendedorId: userId } : { tenantId };
  const ventaFilter =
    rol === "VENDEDOR" ? { tenantId, vendedorId: userId } : { tenantId };

  const [stockActivo, stockTotalValor, leadsAbiertos, ventasCount, ultimosLeads, vehiculosConVtv] =
    await Promise.all([
      prisma.vehiculo.count({
        where: { tenantId, estado: { not: "VENDIDO" } },
      }),
      prisma.vehiculo.aggregate({
        where: { tenantId, estado: { not: "VENDIDO" } },
        _sum: { precioUsd: true },
      }),
      prisma.lead.count({ where: { ...leadFilter, etapa: { not: "CERRADO" } } }),
      prisma.venta.count({ where: ventaFilter }),
      prisma.lead.findMany({
        where: leadFilter,
        include: { vehiculo: { select: { marca: true, modelo: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.vehiculo.findMany({
        where: { tenantId, estado: { not: "VENDIDO" }, vtvVencimiento: { not: null } },
        select: { id: true, marca: true, modelo: true, vtvVencimiento: true },
      }),
    ]);

  const valor = stockTotalValor._sum.precioUsd ?? 0;

  const alertasVtv = vehiculosConVtv
    .map((v) => ({ ...v, dias: diasHastaVtv(v.vtvVencimiento) }))
    .filter((v) => v.dias !== null && v.dias <= 30)
    .sort((a, b) => (a.dias as number) - (b.dias as number));

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Panel general</h1>
          <div className={styles.topbarSub}>Vista general de tu negocio</div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.kpiRow}>
          <div className={styles.kpi}>
            <div className={styles.l}>Stock activo</div>
            <div className={`${styles.v} disp`}>{stockActivo}</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.l}>Leads abiertos</div>
            <div className={`${styles.v} disp`}>{leadsAbiertos}</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.l}>Ventas registradas</div>
            <div className={`${styles.v} disp`}>{ventasCount}</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.l}>Valor del stock</div>
            <div className={`${styles.v} disp mono`}>
              USD {Number(valor).toLocaleString("es-AR")}
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className="disp">Últimos leads</h3>
          {ultimosLeads.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              Sin leads todavía.
            </p>
          ) : (
            ultimosLeads.map((l) => (
              <div
                key={l.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--line)",
                  fontSize: 13,
                }}
              >
                <div>
                  <b>{l.nombreCliente}</b>{" "}
                  <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>
                    · {l.vehiculo ? `${l.vehiculo.marca} ${l.vehiculo.modelo}` : "Sin vehículo"}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                  {canalLabel[l.canal] ?? l.canal}
                </span>
              </div>
            ))
          )}
        </div>

        {alertasVtv.length > 0 && (
          <div className={styles.card} style={{ marginTop: 20 }}>
            <h3 className="disp">Documentación por vencer</h3>
            {alertasVtv.map((v) => {
              const vencida = (v.dias as number) < 0;
              return (
                <div
                  key={v.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--line)",
                    fontSize: 13,
                  }}
                >
                  <div>
                    <b>{v.marca} {v.modelo}</b>{" "}
                    <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>· VTV</span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: vencida ? "var(--red)" : "#9A6F00",
                    }}
                  >
                    {vencida
                      ? `Vencida hace ${Math.abs(v.dias as number)} día${Math.abs(v.dias as number) === 1 ? "" : "s"}`
                      : `Vence en ${v.dias} día${v.dias === 1 ? "" : "s"}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
