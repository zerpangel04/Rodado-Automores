import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { comisionPctSchema } from "@/lib/validation";

// % de comisión propio de un usuario (pisa al de la agencia). null = usa el
// de la agencia. Solo el Dueño, como el resto de Equipo (incluido el suyo:
// el dueño también puede vender).
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "Solo el dueño puede cambiar el porcentaje de comisión" }, { status: 403 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { id }, select: { tenantId: true } });
  if (!usuario || usuario.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = comisionPctSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const { comisionPct } = parsed.data;

  const actualizado = await prisma.usuario.update({
    where: { id },
    data: { comisionPct: comisionPct === null ? null : new Prisma.Decimal(comisionPct) },
    select: { comisionPct: true },
  });

  return NextResponse.json({ comisionPct: actualizado.comisionPct === null ? null : Number(actualizado.comisionPct) });
}
