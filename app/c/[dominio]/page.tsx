import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "../PublicHeader";
import { ChatWidget } from "../ChatWidget";
import { AskAssistantChips } from "../AskAssistantChips";
import { SucursalMapa } from "../SucursalMapa";
import { WhatsAppFlotante } from "../WhatsAppFlotante";
import { urlWhatsapp, whatsappDelCatalogo } from "@/lib/whatsapp";
import { acentoVigente } from "@/lib/colorAcento";
import { estiloAcento } from "../estiloAcento";
import { CatalogoView, type VehiculoCatalogoDTO } from "./CatalogoView";
import { textoAniosEnMercado } from "@/lib/catalogo";
import { idsDestacadosVigentes } from "@/lib/destacados";
import { cotizacionVista, getCotizacion } from "@/lib/cotizacion";
import { formatearCompacto, masBarato, textoMonedas } from "@/lib/moneda";
import styles from "../public.module.css";

export default async function CatalogoPublico(
  props: {
    params: Promise<{ dominio: string }>;
  }
) {
  const params = await props.params;
  const { dominio } = params;
  // Las dos cotizaciones arrancan en paralelo con la consulta de la agencia
  // (no suman demora) y después se usa la que eligió la agencia. Están en
  // la caché de datos de Next, así que pedir las dos no cuesta más.
  const cotizacionesPendientes = { OFICIAL: getCotizacion("OFICIAL"), BLUE: getCotizacion("BLUE") };

  const tenant = await prisma.tenant.findUnique({
    where: { dominio },
    include: {
      vehiculos: {
        where: { estado: { not: "VENDIDO" } },
        orderBy: { fechaIngreso: "desc" },
        include: { sucursal: { select: { nombre: true } } },
      },
      sucursales: {
        select: { id: true, nombre: true, direccion: true, telefono: true, horarios: true },
        orderBy: { createdAt: "asc" },
      },
      plan: { select: { catalogoPersonalizado: true, limiteDestacados: true } },
    },
  });

  if (!tenant) notFound();

  // Orden por defecto ("más nuevos"): primero los destacados vigentes en el
  // orden en que se marcaron, después el resto por fecha de ingreso. Los
  // demás órdenes del catálogo (precio, km) los ignoran.
  const destacados = idsDestacadosVigentes(tenant.vehiculos, tenant.plan.limiteDestacados);
  const vehiculosOrdenados = [
    ...tenant.vehiculos
      .filter((v) => destacados.has(v.id))
      .sort((a, b) => a.destacadoEn!.getTime() - b.destacadoEn!.getTime()),
    ...tenant.vehiculos.filter((v) => !destacados.has(v.id)),
  ];

  const items: VehiculoCatalogoDTO[] = vehiculosOrdenados.map((v) => ({
    id: v.id,
    marca: v.marca,
    modelo: v.modelo,
    anio: v.anio,
    km: v.km,
    precio: Number(v.precio),
    moneda: v.moneda,
    estado: v.estado as "DISPONIBLE" | "RESERVADO",
    fotos: v.fotos,
    transmision: v.transmision,
    combustible: v.motor,
    sucursal: v.sucursal.nombre,
    destacado: destacados.has(v.id),
  }));

  const cotizacion = await cotizacionesPendientes[tenant.cotizacionPreferida];

  // "Desde": el más barato comparando en USD, mostrado en su propia moneda.
  const desde = masBarato(items, cotizacion?.venta);
  const vitrina = {
    unidades: items.length,
    desde,
    marcas: new Set(items.map((v) => v.marca)).size,
    menosKm: items.length > 0 ? Math.min(...items.map((v) => v.km)) : 0,
  };
  const monedasTexto = textoMonedas(items.map((v) => v.moneda));

  const aniosEnMercado = textoAniosEnMercado(tenant.anioInicio);
  const mostrarSobreNosotros = Boolean(tenant.sobreNosotros || aniosEnMercado);

  const primerTelefono = tenant.sucursales.find((s) => s.telefono)?.telefono ?? null;
  const numeroWhatsapp = whatsappDelCatalogo(
    tenant.whatsapp,
    tenant.sucursales.map((s) => s.telefono)
  );
  const whatsappHref = numeroWhatsapp
    ? urlWhatsapp(numeroWhatsapp, `Hola, vi el catálogo de ${tenant.nombre} y quería hacer una consulta.`)
    : null;

  const acento = acentoVigente(tenant.colorAcento, tenant.plan);
  // Si bajan de plan, la portada queda guardada pero no se muestra.
  const portada = tenant.plan.catalogoPersonalizado ? tenant.portadaUrl : null;

  return (
    <div className={styles.page} style={acento ? estiloAcento(acento) : undefined}>
      <PublicHeader
        nombre={tenant.nombre}
        sucursalesCount={tenant.sucursales.length}
        telefono={primerTelefono}
        whatsappHref={whatsappHref}
        logoUrl={tenant.logoUrl}
      />

      <section className={styles.hero}>
        {portada && (
          <div className={styles.heroPortada} aria-hidden="true">
            <Image
              src={portada}
              alt=""
              fill
              priority
              sizes="100vw"
              className={styles.heroPortadaImg}
            />
            <div className={styles.heroPortadaVelo} />
          </div>
        )}
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
                    {formatearCompacto(vitrina.desde?.precio ?? 0)}
                  </div>
                  <div className={styles.vitrinaItemUnit}>
                    {vitrina.desde?.moneda === "ARS" ? "pesos" : "USD"}
                  </div>
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
              <AskAssistantChips />
            </div>
          </div>

          <CatalogoView
            items={items}
            dominio={dominio}
            cotizacion={cotizacionVista(cotizacion)}
          />
        </div>
      </section>

      {mostrarSobreNosotros && (
        <section className={styles.sobre} aria-labelledby="sobre-nosotros">
          <div className={styles.wrap}>
            <div className={styles.sobreTexto}>
              <span className={styles.sobreEyebrow}>SOBRE NOSOTROS</span>
              <h2 id="sobre-nosotros" className={styles.sobreTitulo}>
                {tenant.nombre}
              </h2>
              {aniosEnMercado && <span className={styles.sobreAnios}>{aniosEnMercado}</span>}
              {tenant.sobreNosotros && <p>{tenant.sobreNosotros}</p>}
            </div>
          </div>
        </section>
      )}

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
              {s.horarios && <div className={styles.footerSucursalLine}>{s.horarios}</div>}
              {s.telefono && <div className={styles.footerSucursalLine}>{s.telefono}</div>}
              {tenant.mostrarMapa && s.direccion && (
                <SucursalMapa nombre={s.nombre} direccion={s.direccion} />
              )}
            </div>
          ))}
        </div>
        <div className={styles.wrap}>
          <div className={styles.footerBottom}>
            <span>Los precios están expresados {monedasTexto}. Se actualizan a diario.</span>
            <span className={styles.footerPowered}>
              Catálogo con tecnología <strong>Rodado</strong>
            </span>
          </div>
        </div>
      </footer>

      {whatsappHref && <WhatsAppFlotante href={whatsappHref} />}
      <ChatWidget dominio={dominio} nombreAgencia={tenant.nombre} />
    </div>
  );
}
