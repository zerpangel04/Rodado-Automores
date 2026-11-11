import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPlanTenant } from "@/lib/planes";
import { deleteTenantPortada, uploadTenantPortada } from "@/lib/supabase";
import { PORTADA_ALLOWED_TYPES, PORTADA_MAX_BYTES } from "@/lib/validation";
import { sniffImageMimeType } from "@/lib/imageSignature";

type Permitido = { ok: true; tenantId: string } | { ok: false; res: NextResponse };

// Dueño + plan con catalogoPersonalizado (Profesional y Empresa).
async function verificarPermiso(): Promise<Permitido> {
  const session = await currentSession();
  if (!session) {
    return { ok: false, res: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  if (session.user.rol !== "DUENIO") {
    return { ok: false, res: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }
  const plan = await getPlanTenant(session.user.tenantId);
  if (!plan.catalogoPersonalizado) {
    return {
      ok: false,
      res: NextResponse.json(
        {
          error: "La foto de portada está disponible en los planes Profesional y Empresa.",
          planRequerido: true,
        },
        { status: 403 }
      ),
    };
  }
  return { ok: true, tenantId: session.user.tenantId };
}

function revalidarCatalogo(dominio: string | null) {
  if (dominio) revalidatePath(`/c/${dominio}`, "layout");
}

export async function POST(req: NextRequest) {
  const permiso = await verificarPermiso();
  if (!permiso.ok) return permiso.res;
  const { tenantId } = permiso;

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Elegí una imagen" }, { status: 400 });
  }
  if (!PORTADA_ALLOWED_TYPES.includes(file.type as (typeof PORTADA_ALLOWED_TYPES)[number])) {
    return NextResponse.json({ error: "Formato no permitido, usá JPG, PNG o WEBP" }, { status: 400 });
  }
  if (file.size > PORTADA_MAX_BYTES) {
    return NextResponse.json({ error: "La imagen pesa más de 5MB" }, { status: 400 });
  }
  // Igual que el logo: se confirma el tipo mirando los bytes reales.
  const sniffed = await sniffImageMimeType(file);
  if (!sniffed || !PORTADA_ALLOWED_TYPES.includes(sniffed as (typeof PORTADA_ALLOWED_TYPES)[number])) {
    return NextResponse.json({ error: "El archivo no es una imagen válida" }, { status: 400 });
  }

  let portadaUrl: string;
  try {
    portadaUrl = await uploadTenantPortada(tenantId, file);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo subir la portada" },
      { status: 500 }
    );
  }

  const anterior = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { portadaUrl: true },
  });
  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { portadaUrl },
    select: { dominio: true },
  });
  if (anterior?.portadaUrl) await deleteTenantPortada(tenantId, anterior.portadaUrl);

  revalidarCatalogo(tenant.dominio);
  return NextResponse.json({ portadaUrl });
}

export async function DELETE() {
  const permiso = await verificarPermiso();
  if (!permiso.ok) return permiso.res;
  const { tenantId } = permiso;

  const anterior = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { portadaUrl: true },
  });
  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { portadaUrl: null },
    select: { dominio: true },
  });
  if (anterior?.portadaUrl) await deleteTenantPortada(tenantId, anterior.portadaUrl);

  revalidarCatalogo(tenant.dominio);
  return NextResponse.json({ ok: true });
}
