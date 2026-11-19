import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { seguimientoLeadsSchema } from "@/lib/validation";

// Días sin movimiento para marcar un lead como "dormido". Lo elige el Dueño
// o un Admin desde Leads; aplica a toda la agencia.
export async function PATCH(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol === "VENDEDOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = seguimientoLeadsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { diasLeadDormido: parsed.data.diasLeadDormido },
    select: { diasLeadDormido: true },
  });

  // Pendientes del Panel general también depende del umbral.
  revalidatePath("/panel", "layout");
  return NextResponse.json(tenant);
}
