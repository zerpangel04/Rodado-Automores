import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRelativo } from "../actividadDisplay";
import { EquipoView, type UsuarioDTO } from "./EquipoView";
import styles from "../panel.module.css";

const SUC_PALETA = ["var(--accent)", "var(--info)", "var(--secondary)", "var(--success)"];

export default async function EquipoPage() {
  const session = await auth();
  const { tenantId, rol, id: userId } = session!.user;

  if (rol !== "DUENIO") {
    return (
      <>
        <div className={styles.topbar}>
          <div>
            <h1 className="disp">Equipo</h1>
          </div>
        </div>
        <div className={styles.content}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Solo el dueño de la agencia puede gestionar el equipo.
          </p>
        </div>
      </>
    );
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [usuarios, sucursales, leadsAll, ventasAll, actividades] = await Promise.all([
    prisma.usuario.findMany({
      where: { tenantId },
      select: { id: true, nombre: true, email: true, rol: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.sucursal.findMany({
      where: { tenantId },
      select: { id: true, nombre: true },
      orderBy: { createdAt: "asc" },
    }),
    // Sin filtrar por vendedorId: hacen falta también los leads sin
    // asignar todavía para calcular bien los totales del equipo.
    prisma.lead.findMany({
      where: { tenantId },
      select: {
        vendedorId: true,
        etapa: true,
        createdAt: true,
        vehiculo: { select: { sucursalId: true } },
      },
    }),
    prisma.venta.findMany({
      where: { tenantId },
      select: {
        vendedorId: true,
        fecha: true,
        precioFinal: true,
        comision: true,
        vehiculo: { select: { sucursalId: true } },
      },
    }),
    // Última actividad por vendedor, para "actividad reciente" y el estado
    // en línea — no hay tracking de sesión real, se deriva de eventos.
    prisma.actividadLog.findMany({
      where: { tenantId, vendedorId: { not: null } },
      select: { vendedorId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const sucColorPorId = new Map(sucursales.map((s, i) => [s.id, SUC_PALETA[i % SUC_PALETA.length]]));
  const sucNombrePorId = new Map(sucursales.map((s) => [s.id, s.nombre]));
  const ultimaActividadPorVendedor = new Map<string, Date>();
  for (const a of actividades) {
    if (a.vendedorId && !ultimaActividadPorVendedor.has(a.vendedorId)) {
      ultimaActividadPorVendedor.set(a.vendedorId, a.createdAt);
    }
  }

  const items: UsuarioDTO[] = usuarios.map((u) => {
    const leadsActivos = leadsAll.filter((l) => l.vendedorId === u.id && l.etapa !== "CERRADO");
    const ventasEsteMes = ventasAll.filter((v) => v.vendedorId === u.id && v.fecha >= startOfMonth);
    const comisionEsteMes = ventasEsteMes.reduce((s, v) => s + Number(v.comision), 0);
    // Cierre = ventas del mes sobre los leads que le llegaron este mes (no
    // sobre los "activos" ahora mismo) — si se usa el conteo de activos
    // como base, un vendedor que cierra rápido termina con más ventas que
    // leads activos y da un cierre "de más de 100%".
    const leadsEsteMes = leadsAll.filter((l) => l.vendedorId === u.id && l.createdAt >= startOfMonth);
    const cierre =
      leadsEsteMes.length > 0 ? Math.min(100, Math.round((ventasEsteMes.length / leadsEsteMes.length) * 100)) : 0;

    let sucursal: string;
    let sucColor: string;
    if (u.rol === "DUENIO") {
      sucursal = "Todas las sucursales";
      sucColor = "var(--accent)";
    } else {
      const conteo = new Map<string, number>();
      for (const l of leadsActivos) {
        if (l.vehiculo?.sucursalId) conteo.set(l.vehiculo.sucursalId, (conteo.get(l.vehiculo.sucursalId) ?? 0) + 1);
      }
      for (const v of ventasEsteMes) {
        if (v.vehiculo?.sucursalId) conteo.set(v.vehiculo.sucursalId, (conteo.get(v.vehiculo.sucursalId) ?? 0) + 1);
      }
      const top = Array.from(conteo.entries()).sort((a, b) => b[1] - a[1])[0];
      sucursal = top ? sucNombrePorId.get(top[0]) ?? "Sin sucursal asignada" : "Sin sucursal asignada";
      sucColor = top ? sucColorPorId.get(top[0]) ?? "var(--ink-soft)" : "var(--ink-soft)";
    }

    const ultima = ultimaActividadPorVendedor.get(u.id);
    const diffMin = ultima ? Math.floor((now.getTime() - ultima.getTime()) / 60000) : null;

    return {
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      sucursal,
      sucColor,
      actividad: ultima ? formatRelativo(ultima) : "sin actividad",
      enLinea: diffMin !== null && diffMin < 15,
      leadsActivos: leadsActivos.length,
      ventasEsteMes: ventasEsteMes.length,
      cierre,
      comisionEsteMes,
    };
  });

  const leadsActivosTotalTenant = leadsAll.filter((l) => l.etapa !== "CERRADO").length;
  // "Sin asignar" es literal acá (vendedorId nulo) — coincide con lo que
  // el botón Repartir realmente toma, para no mostrar un aviso de "hay
  // leads sin asignar" sobre leads que en realidad ya están en manos del
  // dueño.
  const sinAsignar = leadsAll.filter((l) => l.etapa !== "CERRADO" && !l.vendedorId).length;

  const totalVentasMes = items.reduce((s, u) => s + u.ventasEsteMes, 0);
  const totalComisionMes = items.reduce((s, u) => s + u.comisionEsteMes, 0);
  const totalLeadsAsignados = items.reduce((s, u) => s + u.leadsActivos, 0);
  const totalLeadsEsteMes = leadsAll.filter((l) => l.createdAt >= startOfMonth).length;
  const cierreEquipo =
    totalLeadsEsteMes > 0 ? Math.min(100, Math.round((totalVentasMes / totalLeadsEsteMes) * 100)) : 0;

  const resumen = {
    personas: usuarios.length,
    duenios: usuarios.filter((u) => u.rol === "DUENIO").length,
    vendedores: usuarios.filter((u) => u.rol === "VENDEDOR").length,
    admins: usuarios.filter((u) => u.rol === "ADMIN").length,
    leadsAsignados: totalLeadsAsignados,
    leadsActivosTotalTenant,
    sinAsignar,
    cierreEquipo,
    totalVentasMes,
    totalComisionMes,
  };

  const carga = items
    .filter((u) => u.rol === "VENDEDOR")
    .map((u) => ({ id: u.id, nombre: u.nombre, leads: u.leadsActivos }))
    .sort((a, b) => b.leads - a.leads);

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Equipo</h1>
          <div className={styles.topbarSub}>
            Quién trabaja en la agencia, qué ve cada uno y cómo le está yendo
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <EquipoView initialItems={items} userId={userId} resumen={resumen} carga={carga} />
      </div>
    </>
  );
}
