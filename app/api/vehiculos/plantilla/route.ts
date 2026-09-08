import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PLANTILLA_COLUMNAS } from "@/lib/importVehiculos";

// Fila CSV: escapa el campo entre comillas solo si hace falta (contiene
// coma, comilla o salto de línea), duplicando comillas internas.
function csvCell(valor: string): string {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export async function GET() {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const sucursales = await prisma.sucursal.findMany({
    where: { tenantId: session.user.tenantId },
    select: { nombre: true },
    orderBy: { createdAt: "asc" },
  });
  const multiSucursal = sucursales.length > 1;

  const columnas = multiSucursal ? [...PLANTILLA_COLUMNAS, "sucursal"] : [...PLANTILLA_COLUMNAS];

  const hoy = new Date().toISOString().slice(0, 10);
  const nombreSucursal1 = sucursales[0]?.nombre ?? "Sucursal Principal";
  const nombreSucursal2 = sucursales[1]?.nombre ?? nombreSucursal1;

  const filasEjemplo: Record<(typeof PLANTILLA_COLUMNAS)[number] | "sucursal", string>[] = [
    {
      marca: "Toyota",
      modelo: "Corolla XEI",
      anio: "2020",
      km: "45000",
      precioUsd: "18500",
      transmision: "Automática",
      motor: "1.8L 16v",
      categoria: "Sedán",
      fechaIngreso: hoy,
      sucursal: nombreSucursal1,
    },
    {
      marca: "Volkswagen",
      modelo: "Amarok",
      anio: "2019",
      km: "62000",
      precioUsd: "27900",
      transmision: "Manual",
      motor: "2.0 TDI",
      categoria: "Pickup",
      fechaIngreso: "",
      sucursal: nombreSucursal2,
    },
    {
      marca: "Ford",
      modelo: "Ka",
      anio: "2021",
      km: "18000",
      precioUsd: "12300",
      transmision: "",
      motor: "",
      categoria: "Compacto",
      fechaIngreso: "",
      sucursal: nombreSucursal1,
    },
  ];

  const lineas = [
    columnas.join(","),
    ...filasEjemplo.map((f) => columnas.map((c) => csvCell(f[c as keyof typeof f])).join(",")),
  ];
  // BOM UTF-8 al inicio: sin esto, Excel en Windows interpreta el CSV como
  // ANSI y rompe los acentos (Sedán, Año, etc.) al abrirlo.
  const csv = "﻿" + lineas.join("\r\n") + "\r\n";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-vehiculos.csv"',
    },
  });
}
