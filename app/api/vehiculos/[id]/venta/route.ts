import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { errorTopePrecioVenta, ventaInputSchema } from "@/lib/validation";
import { getCotizacionDeAgencia } from "@/lib/cotizacionAgencia";
import { registrarActividad } from "@/lib/actividad";
import { pausarPublicacionMercadoLibre } from "@/lib/mercadolibre";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = params;
  const { tenantId, id: userId, rol } = session.user;

  const vehiculo = await prisma.vehiculo.findUnique({ where: { id } });
  if (!vehiculo || vehiculo.tenantId !== tenantId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (vehiculo.estado === "VENDIDO") {
    return NextResponse.json(
      { error: "Este vehículo ya está vendido" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = ventaInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { vendedorId, compradorNombre, precioFinal, comision } = parsed.data;
  // Sin moneda explícita, la del vehículo (no un USD fijo).
  const moneda = parsed.data.moneda ?? vehiculo.moneda;
  const errorTope = errorTopePrecioVenta(precioFinal, moneda);
  if (errorTope) {
    return NextResponse.json({ error: errorTope }, { status: 400 });
  }

  if (rol === "VENDEDOR" && vendedorId !== userId) {
    return NextResponse.json(
      { error: "Solo podés registrar ventas a tu propio nombre" },
      { status: 403 }
    );
  }

  const vendedor = await prisma.usuario.findUnique({ where: { id: vendedorId } });
  if (!vendedor || vendedor.tenantId !== tenantId) {
    return NextResponse.json({ error: "Vendedor inválido" }, { status: 400 });
  }

  // Los leads vinculados a este vehículo que sigan en una etapa activa NO
  // se tocan acá: cerrarlos automáticamente los hacía desaparecer del
  // Kanban sin que nadie decidiera qué pasó con esa persona (¿se le ofrece
  // otro auto? ¿se descarta?). Esa decisión queda en manos del dueño — el
  // front ya le muestra una alerta con la lista antes de confirmar la
  // venta si hay leads activos para este vehículo.
  //
  // La cotización del momento (la que eligió la agencia) queda guardada en
  // la venta, sea en USD o en pesos: los reportes la usan para convertir
  // esta venta siempre igual, aunque el dólar cambie después. Si la fuente
  // no responde, la venta se registra igual, sin cotización.
  const cotizacion = await getCotizacionDeAgencia(tenantId);
  const [venta] = await prisma.$transaction([
    prisma.venta.create({
      data: {
        tenantId,
        vehiculoId: id,
        vendedorId,
        compradorNombre: compradorNombre || null,
        precioFinal,
        comision,
        moneda,
        cotizacion: cotizacion?.venta ?? null,
      },
    }),
    prisma.vehiculo.update({
      where: { id },
      // Un vendido deja de ser destacado (y no vuelve a serlo si se
      // revierte la venta).
      data: { estado: "VENDIDO", destacadoEn: null },
    }),
  ]);

  await registrarActividad({
    tenantId,
    tipo: "VENTA_REGISTRADA",
    descripcion: `${vehiculo.marca} ${vehiculo.modelo} — venta registrada por ${vendedor.nombre}`,
    vehiculoId: id,
    ventaId: venta.id,
    vendedorId,
  });

  await pausarPublicacionMercadoLibre(tenantId, vehiculo);

  return NextResponse.json(venta, { status: 201 });
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (session.user.rol === "VENDEDOR") {
    return NextResponse.json(
      { error: "Solo el dueño o un admin pueden revertir una venta" },
      { status: 403 }
    );
  }

  const { id } = params;
  const { tenantId } = session.user;

  const vehiculo = await prisma.vehiculo.findUnique({ where: { id } });
  if (!vehiculo || vehiculo.tenantId !== tenantId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const venta = await prisma.venta.findUnique({ where: { vehiculoId: id } });
  if (!venta || venta.tenantId !== tenantId) {
    return NextResponse.json(
      { error: "Este vehículo no tiene una venta registrada" },
      { status: 404 }
    );
  }

  // Si la comisión ya se pagó, revertir dejaría al vendedor cobrando por una
  // venta que no existe. Primero hay que anular la liquidación (v2: ajustes
  // negativos en la próxima). Ojo: la FK Restrict protege borrar la
  // liquidación, no la venta; este chequeo es la única barrera.
  if (venta.liquidacionId) {
    return NextResponse.json(
      {
        error:
          "La comisión de esta venta ya se liquidó. Anulá esa liquidación en Ventas → Comisiones y después revertí la venta.",
      },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.venta.delete({ where: { id: venta.id } }),
    prisma.vehiculo.update({ where: { id }, data: { estado: "DISPONIBLE" } }),
  ]);

  return NextResponse.json({ ok: true });
}
