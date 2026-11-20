import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { iniciarExpedienteSchema } from "@/lib/validation";
import { crearExpediente } from "@/lib/expedientes";
import { TX_OPCIONES } from "@/lib/transacciones";
import { puedeEditarPasos } from "@/lib/tramites";

// "Iniciar expediente" para una venta que no lo tiene (las registradas antes
// de que existieran los trámites; las nuevas lo crean solas). Pueden el
// Dueño, un Admin o el vendedor de esa venta.
export async function POST(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const { tenantId, id: userId, rol } = session.user;

  const body = await req.json().catch(() => null);
  const parsed = iniciarExpedienteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const venta = await prisma.venta.findUnique({
    where: { id: parsed.data.ventaId },
    select: { id: true, tenantId: true, vendedorId: true, expediente: { select: { id: true } } },
  });
  if (!venta || venta.tenantId !== tenantId) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }
  if (!puedeEditarPasos(rol, userId, venta.vendedorId)) {
    return NextResponse.json({ error: "Solo el vendedor de esta venta, un admin o el dueño pueden iniciar su expediente" }, { status: 403 });
  }
  if (venta.expediente) {
    return NextResponse.json({ error: "Esta venta ya tiene expediente" }, { status: 409 });
  }

  try {
    const expediente = await prisma.$transaction((tx) => crearExpediente(tx, tenantId, venta.id), TX_OPCIONES);
    return NextResponse.json(expediente);
  } catch (err) {
    // Dos "Iniciar" a la vez: el índice único de ventaId frena el segundo.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Esta venta ya tiene expediente" }, { status: 409 });
    }
    throw err;
  }
}
