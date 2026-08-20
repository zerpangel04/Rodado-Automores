import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KanbanView, type LeadDTO } from "./KanbanView";
import styles from "../panel.module.css";

export default async function LeadsPage() {
  const session = await auth();
  const { tenantId, id: userId, rol } = session!.user;

  const [leads, vehiculos, usuarios] = await Promise.all([
    prisma.lead.findMany({
      where: {
        tenantId,
        ...(rol === "VENDEDOR" ? { vendedorId: userId } : {}),
      },
      include: {
        vehiculo: { select: { marca: true, modelo: true } },
        vendedor: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehiculo.findMany({
      where: { tenantId, estado: { not: "VENDIDO" } },
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
    canal: l.canal,
    etapa: l.etapa,
    vehiculo: l.vehiculo,
    vendedor: l.vendedor,
  }));

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Leads</h1>
          <div className={styles.topbarSub}>
            {rol === "VENDEDOR" ? "Tus leads asignados" : "Avanzá cada lead por su etapa"}
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
