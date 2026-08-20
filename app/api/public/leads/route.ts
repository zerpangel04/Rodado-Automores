import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicLeadInputSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = publicLeadInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { dominio, vehiculoId, nombreCliente, contacto, mensaje } = parsed.data;

  const tenant = await prisma.tenant.findUnique({ where: { dominio } });
  if (!tenant) {
    return NextResponse.json({ error: "Agencia no encontrada" }, { status: 404 });
  }

  const vehiculo = await prisma.vehiculo.findUnique({ where: { id: vehiculoId } });
  if (!vehiculo || vehiculo.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
  }
  if (vehiculo.estado === "VENDIDO") {
    return NextResponse.json(
      { error: "Este vehículo ya no está disponible" },
      { status: 400 }
    );
  }

  await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      vehiculoId: vehiculo.id,
      nombreCliente,
      contacto,
      mensaje: mensaje || null,
      canal: "WEB",
      etapa: "NUEVO",
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
