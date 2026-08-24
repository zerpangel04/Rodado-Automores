import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StockView, type VehiculoDTO } from "./StockView";
import styles from "../panel.module.css";

export default async function StockPage() {
  const session = await auth();
  const { tenantId, id: userId, rol } = session!.user;

  const [vehiculos, usuarios, sucursales] = await Promise.all([
    prisma.vehiculo.findMany({
      where: { tenantId },
      orderBy: { fechaIngreso: "desc" },
    }),
    prisma.usuario.findMany({
      where: { tenantId },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.sucursal.findMany({
      where: { tenantId },
      select: { id: true, nombre: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const items: VehiculoDTO[] = vehiculos.map((v) => ({
    id: v.id,
    sucursalId: v.sucursalId,
    marca: v.marca,
    modelo: v.modelo,
    anio: v.anio,
    km: v.km,
    precioUsd: Number(v.precioUsd),
    estado: v.estado,
    categoria: v.categoria,
    transmision: v.transmision,
    motor: v.motor,
    docTitulo: v.docTitulo,
    docCedula: v.docCedula,
    docDominio: v.docDominio,
    docLibreDeuda: v.docLibreDeuda,
    vtvVencimiento: v.vtvVencimiento ? v.vtvVencimiento.toISOString().slice(0, 10) : null,
    fotos: v.fotos,
    mlItemId: v.mlItemId,
    mlPermalink: v.mlPermalink,
    mlStatus: v.mlStatus,
    mlLastError: v.mlLastError,
  }));

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Stock</h1>
          <div className={styles.topbarSub}>Tu inventario de vehículos</div>
        </div>
      </div>
      <div className={styles.content}>
        <StockView
          initialItems={items}
          usuarios={usuarios}
          sucursales={sucursales}
          userId={userId}
          canRevertirVenta={rol !== "VENDEDOR"}
        />
      </div>
    </>
  );
}
