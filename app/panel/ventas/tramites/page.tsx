import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "../../panel.module.css";
import { VentasTabs } from "../VentasTabs";
import { asegurarPlantilla } from "@/lib/expedientes";
import { puedeEditarPasos } from "@/lib/tramites";
import { TramitesView, type VentaTramiteDTO } from "./TramitesView";

// Pestaña Trámites de Ventas: el expediente de cada venta (transferencia y
// demás), con su progreso, el aviso de trabados y, para el Dueño, la
// plantilla de pasos. Un VENDEDOR ve solo sus ventas.
//
// No se filtra por sucursal: el seguimiento es por venta y lo puede llevar
// administración desde cualquier local.
export default async function TramitesPage(props: { searchParams: Promise<{ venta?: string; filtro?: string }> }) {
  const { venta: ventaAbierta, filtro } = await props.searchParams;
  const session = await auth();
  const { tenantId, id: userId, rol } = session!.user;
  const esDuenio = rol === "DUENIO";

  const [ventas, tenant, plantilla] = await Promise.all([
    prisma.venta.findMany({
      where: { tenantId, ...(rol === "VENDEDOR" ? { vendedorId: userId } : {}) },
      include: {
        vehiculo: { select: { marca: true, modelo: true, anio: true } },
        vendedor: { select: { id: true, nombre: true } },
        expediente: {
          include: {
            pasos: { orderBy: { orden: "asc" }, include: { completadoPor: { select: { nombre: true } } } },
          },
        },
      },
      orderBy: { fecha: "desc" },
    }),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { diasExpedienteTrabado: true } }),
    esDuenio ? asegurarPlantilla(prisma, tenantId) : Promise.resolve(null),
  ]);

  const items: VentaTramiteDTO[] = ventas.map((v) => ({
    id: v.id,
    fecha: v.fecha.toISOString(),
    vehiculo: `${v.vehiculo.marca} ${v.vehiculo.modelo} ${v.vehiculo.anio}`,
    compradorNombre: v.compradorNombre,
    vendedorNombre: v.vendedor.nombre,
    puedeEditar: puedeEditarPasos(rol, userId, v.vendedor.id),
    expediente: v.expediente
      ? {
          id: v.expediente.id,
          ultimaActividadEn: v.expediente.ultimaActividadEn.toISOString(),
          completadoEn: v.expediente.completadoEn?.toISOString() ?? null,
          pasos: v.expediente.pasos.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            orden: p.orden,
            hecho: p.hecho,
            fecha: p.fecha ? p.fecha.toISOString().slice(0, 10) : null,
            nota: p.nota,
            completadoPor: p.completadoPor?.nombre ?? null,
            completadoEn: p.completadoEn?.toISOString() ?? null,
          })),
        }
      : null,
  }));

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Ventas</h1>
          <div className={styles.topbarSub}>
            Trámites después de la venta: transferencia, documentación y entrega
          </div>
        </div>
        <VentasTabs />
      </div>
      <div className={styles.content}>
        <TramitesView
          ventas={items}
          diasTrabado={tenant.diasExpedienteTrabado}
          plantilla={plantilla ? plantilla.map((p) => ({ id: p.id, nombre: p.nombre, activo: p.activo })) : null}
          ventaAbierta={ventaAbierta ?? null}
          // Desde Pendientes ("Revisar N expedientes trabados").
          soloTrabados={filtro === "trabados"}
        />
      </div>
    </>
  );
}
