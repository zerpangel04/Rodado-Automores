import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { mercadoLibreConexionUpdateSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = mercadoLibreConexionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existente = await prisma.mercadoLibreConexion.findUnique({
    where: { tenantId: session.user.tenantId },
  });
  if (!existente) {
    return NextResponse.json({ error: "No hay una cuenta de Mercado Libre conectada" }, { status: 404 });
  }

  const conexion = await prisma.mercadoLibreConexion.update({
    where: { tenantId: session.user.tenantId },
    data: parsed.data,
  });

  return NextResponse.json({
    syncPrecios: conexion.syncPrecios,
    syncFotos: conexion.syncFotos,
    pausarAlVender: conexion.pausarAlVender,
  });
}

export async function DELETE() {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const existente = await prisma.mercadoLibreConexion.findUnique({
    where: { tenantId: session.user.tenantId },
  });
  if (!existente) {
    return NextResponse.json({ error: "No hay una cuenta de Mercado Libre conectada" }, { status: 404 });
  }

  // Solo revoca el vínculo local — las publicaciones que ya están en
  // Mercado Libre quedan como están, no se tocan mlItemId/mlStatus.
  await prisma.mercadoLibreConexion.delete({ where: { tenantId: session.user.tenantId } });

  return NextResponse.json({ ok: true });
}
