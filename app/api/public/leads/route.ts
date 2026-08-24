import { NextRequest, NextResponse } from "next/server";
import { publicLeadInputSchema } from "@/lib/validation";
import { resolverTenantPublico, crearLeadPublico, LeadPublicoError } from "@/lib/leads";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = publicLeadInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { dominio, vehiculoId, nombreCliente, contacto, mensaje } = parsed.data;

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
