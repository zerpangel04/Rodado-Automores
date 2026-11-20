import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSucursalActual } from "@/lib/sucursalFiltro";
import { getPlanTenant } from "@/lib/planes";
import { fechaCotizacionCorta, getCotizacion } from "@/lib/cotizacion";
import { formatearTotales, sumarPorMoneda } from "@/lib/moneda";
import { StockView, type VehiculoDTO, type LeadActivoDTO } from "./StockView";
import styles from "../panel.module.css";

export default async function StockPage(props: { searchParams: Promise<{ nuevo?: string }> }) {
  const { nuevo } = await props.searchParams;
  const session = await auth();
  const { tenantId, id: userId, rol } = session!.user;

  const sucursalActual = await getSucursalActual(tenantId);

  const [vehiculos, usuarios, sucursales, leadsActivos, plan, marcados, tenant] = await Promise.all([
    prisma.vehiculo.findMany({
      where: {
        tenantId,
        ...(sucursalActual ? { sucursalId: sucursalActual.id } : {}),
      },
      orderBy: { fechaIngreso: "desc" },
    }),
    prisma.usuario.findMany({
      where: { tenantId },
      select: { id: true, nombre: true, comisionPct: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.sucursal.findMany({
      where: { tenantId },
      select: { id: true, nombre: true },
      orderBy: { createdAt: "asc" },
    }),
    // Leads en cualquier etapa activa (todo menos Cerrado) vinculados a un
    // vehículo — sirve tanto para el badge "N interesados" en cada tarjeta
    // como para la alerta al marcar un vehículo como vendido.
    prisma.lead.findMany({
      where: {
        tenantId,
        vehiculoId: { not: null },
        etapa: { not: "CERRADO" },
        ...(sucursalActual ? { vehiculo: { sucursalId: sucursalActual.id } } : {}),
      },
      select: { id: true, nombreCliente: true, contacto: true, etapa: true, vehiculoId: true },
    }),
    getPlanTenant(tenantId),
    // Destacados de todo el tenant (no solo la sucursal elegida): el límite
    // del plan es por agencia.
    prisma.vehiculo.findMany({
      where: { tenantId, destacadoEn: { not: null }, estado: { not: "VENDIDO" } },
      orderBy: { destacadoEn: "asc" },
      select: { id: true },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { cotizacionPreferida: true, comisionPct: true } }),
  ]);

  // Cotización que eligió la agencia: en Stock se usa solo para ordenar por
  // precio mezclando monedas y para el "≈" del formulario (nunca para totales).
  const cotizacion = await getCotizacion(tenant?.cotizacionPreferida ?? "OFICIAL");

  const items: VehiculoDTO[] = vehiculos.map((v) => ({
    id: v.id,
    sucursalId: v.sucursalId,
    marca: v.marca,
    modelo: v.modelo,
    anio: v.anio,
    km: v.km,
    precio: Number(v.precio),
    moneda: v.moneda,
    estado: v.estado,
    categoria: v.categoria,
    transmision: v.transmision,
    motor: v.motor,
    docTitulo: v.docTitulo,
    docCedula: v.docCedula,
    docDominio: v.docDominio,
    docLibreDeuda: v.docLibreDeuda,
    vtvVencimiento: v.vtvVencimiento ? v.vtvVencimiento.toISOString().slice(0, 10) : null,
    fotos: v.fotos,
    mlItemId: v.mlItemId,
    mlPermalink: v.mlPermalink,
    mlStatus: v.mlStatus,
    mlLastError: v.mlLastError,
    fechaIngreso: v.fechaIngreso.toISOString(),
  }));

  // Dos totales separados por moneda, nunca un único número convertido.
  const inventario = formatearTotales(
    sumarPorMoneda(
      vehiculos.filter((v) => v.estado !== "VENDIDO").map((v) => ({ monto: Number(v.precio), moneda: v.moneda }))
    )
  );

  const leadsActivosItems: LeadActivoDTO[] = leadsActivos
    .filter((l): l is typeof l & { vehiculoId: string } => l.vehiculoId !== null)
    .map((l) => ({
      id: l.id,
      nombreCliente: l.nombreCliente,
      contacto: l.contacto,
      etapa: l.etapa,
      vehiculoId: l.vehiculoId,
    }));

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Stock</h1>
          <div className={styles.topbarSub}>
            {vehiculos.length} vehículo{vehiculos.length === 1 ? "" : "s"}
            {sucursalActual
              ? ` · ${sucursalActual.nombre}`
              : sucursales.length > 1
              ? ` · ${sucursales.length} sucursales`
              : ""}
            {" · inventario "}
            {inventario}
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <StockView
          abrirNuevo={nuevo === "1"}
          initialItems={items}
          // % de comisión de cada uno (Decimal → number) para precargar la
          // comisión en el modal de venta.
          usuarios={usuarios.map((u) => ({
            id: u.id,
            nombre: u.nombre,
            comisionPct: u.comisionPct === null ? null : Number(u.comisionPct),
          }))}
          comisionPctAgencia={tenant?.comisionPct == null ? null : Number(tenant.comisionPct)}
          sucursales={sucursales}
          defaultSucursalId={sucursalActual?.id ?? sucursales[0]?.id ?? ""}
          userId={userId}
          canRevertirVenta={rol !== "VENDEDOR"}
          leadsActivos={leadsActivosItems}
          asistenteIA={plan.asistenteIA}
          cotizacion={
            cotizacion
              ? { venta: cotizacion.venta, tipo: cotizacion.tipo, fecha: fechaCotizacionCorta(cotizacion.fecha) }
              : null
          }
          destacadosIniciales={marcados.map((v) => v.id)}
          limiteDestacados={plan.limiteDestacados}
          puedeDestacar={rol !== "VENDEDOR"}
        />
      </div>
    </>
  );
}
