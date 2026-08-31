import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUCURSAL_COOKIE } from "@/lib/sucursalFiltro";
import { SucursalesView, type SucursalDTO } from "./SucursalesView";
import styles from "../panel.module.css";

export default async function SucursalesPage() {
  const session = await auth();
  const { tenantId, rol } = session!.user;

  if (rol !== "DUENIO") {
    return (
      <>
        <div className={styles.topbar}>
          <div>
            <h1 className="disp">Sucursales</h1>
          </div>
        </div>
        <div className={styles.content}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Solo el dueño de la agencia puede gestionar las sucursales.
          </p>
        </div>
      </>
    );
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [sucursales, leadsAll, ventasAll, usuarios] = await Promise.all([
    prisma.sucursal.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { vehiculos: true } } },
    }),
    prisma.lead.findMany({
      where: { tenantId, vehiculoId: { not: null } },
      select: { etapa: true, vendedorId: true, vehiculo: { select: { sucursalId: true } } },
    }),
    prisma.venta.findMany({
      where: { tenantId },
      select: {
        fecha: true,
        precioFinal: true,
        vendedorId: true,
        vehiculo: { select: { sucursalId: true } },
      },
    }),
    prisma.usuario.findMany({
      where: { tenantId },
      select: { id: true, nombre: true, rol: true },
    }),
  ]);

  const nombrePorId = new Map(usuarios.map((u) => [u.id, u.nombre]));
  const totalVehiculos = sucursales.reduce((s, x) => s + x._count.vehiculos, 0);
  const totalVentasMes = ventasAll.filter((v) => v.fecha >= startOfMonth).length;
  const totalFacturadoMes = ventasAll
    .filter((v) => v.fecha >= startOfMonth)
    .reduce((s, v) => s + Number(v.precioFinal), 0);

  const items: SucursalDTO[] = sucursales.map((s, idx) => {
    const leadsSucursal = leadsAll.filter((l) => l.vehiculo?.sucursalId === s.id);
    const ventasSucursal = ventasAll.filter((v) => v.vehiculo?.sucursalId === s.id);
    const ventasEsteMes = ventasSucursal.filter((v) => v.fecha >= startOfMonth);

    const equipoIds = new Set<string>();
    for (const l of leadsSucursal) if (l.vendedorId) equipoIds.add(l.vendedorId);
    for (const v of ventasSucursal) if (v.vendedorId) equipoIds.add(v.vendedorId);
    const equipo = Array.from(equipoIds)
      .map((id) => ({ id, nombre: nombrePorId.get(id) ?? "Usuario" }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    return {
      id: s.id,
      nombre: s.nombre,
      direccion: s.direccion,
      telefono: s.telefono,
      vehiculosCount: s._count.vehiculos,
      esPrincipal: idx === 0,
      leadsActivos: leadsSucursal.filter((l) => l.etapa !== "CERRADO").length,
      ventasEsteMes: ventasEsteMes.length,
      facturadoEsteMes: ventasEsteMes.reduce((sum, v) => sum + Number(v.precioFinal), 0),
      participacionStock: totalVehiculos > 0 ? Math.round((s._count.vehiculos / totalVehiculos) * 100) : 0,
      equipo,
    };
  });

  const equipoUnicoIds = new Set(items.flatMap((s) => s.equipo.map((e) => e.id)));
  const vendedores = usuarios.filter((u) => u.rol === "VENDEDOR");
  const vendedoresSinSucursal = vendedores.filter((v) => !equipoUnicoIds.has(v.id));

  const resumen = {
    sucursalesActivas: sucursales.length,
    stockTotal: totalVehiculos,
    stockPorSucursal: items.map((s) => s.vehiculosCount),
    ventasMes: totalVentasMes,
    facturadoMes: totalFacturadoMes,
    equipoAsignado: equipoUnicoIds.size,
    totalUsuarios: usuarios.length,
    vendedoresSinSucursal: vendedoresSinSucursal.length,
  };

  async function setSucursalYVerStock(sucursalId: string) {
    "use server";
    cookies().set(SUCURSAL_COOKIE, sucursalId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    revalidatePath("/panel", "layout");
  }

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Sucursales</h1>
          <div className={styles.topbarSub}>
            Locales físicos de tu agencia y su stock asignado
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <SucursalesView initialItems={items} resumen={resumen} onVerStock={setSucursalYVerStock} />
      </div>
    </>
  );
}
