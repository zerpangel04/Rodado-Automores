import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "../../PublicHeader";
import { PhotoGallery } from "../../PhotoGallery";
import { ChatWidget } from "../../ChatWidget";
import { ContactForm } from "./ContactForm";
import { WhatsAppFlotante } from "../../WhatsAppFlotante";
import { urlWhatsapp, whatsappDelCatalogo } from "@/lib/whatsapp";
import { getBaseUrl } from "@/lib/url";
import { acentoVigente } from "@/lib/colorAcento";
import { estiloAcento } from "../../estiloAcento";
import { fechaCotizacionCorta, getCotizacionOficial } from "@/lib/cotizacion";
import styles from "../../public.module.css";

const estadoLabel: Record<string, string> = {
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
  VENDIDO: "Vendido",
};

function cuotaEstimada(precio: number) {
  return Math.round(precio * 0.0208);
}

function mapsUrl(direccion: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
}

export default async function VehiculoDetalle(
  props: {
    params: Promise<{ dominio: string; vehiculoId: string }>;
  }
) {
  const params = await props.params;
  const { dominio, vehiculoId } = params;

  const [tenant, vehiculo, cotizacion] = await Promise.all([
    prisma.tenant.findUnique({
      where: { dominio },
      include: {
        sucursales: { select: { id: true, nombre: true, direccion: true, telefono: true } },
        plan: { select: { catalogoPersonalizado: true } },
      },
    }),
    prisma.vehiculo.findUnique({
      where: { id: vehiculoId },
      include: { sucursal: { select: { nombre: true, direccion: true } } },
    }),
    getCotizacionOficial(),
  ]);
  if (!tenant) notFound();
  if (!vehiculo || vehiculo.tenantId !== tenant.id) notFound();

  const vendido = vehiculo.estado === "VENDIDO";
  const mostrarSucursal = tenant.sucursales.length > 1;
  const precio = Number(vehiculo.precio);

  const docs = [
    { label: "Título del automotor", ok: vehiculo.docTitulo },
    { label: "Cédula verde", ok: vehiculo.docCedula },
    { label: "Informe de dominio", ok: vehiculo.docDominio },
    { label: "Libre de deuda de patentes e infracciones", ok: vehiculo.docLibreDeuda },
  ];
  const hayDocsCargados = docs.some((d) => d.ok);

  // El mensaje nombra el auto y trae el link, así el vendedor sabe por cuál
  // escriben sin tener que preguntar.
  const numeroWhatsapp = whatsappDelCatalogo(
    tenant.whatsapp,
    tenant.sucursales.map((s) => s.telefono)
  );
  const acento = acentoVigente(tenant.colorAcento, tenant.plan);
  const linkVehiculo = `${getBaseUrl(await headers())}/c/${dominio}/${vehiculo.id}`;
  const whatsappHref = numeroWhatsapp
    ? urlWhatsapp(
        numeroWhatsapp,
        `Hola, me interesa el ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio} que vi en su catálogo: ${linkVehiculo}`
      )
    : null;

  return (
    <div className={styles.page} style={acento ? estiloAcento(acento) : undefined}>
      <PublicHeader
        nombre={tenant.nombre}
        sucursalesCount={tenant.sucursales.length}
        telefono={tenant.sucursales.find((s) => s.telefono)?.telefono ?? null}
        whatsappHref={whatsappHref}
        logoUrl={tenant.logoUrl}
      />

      <div className={`${styles.wrap} ${styles.detail}`}>
        <Link href={`/c/${dominio}`} className={styles.backBtn}>
          ← Volver al catálogo
        </Link>

        <div className={styles.detailGrid}>
          <div>
            <PhotoGallery fotos={vehiculo.fotos} />

            <div className={styles.detailHeadRow}>
              <div className={`${styles.detailTitle}`}>
                {vehiculo.marca} {vehiculo.modelo}
              </div>
              {vehiculo.estado !== "DISPONIBLE" && (
                <span className={`${styles.detailBadge} ${styles[vehiculo.estado.toLowerCase()]}`}>
                  {estadoLabel[vehiculo.estado]}
                </span>
              )}
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
              {vehiculo.categoria && (
                <div className={styles.specItem}>
                  <div className={styles.l}>Categoría</div>
                  <div className={styles.v}>{vehiculo.categoria}</div>
                </div>
              )}
              {mostrarSucursal && (
                <div className={styles.specItem}>
                  <div className={styles.l}>Ubicación</div>
                  <div className={styles.v}>{vehiculo.sucursal.nombre}</div>
                </div>
              )}
            </div>

            {hayDocsCargados && (
              <div className={styles.docsBox}>
                <div className={styles.docsLabel}>DOCUMENTACIÓN</div>
                {docs
                  .filter((d) => d.ok)
                  .map((d) => (
                    <div key={d.label} className={styles.docsItem}>
                      <span className={styles.docsCheck}>✓</span>
                      {d.label}
                    </div>
                  ))}
              </div>
            )}

            {vehiculo.sucursal.direccion && (
              <div className={styles.locationBox}>
                <span className={styles.locationIcon}>
                  <MapPin size={14} />
                </span>
                <div className={styles.locationText}>
                  <div className={styles.locationNombre}>{vehiculo.sucursal.nombre}</div>
                  <div className={styles.locationDireccion}>{vehiculo.sucursal.direccion}</div>
                </div>
                <a
                  href={mapsUrl(vehiculo.sucursal.direccion)}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.locationLink}
                >
                  Cómo llegar
                </a>
              </div>
            )}
          </div>

          <div>
            <div className={styles.sideCard}>
              <div className={styles.sidePrice}>
                <span>USD {precio.toLocaleString("es-AR")}</span>
                {cotizacion && (
                  <small>
                    ≈ ${Math.round(precio * cotizacion.venta).toLocaleString("es-AR")} · dólar oficial del{" "}
                    {fechaCotizacionCorta(cotizacion.fecha)}
                  </small>
                )}
              </div>
              {!vendido && (
                <div className={styles.sideCuota}>
                  Cuotas desde USD {cuotaEstimada(precio).toLocaleString("es-AR")}/mes · aceptamos tu
                  usado en parte de pago
                </div>
              )}

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
          <div className={styles.footerBottom}>
            <span>Catálogo de {tenant.nombre} — powered by Rodado</span>
          </div>
        </div>
      </footer>

      {whatsappHref && <WhatsAppFlotante href={whatsappHref} />}
      <ChatWidget dominio={dominio} nombreAgencia={tenant.nombre} vehiculoId={vehiculo.id} />
    </div>
  );
}
