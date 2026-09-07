import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanTenant } from "@/lib/planes";
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

// Misma fuente que ya usa el resto del panel (FxBox en el sidebar,
// Ventas, ficha de lead) para la cotización del dólar — dolarapi.com.
// `cache: "no-store"` para que nunca quede pisada: cada carga de la
// página pide la cotización del momento.
async function fetchCotizacionOficial(): Promise<number | null> {
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/oficial", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.venta === "number" ? data.venta : null;
  } catch {
    return null;
  }
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

  const [plan, sucursalesCount, vehiculosCount, usuariosCount, planes, cotizacionOficial] = await Promise.all([
    getPlanTenant(tenantId),
    prisma.sucursal.count({ where: { tenantId } }),
    prisma.vehiculo.count({ where: { tenantId } }),
    prisma.usuario.count({ where: { tenantId } }),
    prisma.plan.findMany({ orderBy: { createdAt: "asc" } }),
    fetchCotizacionOficial(),
  ]);

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
                <div className={planStyles.precio}>
                  <span className={planStyles.precioUsd}>USD {Number(p.precioUsd).toLocaleString("es-AR")}/mes</span>
                  {cotizacionOficial !== null && (
                    <span className={planStyles.precioArs}>
                      ≈ ${Math.round(Number(p.precioUsd) * cotizacionOficial).toLocaleString("es-AR")} ARS/mes
                    </span>
                  )}
                </div>
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

        <p className={planStyles.fxNote}>
          {cotizacionOficial !== null
            ? `Cotización dólar oficial: $${Math.round(cotizacionOficial).toLocaleString("es-AR")} — actualizado hoy. El precio en pesos varía día a día.`
            : "No pudimos obtener la cotización del dólar oficial en este momento — mostrando solo precios en USD."}
        </p>

        <p className={planStyles.contacto}>
          ¿Necesitás cambiar de plan ya? Escribinos a{" "}
          <a href="mailto:soporte@rodado.com.ar">soporte@rodado.com.ar</a>.
        </p>
      </div>
    </>
  );
}
