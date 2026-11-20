import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "../../panel.module.css";
import { VentasTabs } from "../VentasTabs";
import { ComisionesView, type LiquidacionDTO, type VentaPendienteDTO } from "./ComisionesView";

// Cuántas liquidaciones se muestran en el historial (las más recientes).
const HISTORIAL_MAX = 100;

// Pestaña Comisiones de Ventas: pendientes por vendedor y moneda, para
// liquidar (Dueño/Admin), e historial de liquidaciones con su detalle y la
// opción de anular. Un VENDEDOR ve solo lo suyo, sin acciones.
//
// No se filtra por sucursal: una liquidación es de un vendedor, con todas
// sus ventas pendientes, sea cual sea la sucursal del auto.
export default async function ComisionesPage() {
  const session = await auth();
  const { tenantId, id: userId, rol } = session!.user;
  const puedeLiquidar = rol !== "VENDEDOR";
  const soloMias = rol === "VENDEDOR" ? { vendedorId: userId } : {};

  const [pendientes, liquidaciones] = await Promise.all([
    prisma.venta.findMany({
      where: { tenantId, liquidacionId: null, ...soloMias },
      include: {
        vehiculo: { select: { marca: true, modelo: true } },
        vendedor: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha: "asc" },
    }),
    prisma.liquidacionComision.findMany({
      where: { tenantId, ...soloMias },
      include: {
        vendedor: { select: { nombre: true } },
        creadaPor: { select: { nombre: true } },
        anuladaPor: { select: { nombre: true } },
      },
      orderBy: { fecha: "desc" },
      take: HISTORIAL_MAX,
    }),
  ]);

  // Detalle de cada liquidación: sus ventas, tomadas de ventaIds (la
  // constancia que queda aunque se haya anulado y las ventas ya no apunten
  // a ella).
  const idsHistorial = Array.from(new Set(liquidaciones.flatMap((l) => l.ventaIds)));
  const ventasHistorial = idsHistorial.length
    ? await prisma.venta.findMany({
        where: { tenantId, id: { in: idsHistorial } },
        select: {
          id: true,
          fecha: true,
          comision: true,
          compradorNombre: true,
          vehiculo: { select: { marca: true, modelo: true } },
        },
      })
    : [];
  const ventaPorId = new Map(ventasHistorial.map((v) => [v.id, v]));

  const itemsPendientes: VentaPendienteDTO[] = pendientes.map((v) => ({
    id: v.id,
    fecha: v.fecha.toISOString(),
    vehiculo: `${v.vehiculo.marca} ${v.vehiculo.modelo}`,
    compradorNombre: v.compradorNombre,
    vendedorId: v.vendedor.id,
    vendedorNombre: v.vendedor.nombre,
    moneda: v.moneda,
    comision: Number(v.comision),
  }));

  const itemsHistorial: LiquidacionDTO[] = liquidaciones.map((l) => ({
    id: l.id,
    fecha: l.fecha.toISOString(),
    historica: l.historica,
    vendedorNombre: l.vendedor.nombre,
    moneda: l.moneda,
    total: Number(l.total),
    cantidadVentas: l.cantidadVentas,
    nota: l.nota,
    creadaPor: l.creadaPor?.nombre ?? null,
    anuladaEn: l.anuladaEn?.toISOString() ?? null,
    anuladaPor: l.anuladaPor?.nombre ?? null,
    ventas: l.ventaIds.map((id) => {
      const v = ventaPorId.get(id);
      // Una venta revertida antes de que existiera el bloqueo no está más:
      // se muestra igual que se incluyó, sin inventar datos.
      return v
        ? {
            id,
            fecha: v.fecha.toISOString(),
            vehiculo: `${v.vehiculo.marca} ${v.vehiculo.modelo}`,
            compradorNombre: v.compradorNombre,
            comision: Number(v.comision),
          }
        : { id, fecha: null, vehiculo: "Venta ya no disponible", compradorNombre: null, comision: null };
    }),
  }));

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Ventas</h1>
          <div className={styles.topbarSub}>
            {puedeLiquidar ? "Comisiones de los vendedores: liquidá lo pendiente y revisá lo pagado" : "Tus comisiones: pendientes y liquidadas"}
          </div>
        </div>
        <VentasTabs />
      </div>
      <div className={styles.content}>
        <ComisionesView pendientes={itemsPendientes} historial={itemsHistorial} puedeLiquidar={puedeLiquidar} />
      </div>
    </>
  );
}
