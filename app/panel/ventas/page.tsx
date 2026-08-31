import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSucursalActual } from "@/lib/sucursalFiltro";
import styles from "../panel.module.css";
import { VentasView } from "./VentasView";

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
    estadoCobro: v.estadoCobro,
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
      </div>
      <div className={styles.content}>
        <VentasView initialItems={items} verVendedor={rol !== "VENDEDOR"} />
      </div>
    </>
  );
}
