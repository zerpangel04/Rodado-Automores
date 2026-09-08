import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPlanTenant } from "@/lib/planes";
import { validarFilasImportacion, aplicarLimitePlanImportacion } from "@/lib/importVehiculos";

// Vuelve a parsear y validar el mismo CSV que ya pasó por preview, en vez
// de confiar en filas "ya validadas" que mande el cliente — así no hay
// forma de saltear la validación ni el límite del plan armando el body a
// mano, y el límite se evalúa con el conteo real al momento de confirmar
// (pudo haber cambiado desde que se pidió el preview).
export async function POST(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const csv = typeof body?.csv === "string" ? body.csv : null;
  if (!csv) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  }

  const { tenantId } = session.user;
  const [sucursales, plan, actualAntes] = await Promise.all([
    prisma.sucursal.findMany({ where: { tenantId }, select: { id: true, nombre: true } }),
    getPlanTenant(tenantId),
    prisma.vehiculo.count({ where: { tenantId } }),
  ]);

  const { filas, errorGeneral } = validarFilasImportacion(csv, sucursales);
  if (errorGeneral) {
    return NextResponse.json({ error: errorGeneral }, { status: 400 });
  }

  const validas = filas.filter((f) => f.datos !== null);
  if (validas.length === 0) {
    return NextResponse.json(
      { error: "No hay ninguna fila válida para importar", creados: 0 },
      { status: 400 }
    );
  }

  const { importables, omitidosPorLimite, limiteAlcanzado, errorLimite, avisoLimite } =
    aplicarLimitePlanImportacion(validas, plan, actualAntes);

  if (importables.length === 0) {
    return NextResponse.json(
      { error: errorLimite, limiteAlcanzado: true, creados: 0 },
      { status: 403 }
    );
  }

  await prisma.vehiculo.createMany({
    data: importables.map((f) => ({ tenantId, ...f.datos! })),
  });

  return NextResponse.json(
    {
      creados: importables.length,
      omitidosPorError: filas.length - validas.length,
      omitidosPorLimite,
      limiteAlcanzado,
      aviso: avisoLimite,
    },
    { status: 201 }
  );
}
