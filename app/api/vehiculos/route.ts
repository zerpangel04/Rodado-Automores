import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { vehiculoInputSchema } from "@/lib/validation";
import { getPlanTenant, evaluarLimitePlan } from "@/lib/planes";

export async function GET() {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const vehiculos = await prisma.vehiculo.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { fechaIngreso: "desc" },
  });

  return NextResponse.json(vehiculos);
}

export async function POST(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = vehiculoInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: parsed.data.sucursalId },
  });
  if (!sucursal || sucursal.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: "Sucursal inválida" }, { status: 400 });
  }

  const [plan, actualAntes] = await Promise.all([
    getPlanTenant(session.user.tenantId),
    prisma.vehiculo.count({ where: { tenantId: session.user.tenantId } }),
  ]);
  const limite = evaluarLimitePlan({
    limite: plan.limiteVehiculos,
    actualAntes,
    recurso: "vehículos",
  });
  if (limite.bloqueado) {
    return NextResponse.json(
      { error: limite.error, limiteAlcanzado: true },
      { status: 403 }
    );
  }

  const vehiculo = await prisma.vehiculo.create({
    data: {
      ...parsed.data,
      tenantId: session.user.tenantId,
    },
  });

  return NextResponse.json(
    limite.aviso ? { ...vehiculo, aviso: limite.aviso } : vehiculo,
    { status: 201 }
  );
}
