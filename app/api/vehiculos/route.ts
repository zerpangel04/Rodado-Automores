import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { vehiculoInputSchema } from "@/lib/validation";

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

  const vehiculo = await prisma.vehiculo.create({
    data: {
      ...parsed.data,
      tenantId: session.user.tenantId,
    },
  });

  return NextResponse.json(vehiculo, { status: 201 });
}
