import Image from "next/image";
import styles from "./public.module.css";
import { WhatsAppGlyph } from "../icons/WhatsAppGlyph";
import { AgencyMark } from "../AgencyMark";

// whatsappHref llega ya armado (lib/whatsapp.ts), con el 9 de celular y el
// mensaje que corresponda a la página.
export function PublicHeader({
  nombre,
  sucursalesCount,
  telefono,
  whatsappHref,
  logoUrl,
}: {
  nombre: string;
  sucursalesCount: number;
  telefono: string | null;
  whatsappHref: string | null;
  logoUrl?: string | null;
}) {
  const wa = whatsappHref;

  return (
    <header className={styles.header}>
      <div className={`${styles.wrap} ${styles.headerInner}`}>
        <div className={styles.agency}>
          <AgencyMark nombre={nombre} logoUrl={logoUrl} className={styles.agencyMark} />
          <div>
            <div className={styles.agencyName}>{nombre}</div>
            <div className={styles.agencySub}>
              <span className={styles.agencyDot} />
              Stock actualizado hoy
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.poweredBy}>
            <div className={styles.poweredByMark}>
              <Image src="/logo-icono.png" alt="" width={18} height={18} aria-hidden="true" unoptimized />
            </div>
            Con Rodado
          </div>
          {sucursalesCount > 0 && (
            <div className={styles.headerInfo}>
              {sucursalesCount} {sucursalesCount === 1 ? "sucursal" : "sucursales"}
            </div>
          )}
          <div className={styles.headerActions}>
            {telefono && <div className={styles.headerPhone}>{telefono}</div>}
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.headerWa}
                aria-label="Escribinos por WhatsApp"
                title="WhatsApp"
              >
                <WhatsAppGlyph />
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
