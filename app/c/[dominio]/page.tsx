import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "../PublicHeader";
import { CatalogoView, type VehiculoCatalogoDTO } from "./CatalogoView";
import styles from "../public.module.css";

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

  const items: VehiculoCatalogoDTO[] = tenant.vehiculos.map((v) => ({
    id: v.id,
    marca: v.marca,
    modelo: v.modelo,
    anio: v.anio,
    km: v.km,
    precioUsd: Number(v.precioUsd),
    estado: v.estado as "DISPONIBLE" | "RESERVADO",
  }));

  return (
    <div className={styles.page}>
      <PublicHeader nombre={tenant.nombre} />

      <div className={styles.wrap}>
        <div className={styles.heroStrip}>
          <h1 className="disp">Vehículos disponibles</h1>
          <p>
            {items.length} unidad{items.length === 1 ? "" : "es"} en stock · precios en USD
          </p>
        </div>

        <CatalogoView items={items} dominio={dominio} />
      </div>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <p>Catálogo de {tenant.nombre} — powered by Rodado</p>
        </div>
      </footer>
    </div>
  );
}
