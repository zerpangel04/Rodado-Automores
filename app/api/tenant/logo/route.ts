import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { uploadTenantLogo } from "@/lib/supabase";
import { LOGO_ALLOWED_TYPES, LOGO_MAX_BYTES } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Elegí una imagen" }, { status: 400 });
  }

  if (!LOGO_ALLOWED_TYPES.includes(file.type as (typeof LOGO_ALLOWED_TYPES)[number])) {
    return NextResponse.json(
      { error: "Formato no permitido, usá JPG, PNG o WEBP" },
      { status: 400 }
    );
  }
  if (file.size > LOGO_MAX_BYTES) {
    return NextResponse.json({ error: "La imagen pesa más de 3MB" }, { status: 400 });
  }

  let logoUrl: string;
  try {
    logoUrl = await uploadTenantLogo(session.user.tenantId, file);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo subir el logo" },
      { status: 500 }
    );
  }

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { logoUrl },
  });

  return NextResponse.json({ logoUrl });
}
