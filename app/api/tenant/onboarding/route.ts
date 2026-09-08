import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Oculta para siempre el checklist de "Primeros pasos" del Panel general
// para todo el tenant — tanto al tocar "Omitir" como al terminar de ver
// la animación de cierre por completar los 3 pasos naturalmente. No hace
// falta un endpoint para "reactivarlo": no hay forma de deshacerlo desde
// la UI.
export async function POST() {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { onboardingOmitido: true },
  });

  return NextResponse.json({ ok: true });
}
