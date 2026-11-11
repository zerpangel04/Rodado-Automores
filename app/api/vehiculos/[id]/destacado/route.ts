import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  destacado: z.boolean({ error: "Indicá si el vehículo va destacado o no" }),
});

class ErrorDestacado extends Error {
  constructor(
    message: string,
    public status: number,
    public extra: Record<string, unknown> = {}
  ) {
    super(message);
  }
}

// Marca o desmarca un vehículo como destacado en el catálogo público.
// Solo dueño y admins. Marcar respeta Plan.limiteDestacados (los vendidos
// no cuentan); desmarcar se permite siempre, aunque el plan haya bajado.
export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol === "VENDEDOR") {
    return NextResponse.json(
      { error: "Solo el dueño o un admin pueden destacar vehículos" },
      { status: 403 }
    );
  }
  const { tenantId } = session.user;

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const { destacado } = parsed.data;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // Bloquea la fila del tenant: dos marcados simultáneos del mismo
      // tenant se hacen uno después del otro y no pasan el límite.
      await tx.$queryRaw`SELECT id FROM "Tenant" WHERE id = ${tenantId} FOR UPDATE`;

      const vehiculo = await tx.vehiculo.findUnique({
        where: { id },
        select: { tenantId: true, estado: true, destacadoEn: true },
      });
      if (!vehiculo || vehiculo.tenantId !== tenantId) {
        throw new ErrorDestacado("No encontrado", 404);
      }

      const tenant = await tx.tenant.findUniqueOrThrow({
        where: { id: tenantId },
        select: { dominio: true, plan: { select: { limiteDestacados: true } } },
      });
      const limite = tenant.plan.limiteDestacados;

      if (destacado && !vehiculo.destacadoEn) {
        if (vehiculo.estado === "VENDIDO") {
          throw new ErrorDestacado("Un vehículo vendido no se puede destacar", 400);
        }
        if (limite <= 0) {
          throw new ErrorDestacado(
            "Los vehículos destacados están disponibles en los planes Profesional y Empresa.",
            403,
            { planRequerido: true }
          );
        }
        const marcados = await tx.vehiculo.count({
          where: { tenantId, destacadoEn: { not: null }, estado: { not: "VENDIDO" } },
        });
        if (marcados >= limite) {
          throw new ErrorDestacado(
            `Tu plan permite ${limite} vehículo${limite === 1 ? "" : "s"} destacado${limite === 1 ? "" : "s"}. Quitá uno para destacar otro.`,
            400,
            { limiteAlcanzado: true }
          );
        }
        await tx.vehiculo.update({ where: { id }, data: { destacadoEn: new Date() } });
      } else if (!destacado && vehiculo.destacadoEn) {
        await tx.vehiculo.update({ where: { id }, data: { destacadoEn: null } });
      }

      // Lista completa del tenant (todas las sucursales) para que el panel
      // actualice el contador y cuáles se muestran.
      const lista = await tx.vehiculo.findMany({
        where: { tenantId, destacadoEn: { not: null }, estado: { not: "VENDIDO" } },
        orderBy: { destacadoEn: "asc" },
        select: { id: true },
      });
      return { dominio: tenant.dominio, limite, marcados: lista.map((v) => v.id) };
    });

    if (resultado.dominio) revalidatePath(`/c/${resultado.dominio}`, "layout");
    return NextResponse.json({ marcados: resultado.marcados, limite: resultado.limite });
  } catch (err) {
    if (err instanceof ErrorDestacado) {
      return NextResponse.json({ error: err.message, ...err.extra }, { status: err.status });
    }
    throw err;
  }
}
