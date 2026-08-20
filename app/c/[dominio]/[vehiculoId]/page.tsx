import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CarSVG } from "../../CarSVG";
import { PublicHeader } from "../../PublicHeader";
import { ContactForm } from "./ContactForm";
import styles from "../../public.module.css";

const estadoLabel: Record<string, string> = {
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
  VENDIDO: "Vendido",
};

export default async function VehiculoDetalle({
  params,
}: {
  params: { dominio: string; vehiculoId: string };
}) {
  const { dominio, vehiculoId } = params;

  const tenant = await prisma.tenant.findUnique({ where: { dominio } });
  if (!tenant) notFound();

  const vehiculo = await prisma.vehiculo.findUnique({ where: { id: vehiculoId } });
  if (!vehiculo || vehiculo.tenantId !== tenant.id) notFound();

  const vendido = vehiculo.estado === "VENDIDO";

  return (
    <div className={styles.page}>
      <PublicHeader nombre={tenant.nombre} />

      <div className={`${styles.wrap} ${styles.detail}`}>
        <Link href={`/c/${dominio}`} className={styles.backBtn}>
          ← Volver al catálogo
        </Link>

        <div className={styles.detailGrid}>
          <div>
            <div className={styles.galleryMain}>
              <CarSVG />
            </div>

            <span className={`${styles.detailBadge} ${styles[vehiculo.estado.toLowerCase()]}`}>
              {estadoLabel[vehiculo.estado]}
            </span>
            <div className={`${styles.detailTitle} disp`}>
              {vehiculo.marca} {vehiculo.modelo}
            </div>

            <div className={styles.specGrid}>
              <div className={styles.specItem}>
                <div className={styles.l}>Año</div>
                <div className={styles.v}>{vehiculo.anio}</div>
              </div>
              <div className={styles.specItem}>
                <div className={styles.l}>Kilometraje</div>
                <div className={styles.v}>{vehiculo.km.toLocaleString("es-AR")} km</div>
              </div>
              <div className={styles.specItem}>
                <div className={styles.l}>Transmisión</div>
                <div className={styles.v}>{vehiculo.transmision ?? "—"}</div>
              </div>
              <div className={styles.specItem}>
                <div className={styles.l}>Motor</div>
                <div className={styles.v}>{vehiculo.motor ?? "—"}</div>
              </div>
            </div>
          </div>

          <div>
            <div className={styles.sideCard}>
              <div className={styles.sidePrice}>
                <span className="disp">USD {Number(vehiculo.precioUsd).toLocaleString("es-AR")}</span>
                <small>Precio de contado, financiación disponible</small>
              </div>

              {vendido ? (
                <p className={styles.soldNotice}>
                  Este vehículo ya fue vendido. Mirá el resto del{" "}
                  <Link href={`/c/${dominio}`}>catálogo disponible</Link>.
                </p>
              ) : (
                <ContactForm dominio={dominio} vehiculoId={vehiculo.id} />
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <p>Catálogo de {tenant.nombre} — powered by Rodado</p>
        </div>
      </footer>
    </div>
  );
}
