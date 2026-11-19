import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { liquidarComisionesSchema } from "@/lib/validation";
import { registrarActividad } from "@/lib/actividad";
import { finDelDiaArgentina, sumarMontos, textoLiquidacion } from "@/lib/comisiones";

// Error de negocio dentro de la transacción: corta y devuelve este status.
class LiquidacionError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// Liquida comisiones pendientes de UN vendedor en UNA moneda. Todo en una
// transacción: si entre que se leyeron y se marcaron otra persona liquidó
// alguna, se cancela entera (nunca se paga dos veces la misma comisión).
// Solo Dueño o Admin.
export async function POST(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol === "VENDEDOR") {
    return NextResponse.json({ error: "Solo el dueño o un admin pueden liquidar comisiones" }, { status: 403 });
  }
  const { tenantId, id: userId } = session.user;

  const body = await req.json().catch(() => null);
  const parsed = liquidarComisionesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const { vendedorId, moneda, ventaIds, hasta, nota } = parsed.data;

  const vendedor = await prisma.usuario.findUnique({ where: { id: vendedorId }, select: { tenantId: true, nombre: true } });
  if (!vendedor || vendedor.tenantId !== tenantId) {
    return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 });
  }

  const corte = hasta ? finDelDiaArgentina(hasta) : null;

  try {
    const liquidacion = await prisma.$transaction(async (tx) => {
      const pendientes = await tx.venta.findMany({
        where: {
          tenantId,
          vendedorId,
          moneda,
          liquidacionId: null,
          ...(ventaIds ? { id: { in: ventaIds } } : {}),
          ...(corte ? { fecha: { lte: corte } } : {}),
        },
        select: { id: true, comision: true },
        orderBy: { fecha: "asc" },
      });

      // Primero el caso "elegí ventas puntuales y alguna ya no está
      // pendiente": el mensaje genérico de "no hay nada" confundiría.
      if (ventaIds && pendientes.length !== new Set(ventaIds).size) {
        throw new LiquidacionError(
          "Algunas de las ventas elegidas ya no están pendientes (o no son de este vendedor y moneda). Recargá la página y volvé a intentar.",
          409
        );
      }
      if (pendientes.length === 0) {
        throw new LiquidacionError("No hay comisiones pendientes para liquidar con esos filtros", 400);
      }

      const ids = pendientes.map((v) => v.id);
      const total = sumarMontos(pendientes.map((v) => Number(v.comision)));

      const creada = await tx.liquidacionComision.create({
        data: {
          tenantId,
          vendedorId,
          moneda,
          total: new Prisma.Decimal(total),
          cantidadVentas: ids.length,
          ventaIds: ids,
          nota: nota || null,
          creadaPorId: userId,
        },
      });

      // Solo las que siguen pendientes: si alguna se liquidó en paralelo, el
      // conteo no da y se deshace todo.
      const { count } = await tx.venta.updateMany({
        where: { id: { in: ids }, tenantId, liquidacionId: null },
        data: { liquidacionId: creada.id },
      });
      if (count !== ids.length) {
        throw new LiquidacionError("Otra persona liquidó algunas de estas comisiones recién. Recargá la página y volvé a intentar.", 409);
      }
      return creada;
    });

    await registrarActividad({
      tenantId,
      tipo: "COMISION_LIQUIDADA",
      descripcion: textoLiquidacion(vendedor.nombre, moneda, Number(liquidacion.total), liquidacion.cantidadVentas),
      vendedorId,
    });

    return NextResponse.json({ ...liquidacion, total: Number(liquidacion.total) });
  } catch (err) {
    if (err instanceof LiquidacionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
