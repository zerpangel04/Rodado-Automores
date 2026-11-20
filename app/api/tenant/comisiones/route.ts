import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { comisionPctSchema } from "@/lib/validation";

// % de comisión por defecto de la agencia (precarga la comisión en el modal
// de venta). null = sin %, se carga a mano. Solo el Dueño, como el resto de
// Equipo.
export async function PATCH(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "Solo el dueño puede cambiar el porcentaje de comisión" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = comisionPctSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const { comisionPct } = parsed.data;

  const tenant = await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { comisionPct: comisionPct === null ? null : new Prisma.Decimal(comisionPct) },
    select: { comisionPct: true },
  });

  return NextResponse.json({ comisionPct: tenant.comisionPct === null ? null : Number(tenant.comisionPct) });
}
