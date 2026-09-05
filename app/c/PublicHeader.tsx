import Image from "next/image";
import styles from "./public.module.css";
import { WhatsAppGlyph } from "../icons/WhatsAppGlyph";
import { AgencyMark } from "../AgencyMark";

function whatsappUrl(telefono: string) {
  const digits = telefono.replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits.startsWith("54") ? digits : `54${digits}`}`;
}

export function PublicHeader({
  nombre,
  sucursalesCount,
  telefono,
  logoUrl,
}: {
  nombre: string;
  sucursalesCount: number;
  telefono: string | null;
  logoUrl?: string | null;
}) {
  const wa = telefono ? whatsappUrl(telefono) : null;

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
                rel="noreferrer"
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
