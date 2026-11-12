import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/url";
import styles from "../panel.module.css";
import { CatalogoPanelView, type Pestania } from "./CatalogoPanelView";

// ?pestania=personalizacion abre esa pestaña directo (links desde otras
// secciones del panel).
function pestaniaDeQuery(v: string | string[] | undefined): Pestania {
  return v === "personalizacion" ? "personalizacion" : "general";
}

export default async function CatalogoPanelPage(props: {
  searchParams: Promise<{ pestania?: string | string[] }>;
}) {
  const { pestania } = await props.searchParams;
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
      whatsapp: true,
      colorAcento: true,
      portadaUrl: true,
      plan: { select: { catalogoPersonalizado: true, limiteDestacados: true } },
      sucursales: {
        select: { id: true, nombre: true, direccion: true, telefono: true, horarios: true },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          vehiculos: { where: { destacadoEn: { not: null }, estado: { not: "VENDIDO" } } },
        },
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
            whatsapp: tenant?.whatsapp ?? null,
            sucursales: tenant?.sucursales ?? [],
          }}
          personalizacion={{
            habilitada: tenant?.plan.catalogoPersonalizado ?? false,
            colorAcento: tenant?.colorAcento ?? null,
            portadaUrl: tenant?.portadaUrl ?? null,
            limiteDestacados: tenant?.plan.limiteDestacados ?? 0,
            destacadosMarcados: tenant?._count.vehiculos ?? 0,
          }}
          pestaniaInicial={pestaniaDeQuery(pestania)}
        />
      </div>
    </>
  );
}
