import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSucursalActual } from "@/lib/sucursalFiltro";
import styles from "../panel.module.css";
import { VentasView } from "./VentasView";
import { VentasTabs } from "./VentasTabs";

export default async function VentasPage() {
  const session = await auth();
  const { tenantId, id: userId, rol } = session!.user;

  const sucursalActual = await getSucursalActual(tenantId);

  const ventas = await prisma.venta.findMany({
    where: {
      tenantId,
      ...(rol === "VENDEDOR" ? { vendedorId: userId } : {}),
      ...(sucursalActual ? { vehiculo: { sucursalId: sucursalActual.id } } : {}),
    },
    include: {
      vehiculo: { select: { marca: true, modelo: true, sucursal: { select: { nombre: true } } } },
      vendedor: { select: { id: true, nombre: true } },
      expediente: { select: { completadoEn: true, pasos: { select: { hecho: true } } } },
    },
    orderBy: { fecha: "desc" },
  });

  const items = ventas.map((v) => ({
    id: v.id,
    fecha: v.fecha.toISOString(),
    vehiculo: {
      marca: v.vehiculo.marca,
      modelo: v.vehiculo.modelo,
      sucursal: v.vehiculo.sucursal.nombre,
    },
    vendedor: v.vendedor,
    compradorNombre: v.compradorNombre,
    precioFinal: Number(v.precioFinal),
    comision: Number(v.comision),
    moneda: v.moneda,
    cotizacion: v.cotizacion === null ? null : Number(v.cotizacion),
    // Comisión ya pagada al vendedor (está en una liquidación vigente).
    comisionLiquidada: v.liquidacionId !== null,
    // Progreso del expediente de trámites (null = la venta no tiene).
    tramites: v.expediente
      ? {
          hechos: v.expediente.pasos.filter((p) => p.hecho).length,
          total: v.expediente.pasos.length,
          completo: v.expediente.completadoEn !== null,
        }
      : null,
  }));

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Ventas</h1>
          <div className={styles.topbarSub}>
            Se completa automáticamente al marcar un vehículo como vendido en Stock
            {sucursalActual ? ` · ${sucursalActual.nombre}` : ""}
          </div>
        </div>
        <VentasTabs />
      </div>
      <div className={styles.content}>
        <VentasView initialItems={items} verVendedor={rol !== "VENDEDOR"} />
      </div>
    </>
  );
}
