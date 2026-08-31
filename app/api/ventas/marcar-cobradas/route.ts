import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (session.user.rol === "VENDEDOR") {
    return NextResponse.json(
      { error: "Solo el dueño o un admin pueden registrar el pago de comisiones" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === "string") : null;
  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: "Falta la lista de ventas a marcar" }, { status: 400 });
  }

  const { tenantId } = session.user;

  const { count } = await prisma.venta.updateMany({
    where: { id: { in: ids }, tenantId, estadoCobro: "PENDIENTE" },
    data: { estadoCobro: "COBRADO" },
  });

  return NextResponse.json({ ok: true, actualizadas: count });
}
