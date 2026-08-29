import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ventaInputSchema } from "@/lib/validation";
import { registrarActividad } from "@/lib/actividad";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = params;
  const { tenantId, id: userId, rol } = session.user;

  const vehiculo = await prisma.vehiculo.findUnique({ where: { id } });
  if (!vehiculo || vehiculo.tenantId !== tenantId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (vehiculo.estado === "VENDIDO") {
    return NextResponse.json(
      { error: "Este vehículo ya está vendido" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = ventaInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { vendedorId, precioFinal, comision } = parsed.data;

  if (rol === "VENDEDOR" && vendedorId !== userId) {
    return NextResponse.json(
      { error: "Solo podés registrar ventas a tu propio nombre" },
      { status: 403 }
    );
  }

  const vendedor = await prisma.usuario.findUnique({ where: { id: vendedorId } });
  if (!vendedor || vendedor.tenantId !== tenantId) {
    return NextResponse.json({ error: "Vendedor inválido" }, { status: 400 });
  }

  // Los leads vinculados a este vehículo que sigan en una etapa activa NO
  // se tocan acá: cerrarlos automáticamente los hacía desaparecer del
  // Kanban sin que nadie decidiera qué pasó con esa persona (¿se le ofrece
  // otro auto? ¿se descarta?). Esa decisión queda en manos del dueño — el
  // front ya le muestra una alerta con la lista antes de confirmar la
  // venta si hay leads activos para este vehículo.
  const [venta] = await prisma.$transaction([
    prisma.venta.create({
      data: {
        tenantId,
        vehiculoId: id,
        vendedorId,
        precioFinal,
        comision,
      },
    }),
    prisma.vehiculo.update({
      where: { id },
      data: { estado: "VENDIDO" },
    }),
  ]);

  await registrarActividad({
    tenantId,
    tipo: "VENTA_REGISTRADA",
    descripcion: `${vehiculo.marca} ${vehiculo.modelo} — venta registrada por ${vendedor.nombre}`,
    vehiculoId: id,
    ventaId: venta.id,
    vendedorId,
  });

  return NextResponse.json(venta, { status: 201 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (session.user.rol === "VENDEDOR") {
    return NextResponse.json(
      { error: "Solo el dueño o un admin pueden revertir una venta" },
      { status: 403 }
    );
  }

  const { id } = params;
  const { tenantId } = session.user;

  const vehiculo = await prisma.vehiculo.findUnique({ where: { id } });
  if (!vehiculo || vehiculo.tenantId !== tenantId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const venta = await prisma.venta.findUnique({ where: { vehiculoId: id } });
  if (!venta || venta.tenantId !== tenantId) {
    return NextResponse.json(
      { error: "Este vehículo no tiene una venta registrada" },
      { status: 404 }
    );
  }

  await prisma.$transaction([
    prisma.venta.delete({ where: { id: venta.id } }),
    prisma.vehiculo.update({ where: { id }, data: { estado: "DISPONIBLE" } }),
  ]);

  return NextResponse.json({ ok: true });
}
