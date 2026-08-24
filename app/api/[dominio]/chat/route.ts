import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { chatInputSchema } from "@/lib/validation";
import { crearLeadPublico, LeadPublicoError } from "@/lib/leads";

// Modelo pedido explícitamente. No usar Opus por defecto acá: esta ruta se
// pensó y probó contra claude-sonnet-4-6.
const MODEL = "claude-sonnet-4-6";
const MAX_TOOL_ITERATIONS = 3;

const MENSAJE_NO_DISPONIBLE =
  "El asistente no está disponible en este momento. Dejanos tu nombre y un teléfono o email acá abajo, o probá más tarde 🙂";

const REGISTRAR_LEAD_TOOL: Anthropic.Tool = {
  name: "registrar_lead",
  description:
    "Registra en el sistema de la agencia el interés de un visitante que ya dejó su nombre y un dato de contacto (teléfono, WhatsApp o email). Llamala una sola vez por conversación, apenas tengas ambos datos.",
  input_schema: {
    type: "object",
    properties: {
      nombre: { type: "string", description: "Nombre del visitante" },
      contacto: {
        type: "string",
        description: "Teléfono, WhatsApp o email que dejó el visitante",
      },
      mensaje: {
        type: "string",
        description: "Resumen breve (una frase) de qué está buscando o consultando",
      },
      vehiculoId: {
        type: "string",
        description:
          "El id del vehículo puntual de interés, tomado de la lista de stock. Omitilo si la consulta no es sobre una unidad específica.",
      },
    },
    required: ["nombre", "contacto"],
    additionalProperties: false,
  },
};

type VehiculoStock = {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  km: number;
  precioUsd: number;
  estado: string;
  transmision: string | null;
  motor: string | null;
};

function formatearStock(vehiculos: VehiculoStock[]): string {
  if (vehiculos.length === 0) {
    return "(no hay vehículos en stock en este momento)";
  }
  return vehiculos
    .map((v, i) => {
      const estado = v.estado === "RESERVADO" ? "reservado (todavía no vendido)" : "disponible";
      const detalles = [
        `${v.km.toLocaleString("es-AR")} km`,
        `USD ${v.precioUsd.toLocaleString("es-AR")}`,
        estado,
        v.transmision ? `transmisión ${v.transmision}` : null,
        v.motor ? `motor ${v.motor}` : null,
      ]
        .filter(Boolean)
        .join(" — ");
      return `${i + 1}. ${v.marca} ${v.modelo} ${v.anio} — ${detalles} — id:${v.id}`;
    })
    .join("\n");
}

