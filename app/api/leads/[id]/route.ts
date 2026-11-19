import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { leadUpdateSchema } from "@/lib/validation";
import { registrarActividad } from "@/lib/actividad";
import { etapaLabelEs } from "@/lib/labels";
import { findVisibleLead } from "@/lib/leads";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

  // Cambiar de etapa o de vendedor es un movimiento real del lead: reinicia
  // el contador de "dormido". Editar datos sueltos (nombre, contacto, canal,
  // auto) no, para que corregir un typo no esconda un lead abandonado.
  const huboMovimiento =
    (data.etapa !== undefined && data.etapa !== existente.etapa) ||
    (data.vendedorId !== undefined && data.vendedorId !== existente.vendedorId);

  const lead = await prisma.lead.update({
    where: { id },
    data: { ...data, ...(huboMovimiento ? { ultimaActividadEn: new Date() } : {}) },
    include: {
      vehiculo: {
        select: { id: true, marca: true, modelo: true, estado: true, categoria: true, precio: true, moneda: true },
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
      ? { ...lead.vehiculo, precio: Number(lead.vehiculo.precio) }
      : null,
  });
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
