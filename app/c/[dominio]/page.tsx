import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "../PublicHeader";
import { ChatWidget } from "../ChatWidget";
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
        include: { sucursal: { select: { nombre: true } } },
      },
      sucursales: {
        select: { id: true, nombre: true, direccion: true, telefono: true },
        orderBy: { createdAt: "asc" },
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
    fotos: v.fotos,
    transmision: v.transmision,
    combustible: v.motor,
    sucursal: v.sucursal.nombre,
  }));

  const vitrina = {
    unidades: items.length,
    desde: items.length > 0 ? Math.min(...items.map((v) => v.precioUsd)) : 0,
    marcas: new Set(items.map((v) => v.marca)).size,
    menosKm: items.length > 0 ? Math.min(...items.map((v) => v.km)) : 0,
  };

  const primerTelefono = tenant.sucursales.find((s) => s.telefono)?.telefono ?? null;

  return (
    <div className={styles.page}>
      <PublicHeader
        nombre={tenant.nombre}
        sucursalesCount={tenant.sucursales.length}
        telefono={primerTelefono}
      />

      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={`${styles.wrap} ${styles.heroInner}`}>
          <div className={styles.heroRow}>
            <div className={styles.heroText}>
              <h1>
                Las unidades de <span className={styles.heroName}>{tenant.nombre}</span>
              </h1>
              <p>
                Stock disponible en tiempo real, con precio, kilometraje y sucursal de cada
                unidad. Consultá por la que te interese y te respondemos el mismo día.
              </p>
            </div>

            <div className={styles.vitrina}>
              <div className={styles.vitrinaHead}>
                <span className={styles.vitrinaDot} />
                <span className={styles.vitrinaLabel}>STOCK EN VIVO</span>
              </div>
              <div className={styles.vitrinaGrid}>
                <div className={styles.vitrinaItem}>
                  <div className={styles.vitrinaItemLabel}>UNIDADES</div>
                  <div className={styles.vitrinaItemValue}>{vitrina.unidades}</div>
                  <div className={styles.vitrinaItemUnit}>publicadas</div>
                </div>
                <div className={styles.vitrinaItem}>
                  <div className={styles.vitrinaItemLabel}>DESDE</div>
                  <div className={styles.vitrinaItemValue}>
                    {(vitrina.desde / 1000).toFixed(1).replace(".", ",")}k
                  </div>
                  <div className={styles.vitrinaItemUnit}>USD</div>
                </div>
                <div className={styles.vitrinaItem}>
                  <div className={styles.vitrinaItemLabel}>MARCAS</div>
                  <div className={styles.vitrinaItemValue}>{vitrina.marcas}</div>
                  <div className={styles.vitrinaItemUnit}>disponibles</div>
                </div>
                <div className={styles.vitrinaItem}>
                  <div className={styles.vitrinaItemLabel}>MENOS KM</div>
                  <div className={styles.vitrinaItemValue}>
                    {vitrina.menosKm.toLocaleString("es-AR")}
                  </div>
                  <div className={styles.vitrinaItemUnit}>km</div>
                </div>
              </div>
            </div>
          </div>

          <CatalogoView items={items} dominio={dominio} />
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerGrid}`}>
          <div className={styles.footerAbout}>
            <div className={styles.footerBrand}>
              <div className={styles.footerMark}>{tenant.nombre.charAt(0).toUpperCase()}</div>
              <div className={styles.footerName}>{tenant.nombre}</div>
            </div>
            <p>Concesionaria multimarca. Compra, venta y permuta de usados seleccionados.</p>
          </div>
          {tenant.sucursales.map((s, i) => (
            <div key={s.id} className={styles.footerSucursal}>
              <div className={styles.footerSucursalHead}>
                <span
                  className={styles.footerSucursalDot}
                  style={{ background: i === 0 ? "var(--accent)" : "var(--info)" }}
                />
                <div className={styles.footerSucursalNombre}>{s.nombre}</div>
              </div>
              <div className={styles.footerSucursalLine}>
                {s.direccion || "Dirección a confirmar"}
              </div>
              {s.telefono && <div className={styles.footerSucursalLine}>{s.telefono}</div>}
            </div>
          ))}
        </div>
        <div className={styles.wrap}>
          <div className={styles.footerBottom}>
            <span>Los precios están expresados en dólares y se actualizan a diario.</span>
            <span className={styles.footerPowered}>
              Catálogo con tecnología <strong>Rodado</strong>
            </span>
          </div>
        </div>
      </footer>

      <ChatWidget dominio={dominio} nombreAgencia={tenant.nombre} />
    </div>
  );
}
