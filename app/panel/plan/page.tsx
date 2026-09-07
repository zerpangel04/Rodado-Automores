import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "../panel.module.css";
import { KpiBar } from "../KpiBar";
import planStyles from "./plan.module.css";

function fmtLimite(n: number | null) {
  return n === null ? "Sin límite" : String(n);
}

function pct(actual: number, limite: number | null) {
  if (limite === null) return 0;
  if (limite === 0) return 100;
  return Math.round((actual / limite) * 100);
}

export default async function PlanPage() {
  const session = await auth();
  const { tenantId, rol } = session!.user;

  if (rol !== "DUENIO") {
    return (
      <>
        <div className={styles.topbar}>
          <div>
            <h1 className="disp">Tu plan</h1>
          </div>
        </div>
        <div className={styles.content}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Solo el dueño de la agencia puede ver y gestionar el plan.
          </p>
        </div>
      </>
    );
  }

  const [tenant, sucursalesCount, vehiculosCount, usuariosCount, planes] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, include: { plan: true } }),
    prisma.sucursal.count({ where: { tenantId } }),
    prisma.vehiculo.count({ where: { tenantId } }),
    prisma.usuario.count({ where: { tenantId } }),
    prisma.plan.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const plan = tenant.plan;

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Tu plan</h1>
          <div className={styles.topbarSub}>Estás en el plan {plan.nombre}</div>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.kpiRow} style={{ marginBottom: 18 }}>
          <KpiBar
            color="var(--accent)"
            label="Sucursales"
            value={String(sucursalesCount)}
            unit={`de ${fmtLimite(plan.limiteSucursales)}`}
            percent={pct(sucursalesCount, plan.limiteSucursales)}
          />
          <KpiBar
            color="var(--info)"
            label="Vehículos"
            value={String(vehiculosCount)}
            unit={`de ${fmtLimite(plan.limiteVehiculos)}`}
            percent={pct(vehiculosCount, plan.limiteVehiculos)}
          />
          <KpiBar
            color="var(--secondary)"
            label="Usuarios"
            value={String(usuariosCount)}
            unit={`de ${fmtLimite(plan.limiteUsuarios)}`}
            percent={pct(usuariosCount, plan.limiteUsuarios)}
          />
        </div>

        <div className={planStyles.grid}>
          {planes.map((p) => {
            const esActual = p.id === plan.id;
            return (
              <div key={p.id} className={`${planStyles.card} ${esActual ? planStyles.cardActual : ""}`}>
                {esActual && <div className={planStyles.badge}>Tu plan actual</div>}
                <h3 className="disp">{p.nombre}</h3>
                <ul className={planStyles.features}>
                  <li>{fmtLimite(p.limiteSucursales)} sucursal{p.limiteSucursales === 1 ? "" : "es"}</li>
                  <li>{fmtLimite(p.limiteVehiculos)} vehículos</li>
                  <li>{fmtLimite(p.limiteUsuarios)} usuarios</li>
                  <li className={p.reportesAvanzados ? planStyles.on : planStyles.off}>
                    Reportes avanzados
                  </li>
                  <li className={p.asistenteIA ? planStyles.on : planStyles.off}>Asistente de tasación IA</li>
                  <li className={p.soportePrioritario ? planStyles.on : planStyles.off}>Soporte prioritario</li>
                </ul>
                {esActual ? (
                  <button type="button" className={planStyles.btnActual} disabled>
                    Plan actual
                  </button>
                ) : (
                  <button
                    type="button"
                    className={planStyles.btnUpgrade}
                    title="Escribinos a soporte@rodado.com.ar para cambiar de plan"
                    disabled
                  >
                    Próximamente
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className={planStyles.contacto}>
          ¿Necesitás cambiar de plan ya? Escribinos a{" "}
          <a href="mailto:soporte@rodado.com.ar">soporte@rodado.com.ar</a>.
        </p>
      </div>
    </>
  );
}
