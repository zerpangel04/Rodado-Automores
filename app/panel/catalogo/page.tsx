import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/url";
import styles from "../panel.module.css";
import { CatalogoPanelView } from "./CatalogoPanelView";

export default async function CatalogoPanelPage() {
  const session = await auth();
  const { tenantId, rol } = session!.user;

  if (rol !== "DUENIO") {
    return (
      <>
        <div className={styles.topbar}>
          <div>
            <h1 className="disp">Catálogo</h1>
          </div>
        </div>
        <div className={styles.content}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Solo el dueño de la agencia puede gestionar el catálogo.
          </p>
        </div>
      </>
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      dominio: true,
      sobreNosotros: true,
      anioInicio: true,
      mostrarMapa: true,
      sucursales: {
        select: { id: true, nombre: true, direccion: true, horarios: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  const baseUrl = getBaseUrl(await headers());
  const catalogUrl = tenant?.dominio ? `${baseUrl}/c/${tenant.dominio}` : null;

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Catálogo</h1>
          <div className={styles.topbarSub}>Lo que ven tus clientes en tu catálogo público</div>
        </div>
      </div>
      <div className={styles.content}>
        <CatalogoPanelView
          catalogUrl={catalogUrl}
          general={{
            sobreNosotros: tenant?.sobreNosotros ?? null,
            anioInicio: tenant?.anioInicio ?? null,
            mostrarMapa: tenant?.mostrarMapa ?? true,
            sucursales: tenant?.sucursales ?? [],
          }}
        />
      </div>
    </>
  );
}
