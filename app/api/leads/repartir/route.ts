import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getSucursalActual } from "@/lib/sucursalFiltro";

export async function POST() {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { tenantId } = session.user;
  const sucursalActual = await getSucursalActual(tenantId);
  const sucursalFilter = sucursalActual
    ? { vehiculo: { sucursalId: sucursalActual.id } }
    : {};

  const [vendedores, sinAsignar] = await Promise.all([
    prisma.usuario.findMany({
      where: { tenantId, rol: "VENDEDOR" },
      select: {
        id: true,
        _count: { select: { leadsAsignados: { where: { etapa: { not: "CERRADO" } } } } },
      },
    }),
    prisma.lead.findMany({
      where: { tenantId, vendedorId: null, etapa: { not: "CERRADO" }, ...sucursalFilter },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (vendedores.length === 0) {
    return NextResponse.json({ error: "No hay vendedores para repartir los leads" }, { status: 400 });
  }
  if (sinAsignar.length === 0) {
    return NextResponse.json({ ok: true, asignados: 0 });
  }

  // Reparto por menor carga: siempre le toca al vendedor con menos leads
  // activos en este momento, para ir emparejando la carga en vez de
  // repartir en simple round-robin.
  const carga = vendedores
    .map((v) => ({ id: v.id, count: v._count.leadsAsignados }))
    .sort((a, b) => a.count - b.count);

  const updates = sinAsignar.map((lead) => {
    const menor = carga[0];
    menor.count += 1;
    carga.sort((a, b) => a.count - b.count);
    return prisma.lead.update({
      where: { id: lead.id },
      data: { vendedorId: menor.id },
    });
  });

  await prisma.$transaction(updates);

  return NextResponse.json({ ok: true, asignados: sinAsignar.length });
}
