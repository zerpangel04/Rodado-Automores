import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { interesIntegracionInputSchema } from "@/lib/validation";

// Togglea el "Avisarme" de una integración: si ya estaba anotado, lo
// saca (por si tocó el botón de más); si no, lo anota. Un solo endpoint
// en vez de POST/DELETE separados porque el botón en sí no distingue
// una acción de la otra, solo alterna.
export async function POST(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = interesIntegracionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tipoIntegracion } = parsed.data;
  const tenantId = session.user.tenantId;

  const existente = await prisma.interesIntegracion.findUnique({
    where: { tenantId_tipoIntegracion: { tenantId, tipoIntegracion } },
  });

  if (existente) {
    await prisma.interesIntegracion.delete({ where: { id: existente.id } });
    return NextResponse.json({ on: false });
  }

  await prisma.interesIntegracion.create({
    data: { tenantId, tipoIntegracion },
  });
  return NextResponse.json({ on: true });
}
