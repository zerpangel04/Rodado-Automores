import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRelativo } from "../actividadDisplay";
import styles from "../panel.module.css";
import { IntegracionesView, type ActividadItem } from "./IntegracionesView";

export default async function IntegracionesPage(
  props: {
    searchParams: Promise<{ ml_connected?: string; ml_error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const { tenantId, rol } = session!.user;

  if (rol !== "DUENIO") {
    return (
      <>
        <div className={styles.topbar}>
          <div>
            <h1 className="disp">Integraciones</h1>
          </div>
        </div>
        <div className={styles.content}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Solo el dueño de la agencia puede gestionar las integraciones.
          </p>
        </div>
      </>
    );
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const conexion = await prisma.mercadoLibreConexion.findUnique({ where: { tenantId } });

  let metricas = null;
  let actividad: ActividadItem[] = [];

  if (conexion) {
    const [totalVehiculos, publicados, consultasImportadas, atencion, actividadLog] = await Promise.all([
      prisma.vehiculo.count({ where: { tenantId } }),
      prisma.vehiculo.count({ where: { tenantId, mlItemId: { not: null } } }),
      prisma.lead.count({
        where: { tenantId, canal: "MERCADO_LIBRE", createdAt: { gte: startOfMonth } },
      }),
      prisma.vehiculo.findMany({
        where: { tenantId, mlLastError: { not: null } },
        select: { marca: true, modelo: true, mlLastError: true },
        take: 1,
      }),
      prisma.actividadLog.findMany({
        where: { tenantId, tipo: { in: ["ML_ACTUALIZADO", "ML_PAUSADA", "ML_ATENCION"] } },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, tipo: true, descripcion: true, createdAt: true },
      }),
    ]);

    metricas = {
      publicacionesActivas: publicados,
      totalVehiculos,
      consultasImportadas,
      requierenAtencion: atencion.length,
      primeraAtencion: atencion[0]
        ? `${atencion[0].marca} ${atencion[0].modelo}: ${atencion[0].mlLastError}`
        : null,
    };

    actividad = actividadLog.map((a) => ({
      id: a.id,
      tipo: a.tipo,
      texto: a.descripcion,
      hace: formatRelativo(a.createdAt),
    }));
  }

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Integraciones</h1>
          <div className={styles.topbarSub}>Conectá tu agencia con las plataformas donde publicás y vendés</div>
        </div>
      </div>
      <div className={styles.content}>
        <IntegracionesView
          conectada={
            conexion
              ? {
                  mlUserId: conexion.mlUserId,
                  conectadaDesde: conexion.createdAt.toISOString(),
                  syncPrecios: conexion.syncPrecios,
                  syncFotos: conexion.syncFotos,
                  pausarAlVender: conexion.pausarAlVender,
                }
              : null
          }
          metricas={metricas}
          actividad={actividad}
          mlConnected={searchParams.ml_connected === "1"}
          mlError={searchParams.ml_error ?? null}
        />
      </div>
    </>
  );
}
