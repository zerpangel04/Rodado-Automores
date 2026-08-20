import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import styles from "./catalogo.module.css";

export default async function CatalogoPublico({
  params,
}: {
  params: { dominio: string };
}) {
  const { dominio } = params;

  const tenant = await prisma.tenant.findUnique({
    where: { dominio },
    include: {
      vehiculos: {
        where: { estado: { not: "VENDIDO" } },
        orderBy: { fechaIngreso: "desc" },
      },
    },
  });

  if (!tenant) notFound();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logoMark} />
          <span className="disp">{tenant.nombre}</span>
        </div>
        <span className={styles.count}>
          {tenant.vehiculos.length} vehículo{tenant.vehiculos.length === 1 ? "" : "s"} disponible
          {tenant.vehiculos.length === 1 ? "" : "s"}
        </span>
      </header>

      <main className={styles.main}>
        {tenant.vehiculos.length === 0 ? (
          <p className={styles.empty}>Todavía no hay vehículos publicados.</p>
        ) : (
          <div className={styles.grid}>
            {tenant.vehiculos.map((v) => (
              <div className={styles.card} key={v.id}>
                <div className={styles.photo}>
                  {v.estado === "RESERVADO" && (
                    <span className={styles.reservado}>Reservado</span>
                  )}
                </div>
                <div className={styles.body}>
                  <div className={`${styles.title} disp`}>
                    {v.marca} {v.modelo}
                  </div>
                  <div className={`${styles.meta} mono`}>
                    {v.anio} · {v.km.toLocaleString("es-AR")} km
                  </div>
                  <div className={`${styles.price} disp`}>
                    USD {Number(v.precioUsd).toLocaleString("es-AR")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
