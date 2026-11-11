import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPlanTenant } from "@/lib/planes";
import { catalogoPersonalizacionSchema } from "@/lib/validation";

// Guarda la pestaña "Personalización" de /panel/catalogo. Solo para planes
// con catalogoPersonalizado (Profesional y Empresa).
export async function PATCH(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { tenantId } = session.user;

  const plan = await getPlanTenant(tenantId);
  if (!plan.catalogoPersonalizado) {
    return NextResponse.json(
      {
        error: "La personalización del catálogo está disponible en los planes Profesional y Empresa.",
        planRequerido: true,
      },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = catalogoPersonalizacionSchema.safeParse(body);
  if (!parsed.success) {
    const primero = parsed.error.issues[0]?.message;
    return NextResponse.json(
      { error: primero ?? "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { colorAcento: parsed.data.colorAcento },
    select: { dominio: true },
  });

  if (tenant.dominio) revalidatePath(`/c/${tenant.dominio}`, "layout");

  return NextResponse.json({ ok: true, colorAcento: parsed.data.colorAcento });
}
