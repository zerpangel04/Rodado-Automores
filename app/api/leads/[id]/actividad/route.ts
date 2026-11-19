import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { findVisibleLead } from "@/lib/leads";
import { contactoLeadSchema } from "@/lib/validation";
import { registrarActividad } from "@/lib/actividad";

// Recorrido del lead (ficha): lo que quedó registrado en ActividadLog para
// este lead — creación, cambios de etapa y contactos — del más viejo al
// más nuevo.
export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const { tenantId, id: userId, rol } = session.user;
  const lead = await findVisibleLead(id, tenantId, userId, rol);
  if (!lead) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const items = await prisma.actividadLog.findMany({
    where: { tenantId, leadId: id },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: { id: true, tipo: true, descripcion: true, createdAt: true },
  });

  return NextResponse.json({ ultimaActividadEn: lead.ultimaActividadEn, items });
}

// "Registré un contacto": el vendedor habló con el cliente sin que el lead
// cambie de etapa. Reinicia el contador de "dormido" y queda en el
// Recorrido (no en la campanita: ver /api/notificaciones).
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const { tenantId, id: userId, rol, name } = session.user;
  const existente = await findVisibleLead(id, tenantId, userId, rol);
  if (!existente) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (existente.etapa === "CERRADO") {
    return NextResponse.json({ error: "El lead ya está cerrado" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = contactoLeadSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const nota = parsed.data.nota || null;

  const ahora = new Date();
  await prisma.lead.update({ where: { id }, data: { ultimaActividadEn: ahora } });
  await registrarActividad({
    tenantId,
    tipo: "CONTACTO_LEAD",
    descripcion: `${name ?? "Alguien del equipo"} registró un contacto con ${existente.nombreCliente}${nota ? `: ${nota}` : ""}`,
    leadId: id,
    vendedorId: existente.vendedorId,
  });

  return NextResponse.json({ ultimaActividadEn: ahora.toISOString() });
}
