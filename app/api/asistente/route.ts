import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { currentSession } from "@/lib/session";
import { panelChatInputSchema } from "@/lib/validation";
import { checkRateLimit, recordRateLimitHit } from "@/lib/rateLimit";
import { armarContextoTenant, buildSystemPromptAsistentePanel } from "@/lib/asistentePanel";

// Mismo criterio que el asistente del catálogo público
// (app/api/[dominio]/chat/route.ts): generoso a propósito porque es una
// conversación de ida y vuelta, no un formulario de un solo envío.
const MAX_MENSAJES = 30;
const VENTANA_MS = 10 * 60 * 1000; // 10 minutos

// Mismo modelo que el resto de los asistentes de Rodado — probado y
// pedido explícitamente, no usar otro por defecto.
const MODEL = "claude-sonnet-4-6";

const MENSAJE_NO_DISPONIBLE =
  "El asistente no está disponible en este momento. Probá de nuevo en un rato.";

export async function POST(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { tenantId, id: userId, rol, name } = session.user;

  // Scopeado por usuario (no por IP): ya sabemos quién es, y así cada
  // cuenta tiene su propio cupo en vez de compartirlo con toda la oficina
  // detrás de la misma IP.
  const rateLimitKey = `asistente-panel:${userId}`;
  const { allowed } = await checkRateLimit(rateLimitKey, { max: MAX_MENSAJES, windowMs: VENTANA_MS });
  if (!allowed) {
    return NextResponse.json({
      reply: "Hiciste muchas consultas seguidas, esperá un rato y probá de nuevo.",
      disponible: true,
    });
  }
  await recordRateLimitHit(rateLimitKey);

  const body = await req.json().catch(() => null);
  const parsed = panelChatInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reply: MENSAJE_NO_DISPONIBLE, disponible: false });
  }

  const { contexto, tenantNombre } = await armarContextoTenant({
    tenantId,
    nombreUsuario: name ?? "Usuario",
    rol,
  });
  const system = buildSystemPromptAsistentePanel({ tenantNombre, contextoTenant: contexto });

  const anthropicMessages: Anthropic.MessageParam[] = parsed.data.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: anthropicMessages,
    });

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );

    return NextResponse.json({
      reply: textBlock?.text.trim() || MENSAJE_NO_DISPONIBLE,
      disponible: true,
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("[asistente-panel] Clave de Anthropic inválida o no configurada", tenantId);
    } else if (error instanceof Anthropic.RateLimitError) {
      console.error("[asistente-panel] Rate limit de la API de Anthropic", tenantId);
    } else if (error instanceof Anthropic.APIError) {
      console.error("[asistente-panel] Error de la API de Anthropic", tenantId, error.status, error.message);
    } else {
      console.error("[asistente-panel] Error inesperado", tenantId, error);
    }

    return NextResponse.json({ reply: MENSAJE_NO_DISPONIBLE, disponible: false });
  }
}