function buildSystemPrompt(agencia: string, stockTexto: string): string {
  return `Sos el asistente virtual del catálogo online de ${agencia}, una concesionaria de autos usados en Argentina. Atendés en el momento a visitantes que están mirando el catálogo en la web.

STOCK ACTUAL DE ${agencia.toUpperCase()} (única fuente de verdad, se consulta en vivo a la base de datos antes de cada respuesta):
${stockTexto}

REGLAS QUE NUNCA PODÉS ROMPER:
1. Solo hablás de los vehículos listados arriba. Nunca inventes ni supongas marcas, modelos, años, kilometrajes, precios, transmisión o motor que no estén en esa lista. Si no tenés el dato o el stock no incluye lo que piden, decilo con honestidad en vez de completarlo ("no tengo esa unidad en stock ahora mismo" / "ese dato no lo tengo cargado").
2. Nunca inventes ni estimes un precio. Si preguntan por algo que no está en la lista, no calcules un precio aproximado: ofrecé dejarlo anotado para que un vendedor lo confirme.
3. Si el visitante pide algo que no podés resolver con la información que tenés (financiación, permuta, coordinar una prueba de manejo, negociar precio, verificar un dato puntual del auto, etc.), no lo dejes sin respuesta: pedile su nombre y un teléfono, WhatsApp o email para que lo contacte un vendedor humano.
4. Apenas el visitante te haya dado su nombre Y un dato de contacto (teléfono, WhatsApp o email), llamá a la herramienta registrar_lead para dejarlo cargado en el sistema de la agencia. Hacelo una sola vez por conversación. Después de registrarlo, confirmale que ya quedó anotado y que lo van a contactar a la brevedad.
5. Nunca digas que ya se registró su consulta si no llamaste efectivamente a registrar_lead.
6. Tono cercano, breve y directo, como un vendedor de confianza escribiendo por WhatsApp. Respuestas de 2 a 4 líneas, sin relleno corporativo ni firmas.
7. No decís ser un humano ni un empleado si te preguntan directamente — sos el asistente virtual del catálogo de ${agencia}.`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { dominio: string } }
) {
  const body = await req.json().catch(() => null);
  const parsed = chatInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { dominio } = params;
  const { messages, vehiculoId } = parsed.data;

  const tenant = await prisma.tenant.findUnique({ where: { dominio } });
  if (!tenant) {
    return NextResponse.json({ error: "Agencia no encontrada" }, { status: 404 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reply: MENSAJE_NO_DISPONIBLE, disponible: false });
  }

  const vehiculosDb = await prisma.vehiculo.findMany({
    where: { tenantId: tenant.id, estado: { not: "VENDIDO" } },
    orderBy: { fechaIngreso: "desc" },
    select: {
      id: true,
      marca: true,
      modelo: true,
      anio: true,
      km: true,
      precioUsd: true,
      estado: true,
      transmision: true,
      motor: true,
    },
  });

  const stockTexto = formatearStock(
    vehiculosDb.map((v) => ({ ...v, precioUsd: Number(v.precioUsd) }))
  );
  const system = buildSystemPrompt(tenant.nombre, stockTexto);

  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const client = new Anthropic();

  try {
    let response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      tools: [REGISTRAR_LEAD_TOOL],
      messages: anthropicMessages,
    });

    let iteraciones = 0;
    while (response.stop_reason === "tool_use" && iteraciones < MAX_TOOL_ITERATIONS) {
      iteraciones++;

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      anthropicMessages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tool of toolUseBlocks) {
        if (tool.name !== "registrar_lead") {
          toolResults.push({
            type: "tool_result",
            tool_use_id: tool.id,
            content: "Herramienta desconocida",
            is_error: true,
          });
          continue;
        }

        const input = tool.input as {
          nombre?: string;
          contacto?: string;
          mensaje?: string;
          vehiculoId?: string;
        };

        try {
          if (!input.nombre?.trim() || !input.contacto?.trim()) {
            throw new LeadPublicoError("Faltan nombre o contacto", 400);
          }
          await crearLeadPublico({
            tenantId: tenant.id,
            vehiculoId: input.vehiculoId?.trim() || vehiculoId || null,
            nombreCliente: input.nombre.trim(),
            contacto: input.contacto.trim(),
            mensaje: input.mensaje?.trim() || null,
            canal: "WEB_IA",
          });
          toolResults.push({
            type: "tool_result",
            tool_use_id: tool.id,
            content: "Lead registrado con éxito en el sistema de la agencia.",
          });
        } catch (err) {
          const mensaje = err instanceof LeadPublicoError ? err.message : "No se pudo registrar el lead";
          toolResults.push({
            type: "tool_result",
            tool_use_id: tool.id,
            content: mensaje,
            is_error: true,
          });
        }
      }

      anthropicMessages.push({ role: "user", content: toolResults });

      response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system,
        tools: [REGISTRAR_LEAD_TOOL],
        messages: anthropicMessages,
      });
    }

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );

    return NextResponse.json({
      reply: textBlock?.text.trim() || MENSAJE_NO_DISPONIBLE,
      disponible: true,
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("[chat-ia] Clave de Anthropic inválida o no configurada", dominio);
    } else if (error instanceof Anthropic.RateLimitError) {
      console.error("[chat-ia] Rate limit de la API de Anthropic", dominio);
    } else if (error instanceof Anthropic.APIError) {
      console.error("[chat-ia] Error de la API de Anthropic", dominio, error.status, error.message);
    } else {
      console.error("[chat-ia] Error inesperado", dominio, error);
    }

    return NextResponse.json({ reply: MENSAJE_NO_DISPONIBLE, disponible: false });
  }
}
