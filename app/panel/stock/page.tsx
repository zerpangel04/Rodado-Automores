import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSucursalActual } from "@/lib/sucursalFiltro";
import { StockView, type VehiculoDTO, type LeadActivoDTO } from "./StockView";
import styles from "../panel.module.css";

export default async function StockPage() {
  const session = await auth();
  const { tenantId, id: userId, rol } = session!.user;

  const sucursalActual = await getSucursalActual(tenantId);

  const [vehiculos, usuarios, sucursales, leadsActivos] = await Promise.all([
    prisma.vehiculo.findMany({
      where: {
        tenantId,
        ...(sucursalActual ? { sucursalId: sucursalActual.id } : {}),
      },
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
    // Leads en cualquier etapa activa (todo menos Cerrado) vinculados a un
    // vehículo — sirve tanto para el badge "N interesados" en cada tarjeta
    // como para la alerta al marcar un vehículo como vendido.
    prisma.lead.findMany({
      where: {
        tenantId,
        vehiculoId: { not: null },
        etapa: { not: "CERRADO" },
        ...(sucursalActual ? { vehiculo: { sucursalId: sucursalActual.id } } : {}),
      },
      select: { id: true, nombreCliente: true, contacto: true, etapa: true, vehiculoId: true },
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

  const leadsActivosItems: LeadActivoDTO[] = leadsActivos
    .filter((l): l is typeof l & { vehiculoId: string } => l.vehiculoId !== null)
    .map((l) => ({
      id: l.id,
      nombreCliente: l.nombreCliente,
      contacto: l.contacto,
      etapa: l.etapa,
      vehiculoId: l.vehiculoId,
    }));

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Stock</h1>
          <div className={styles.topbarSub}>
            Tu inventario de vehículos{sucursalActual ? ` · ${sucursalActual.nombre}` : ""}
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <StockView
          initialItems={items}
          usuarios={usuarios}
          sucursales={sucursales}
          defaultSucursalId={sucursalActual?.id ?? sucursales[0]?.id ?? ""}
          userId={userId}
          canRevertirVenta={rol !== "VENDEDOR"}
          leadsActivos={leadsActivosItems}
        />
      </div>
    </>
  );
}
