import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPlanTenant } from "@/lib/planes";
import { validarFilasImportacion, aplicarLimitePlanImportacion } from "@/lib/importVehiculos";

// Solo valida el CSV y simula el límite del plan — no crea nada en la
// base. La confirmación real vuelve a correr esta misma validación en
// /api/vehiculos/importar/confirmar en vez de confiar en lo que este
// endpoint le devolvió al cliente.
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
  const { importables, omitidosPorLimite, limiteAlcanzado, errorLimite, avisoLimite } =
    aplicarLimitePlanImportacion(validas, plan, actualAntes);
  const idsImportables = new Set(importables.map((f) => f.numeroFila));

  return NextResponse.json({
    filas: filas.map((f) => ({
      numeroFila: f.numeroFila,
      marca: f.marca,
      modelo: f.modelo,
      anio: f.anio,
      precioUsd: f.precioUsd,
      sucursalNombre: f.sucursalNombre,
      error: f.error,
      excedeLimite: f.datos !== null && !idsImportables.has(f.numeroFila),
    })),
    resumen: {
      total: filas.length,
      validas: validas.length,
      conError: filas.length - validas.length,
      importables: importables.length,
      omitidosPorLimite,
      limiteAlcanzado,
      errorLimite,
      avisoLimite,
    },
  });
}
