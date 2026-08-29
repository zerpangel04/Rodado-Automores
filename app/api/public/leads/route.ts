import { NextRequest, NextResponse } from "next/server";
import { publicLeadInputSchema } from "@/lib/validation";
import { resolverTenantPublico, crearLeadPublico, LeadPublicoError } from "@/lib/leads";
import { checkRateLimit, recordRateLimitHit, getClientIp } from "@/lib/rateLimit";

const MAX_INTENTOS = 5;
const VENTANA_MS = 10 * 60 * 1000; // 10 minutos

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(`leads-publico:${ip}`, {
    max: MAX_INTENTOS,
    windowMs: VENTANA_MS,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados envíos, esperá unos minutos e intentá de nuevo" },
      { status: 429 }
    );
  }
  await recordRateLimitHit(`leads-publico:${ip}`);

  const body = await req.json().catch(() => null);
  const parsed = publicLeadInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { dominio, vehiculoId, nombreCliente, contacto, mensaje, sitioWeb } = parsed.data;

  // Honeypot lleno = bot. Respondemos éxito sin crear nada, para no
  // delatar que lo detectamos (si le devolvemos un error, un bot mínimamente
  // sofisticado aprende a dejar ese campo vacío).
  if (sitioWeb) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  try {
    const tenant = await resolverTenantPublico(dominio);
    await crearLeadPublico({
      tenantId: tenant.id,
      vehiculoId,
      nombreCliente,
      contacto,
      mensaje,
      canal: "WEB",
    });
  } catch (error) {
    if (error instanceof LeadPublicoError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
