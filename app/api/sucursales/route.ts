import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sucursalInputSchema } from "@/lib/validation";
import { getPlanTenant, evaluarLimitePlan } from "@/lib/planes";

export async function GET() {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const sucursales = await prisma.sucursal.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(sucursales);
}

export async function POST(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = sucursalInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [plan, actualAntes] = await Promise.all([
    getPlanTenant(session.user.tenantId),
    prisma.sucursal.count({ where: { tenantId: session.user.tenantId } }),
  ]);
  const limite = evaluarLimitePlan({
    limite: plan.limiteSucursales,
    actualAntes,
    recurso: "sucursales",
  });
  if (limite.bloqueado) {
    return NextResponse.json(
      { error: limite.error, limiteAlcanzado: true },
      { status: 403 }
    );
  }

  const sucursal = await prisma.sucursal.create({
    data: {
      ...parsed.data,
      tenantId: session.user.tenantId,
    },
  });

  return NextResponse.json(
    limite.aviso ? { ...sucursal, aviso: limite.aviso } : sucursal,
    { status: 201 }
  );
}
