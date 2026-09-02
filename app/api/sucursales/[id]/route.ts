import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sucursalUpdateSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = params;
  const existente = await prisma.sucursal.findUnique({ where: { id } });
  if (!existente || existente.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = sucursalUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const sucursal = await prisma.sucursal.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(sucursal);
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = params;
  const existente = await prisma.sucursal.findUnique({ where: { id } });
  if (!existente || existente.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const totalSucursales = await prisma.sucursal.count({
    where: { tenantId: session.user.tenantId },
  });
  if (totalSucursales <= 1) {
    return NextResponse.json(
      { error: "No podés eliminar la única sucursal de la agencia" },
      { status: 400 }
    );
  }

  try {
    await prisma.sucursal.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      {
        error:
          "No se puede eliminar: todavía tiene vehículos asignados. Reasigná el stock a otra sucursal primero.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
