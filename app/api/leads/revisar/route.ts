import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// "Marcar como revisado" en lote: reinicia el contador de "dormido" de TODOS
// los leads abiertos de la agencia (no solo los de la sucursal filtrada).
// Pensado para el día que se activa la función, cuando leads que quizás ya
// se atendieron por fuera del sistema aparecerían todos como dormidos. Solo
// Dueño o Admin; no cambia etapas ni vendedores.
export async function POST() {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol === "VENDEDOR") {
    return NextResponse.json(
      { error: "Solo el dueño o un admin pueden marcar todos los leads como revisados" },
      { status: 403 }
    );
  }

  const { count } = await prisma.lead.updateMany({
    where: { tenantId: session.user.tenantId, etapa: { not: "CERRADO" } },
    data: { ultimaActividadEn: new Date() },
  });

  return NextResponse.json({ revisados: count });
}
