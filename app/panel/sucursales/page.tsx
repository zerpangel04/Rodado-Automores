import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SucursalesView, type SucursalDTO } from "./SucursalesView";
import styles from "../panel.module.css";

export default async function SucursalesPage() {
  const session = await auth();
  const { tenantId, rol } = session!.user;

  if (rol !== "DUENIO") {
    return (
      <>
        <div className={styles.topbar}>
          <div>
            <h1 className="disp">Sucursales</h1>
          </div>
        </div>
        <div className={styles.content}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Solo el dueño de la agencia puede gestionar las sucursales.
          </p>
        </div>
      </>
    );
  }

  const sucursales = await prisma.sucursal.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { vehiculos: true } } },
  });

  const items: SucursalDTO[] = sucursales.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    direccion: s.direccion,
    telefono: s.telefono,
    vehiculosCount: s._count.vehiculos,
  }));

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Sucursales</h1>
          <div className={styles.topbarSub}>
            Locales físicos de tu agencia y su stock asignado
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <SucursalesView initialItems={items} />
      </div>
    </>
  );
}
