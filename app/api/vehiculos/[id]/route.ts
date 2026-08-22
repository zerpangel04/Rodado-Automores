import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { vehiculoUpdateSchema } from "@/lib/validation";
import { findOwnedVehiculo } from "@/lib/vehiculos";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = params;
  const existente = await findOwnedVehiculo(id, session.user.tenantId);
  if (!existente) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = vehiculoUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.estado === "VENDIDO" && existente.estado !== "VENDIDO") {
    return NextResponse.json(
      { error: "Para marcar un vehículo como vendido usá el registro de venta" },
      { status: 400 }
    );
  }
  if (existente.estado === "VENDIDO" && parsed.data.estado && parsed.data.estado !== "VENDIDO") {
    return NextResponse.json(
      { error: "Este vehículo ya tiene una venta registrada, revertila primero" },
      { status: 400 }
    );
  }

  const vehiculo = await prisma.vehiculo.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(vehiculo);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = params;
  const existente = await findOwnedVehiculo(id, session.user.tenantId);
  if (!existente) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (existente.estado === "VENDIDO") {
    return NextResponse.json(
      { error: "No se puede eliminar un vehículo vendido, revertí la venta primero" },
      { status: 400 }
    );
  }

  await prisma.vehiculo.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
