import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSucursalActual } from "@/lib/sucursalFiltro";
import { KanbanView, type LeadDTO } from "./KanbanView";
import styles from "../panel.module.css";

export default async function LeadsPage() {
  const session = await auth();
  const { tenantId, id: userId, rol } = session!.user;

  const sucursalActual = await getSucursalActual(tenantId);

  const [leads, vehiculos, usuarios] = await Promise.all([
    prisma.lead.findMany({
      where: {
        tenantId,
        ...(rol === "VENDEDOR" ? { vendedorId: userId } : {}),
        ...(sucursalActual ? { vehiculo: { sucursalId: sucursalActual.id } } : {}),
      },
      include: {
        vehiculo: { select: { marca: true, modelo: true } },
        vendedor: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehiculo.findMany({
      where: {
        tenantId,
        estado: { not: "VENDIDO" },
        ...(sucursalActual ? { sucursalId: sucursalActual.id } : {}),
      },
      select: { id: true, marca: true, modelo: true },
      orderBy: { fechaIngreso: "desc" },
    }),
    rol === "VENDEDOR"
      ? Promise.resolve([])
      : prisma.usuario.findMany({
          where: { tenantId },
          select: { id: true, nombre: true },
          orderBy: { nombre: "asc" },
        }),
  ]);

  const items: LeadDTO[] = leads.map((l) => ({
    id: l.id,
    nombreCliente: l.nombreCliente,
    contacto: l.contacto,
    mensaje: l.mensaje,
    canal: l.canal,
    etapa: l.etapa,
    vehiculo: l.vehiculo,
    vendedor: l.vendedor,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Leads</h1>
          <div className={styles.topbarSub}>
            {rol === "VENDEDOR" ? "Tus leads asignados" : "Avanzá cada lead por su etapa"}
            {sucursalActual ? ` · ${sucursalActual.nombre}` : ""}
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <KanbanView
          initialItems={items}
          vehiculos={vehiculos}
          usuarios={usuarios}
          canAsignar={rol !== "VENDEDOR"}
          userId={userId}
        />
      </div>
    </>
  );
}
