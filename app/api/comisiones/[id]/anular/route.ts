import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { anularLiquidacionSchema } from "@/lib/validation";
import { registrarActividad } from "@/lib/actividad";
import { textoAnulacion } from "@/lib/comisiones";
import { TX_OPCIONES } from "@/lib/transacciones";

// Anula una liquidación: sus ventas vuelven a "comisión pendiente" y la
// liquidación queda registrada como anulada (cuándo y quién), con ventaIds
// como constancia. Queda en el log de actividad (el vendedor lo ve). Solo
// Dueño o Admin. También vale para las liquidaciones históricas.
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol === "VENDEDOR") {
    return NextResponse.json({ error: "Solo el dueño o un admin pueden anular una liquidación" }, { status: 403 });
  }
  const { tenantId, id: userId } = session.user;

  const body = await req.json().catch(() => ({}));
  const parsed = anularLiquidacionSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const liquidacion = await prisma.liquidacionComision.findUnique({
    where: { id },
    include: { vendedor: { select: { nombre: true } } },
  });
  if (!liquidacion || liquidacion.tenantId !== tenantId) {
    return NextResponse.json({ error: "Liquidación no encontrada" }, { status: 404 });
  }
  if (liquidacion.anuladaEn) {
    return NextResponse.json({ error: "Esta liquidación ya estaba anulada" }, { status: 409 });
  }

  // El where con anuladaEn: null evita que dos anulaciones simultáneas
  // pasen las dos (la segunda no encuentra la fila y no hace nada).
  const resultado = await prisma.$transaction(async (tx) => {
    const marcada = await tx.liquidacionComision.updateMany({
      where: { id, tenantId, anuladaEn: null },
      data: { anuladaEn: new Date(), anuladaPorId: userId },
    });
    if (marcada.count === 0) return null;
    const liberadas = await tx.venta.updateMany({
      where: { liquidacionId: id, tenantId },
      data: { liquidacionId: null },
    });
    return liberadas.count;
  }, TX_OPCIONES);

  if (resultado === null) {
    return NextResponse.json({ error: "Esta liquidación ya estaba anulada" }, { status: 409 });
  }

  await registrarActividad({
    tenantId,
    tipo: "COMISION_ANULADA",
    descripcion: textoAnulacion(
      liquidacion.vendedor.nombre,
      liquidacion.moneda,
      Number(liquidacion.total),
      resultado,
      parsed.data.motivo || null
    ),
    vendedorId: liquidacion.vendedorId,
  });

  return NextResponse.json({ ok: true, ventasLiberadas: resultado });
}
