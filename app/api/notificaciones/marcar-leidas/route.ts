import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { tenantId, id: userId, rol } = session.user;
  const filtro =
    rol === "VENDEDOR" ? { tenantId, vendedorId: userId } : { tenantId };

  await prisma.actividadLog.updateMany({
    where: { ...filtro, leido: false },
    data: { leido: true },
  });

  return NextResponse.json({ ok: true });
}
