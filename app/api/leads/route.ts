import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { leadInputSchema } from "@/lib/validation";
import { registrarActividad } from "@/lib/actividad";
import { canalLabelEs } from "@/lib/labels";

export async function GET() {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { tenantId, id: userId, rol } = session.user;

  const leads = await prisma.lead.findMany({
    where: {
      tenantId,
      ...(rol === "VENDEDOR" ? { vendedorId: userId } : {}),
    },
    include: {
      vehiculo: { select: { marca: true, modelo: true } },
      vendedor: { select: { id: true, nombre: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { tenantId, id: userId, rol } = session.user;

  const body = await req.json().catch(() => null);
  const parsed = leadInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const vendedorId = rol === "VENDEDOR" ? userId : data.vendedorId || null;

  if (vendedorId) {
    const vendedor = await prisma.usuario.findUnique({ where: { id: vendedorId } });
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

  const lead = await prisma.lead.create({
    data: {
      tenantId,
      nombreCliente: data.nombreCliente,
      contacto: data.contacto || null,
      canal: data.canal,
      vehiculoId: data.vehiculoId || null,
      vendedorId,
    },
    include: {
      vehiculo: { select: { marca: true, modelo: true } },
      vendedor: { select: { id: true, nombre: true } },
    },
  });

  await registrarActividad({
    tenantId,
    tipo: "NUEVO_LEAD",
    descripcion: `${lead.nombreCliente} — nuevo lead vía ${canalLabelEs[lead.canal]}`,
    leadId: lead.id,
    vendedorId: lead.vendedorId,
  });

  return NextResponse.json(lead, { status: 201 });
}
