import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Mismo criterio de scoping que el resto del sistema (Panel general, Leads,
// Ventas): un VENDEDOR solo ve actividad atada a su propio vendedorId, el
// dueño/admin ve toda la de la agencia.
export async function GET() {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { tenantId, id: userId, rol } = session.user;
  const filtro =
    rol === "VENDEDOR" ? { tenantId, vendedorId: userId } : { tenantId };

  const [count, items] = await Promise.all([
    prisma.actividadLog.count({ where: { ...filtro, leido: false } }),
    prisma.actividadLog.findMany({
      where: { ...filtro, leido: false },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({ count, items });
}
