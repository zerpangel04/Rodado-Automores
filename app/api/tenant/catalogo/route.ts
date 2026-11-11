import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { catalogoGeneralSchema } from "@/lib/validation";

// Guarda la pestaña "General" de /panel/catalogo: sobre nosotros, año de
// inicio y los horarios de cada sucursal, todo en una sola transacción.
export async function PATCH(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { tenantId } = session.user;

  const body = await req.json().catch(() => null);
  const parsed = catalogoGeneralSchema.safeParse(body);
  if (!parsed.success) {
    const primero = parsed.error.issues[0]?.message;
    return NextResponse.json(
      { error: primero ?? "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { sobreNosotros, anioInicio, sucursales } = parsed.data;

  // Solo se pueden tocar sucursales del propio tenant.
  const ids = sucursales.map((s) => s.id);
  const propias = await prisma.sucursal.count({ where: { tenantId, id: { in: ids } } });
  if (propias !== new Set(ids).size) {
    return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 });
  }

  const tenant = await prisma.$transaction(async (tx) => {
    for (const s of sucursales) {
      await tx.sucursal.update({ where: { id: s.id }, data: { horarios: s.horarios } });
    }
    return tx.tenant.update({
      where: { id: tenantId },
      data: { sobreNosotros, anioInicio },
      select: { dominio: true },
    });
  });

  if (tenant.dominio) revalidatePath(`/c/${tenant.dominio}`);

  return NextResponse.json({ ok: true });
}
