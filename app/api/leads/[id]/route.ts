import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { leadUpdateSchema } from "@/lib/validation";
import { registrarActividad } from "@/lib/actividad";
import { etapaLabelEs } from "@/lib/labels";

async function findVisibleLead(id: string, tenantId: string, userId: string, rol: string) {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead || lead.tenantId !== tenantId) return null;
  if (rol === "VENDEDOR" && lead.vendedorId !== userId) return null;
  return lead;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { tenantId, id: userId, rol } = session.user;
  const { id } = params;

  const existente = await findVisibleLead(id, tenantId, userId, rol);
  if (!existente) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = leadUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (rol === "VENDEDOR" && data.vendedorId && data.vendedorId !== userId) {
    return NextResponse.json(
      { error: "No podés reasignar este lead a otro vendedor" },
      { status: 403 }
    );
  }
  if (data.vendedorId) {
    const vendedor = await prisma.usuario.findUnique({ where: { id: data.vendedorId } });
    if (!vendedor || vendedor.tenantId !== tenantId) {
      return NextResponse.json({ error: "Vendedor inválido" }, { status: 400 });
    }
  }
  if (data.vehiculoId) {
    const vehiculo = await prisma.vehiculo.findUnique({ where: { id: data.vehiculoId } });
    if (!vehiculo || vehiculo.tenantId !== tenantId) {
      return NextResponse.json({ error: "Vehículo inválido" }, { status: 400 });
    }
  }

  const lead = await prisma.lead.update({
    where: { id },
    data,
    include: {
      vehiculo: {
        select: { id: true, marca: true, modelo: true, estado: true, categoria: true, precioUsd: true },
      },
      vendedor: { select: { id: true, nombre: true } },
    },
  });

  if (data.etapa && data.etapa !== existente.etapa) {
    await registrarActividad({
      tenantId,
      tipo: "CAMBIO_ETAPA_LEAD",
      descripcion: `${lead.nombreCliente} pasó a ${etapaLabelEs[data.etapa]}`,
      leadId: lead.id,
      vendedorId: lead.vendedorId,
    });
  }

  return NextResponse.json({
    ...lead,
    vehiculo: lead.vehiculo
      ? { ...lead.vehiculo, precioUsd: Number(lead.vehiculo.precioUsd) }
      : null,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { tenantId, id: userId, rol } = session.user;
  const { id } = params;

  const existente = await findVisibleLead(id, tenantId, userId, rol);
  if (!existente) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.lead.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
