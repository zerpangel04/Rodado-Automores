import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSucursalActual } from "@/lib/sucursalFiltro";
import styles from "../panel.module.css";
import ventasStyles from "./ventas.module.css";
import { Pill } from "../Pill";

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
      vehiculo: { select: { marca: true, modelo: true } },
      vendedor: { select: { nombre: true } },
    },
    orderBy: { fecha: "desc" },
  });

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
        {ventas.length === 0 ? (
          <p className={ventasStyles.empty}>
            Todavía no hay ventas registradas. Marcá un vehículo como &quot;Vendido&quot; en Stock.
          </p>
        ) : (
          <div className={ventasStyles.tableWrap}>
            <table className={ventasStyles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Vehículo</th>
                  {rol !== "VENDEDOR" && <th>Vendedor</th>}
                  <th>Precio final</th>
                  <th>Comisión</th>
                  <th>Cobro</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id}>
                    <td>{v.fecha.toLocaleDateString("es-AR")}</td>
                    <td>
                      {v.vehiculo.marca} {v.vehiculo.modelo}
                    </td>
                    {rol !== "VENDEDOR" && <td>{v.vendedor.nombre}</td>}
                    <td className={ventasStyles.num}>USD {Number(v.precioFinal).toLocaleString("es-AR")}</td>
                    <td className={ventasStyles.num}>USD {Number(v.comision).toLocaleString("es-AR")}</td>
                    <td>
                      <Pill color={v.estadoCobro === "COBRADO" ? "green" : "amber"}>
                        {v.estadoCobro === "COBRADO" ? "Cobrado" : "Pendiente"}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
