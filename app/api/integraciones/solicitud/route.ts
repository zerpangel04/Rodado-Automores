import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { solicitudIntegracionInputSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = solicitudIntegracionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const solicitud = await prisma.solicitudIntegracion.create({
    data: {
      tenantId: session.user.tenantId,
      nombrePlataforma: parsed.data.nombrePlataforma,
      comentario: parsed.data.comentario || null,
    },
  });

  return NextResponse.json(solicitud, { status: 201 });
}
