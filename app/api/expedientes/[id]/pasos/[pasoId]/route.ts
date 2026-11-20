import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { pasoExpedienteUpdateSchema } from "@/lib/validation";
import { hoyArgentina, progreso, puedeEditarPasos } from "@/lib/tramites";
import { TX_OPCIONES } from "@/lib/transacciones";

// Tildar/destildar un paso del expediente o cambiar su fecha o nota. Pueden
// el Dueño, un Admin o el vendedor de esa venta. Cada cambio cuenta como
// movimiento (reinicia el contador de "trabado") y recalcula si el
// expediente quedó completo.
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string; pasoId: string }> }) {
  const { id, pasoId } = await props.params;
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const { tenantId, id: userId, rol } = session.user;

  const paso = await prisma.pasoExpediente.findUnique({
    where: { id: pasoId },
    include: { expediente: { select: { id: true, tenantId: true, venta: { select: { vendedorId: true } } } } },
  });
  if (!paso || paso.expedienteId !== id || paso.expediente.tenantId !== tenantId) {
    return NextResponse.json({ error: "Paso no encontrado" }, { status: 404 });
  }
  if (!puedeEditarPasos(rol, userId, paso.expediente.venta.vendedorId)) {
    return NextResponse.json({ error: "Solo el vendedor de esta venta, un admin o el dueño pueden cambiar sus trámites" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = pasoExpedienteUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const { hecho, fecha, nota } = parsed.data;

  const data: {
    hecho?: boolean;
    fecha?: Date | null;
    nota?: string | null;
    completadoPorId?: string | null;
    completadoEn?: Date | null;
  } = {};
  if (fecha !== undefined) data.fecha = fecha === null ? null : new Date(`${fecha}T00:00:00Z`);
  if (nota !== undefined) data.nota = nota ? nota : null;
  if (hecho !== undefined && hecho !== paso.hecho) {
    data.hecho = hecho;
    if (hecho) {
      data.completadoPorId = userId;
      data.completadoEn = new Date();
      // Al tildar sin fecha, se precarga hoy (se puede cambiar después).
      if (fecha === undefined && paso.fecha === null) data.fecha = new Date(`${hoyArgentina()}T00:00:00Z`);
    } else {
      data.completadoPorId = null;
      data.completadoEn = null;
    }
  }

  const ahora = new Date();
  const expediente = await prisma.$transaction(async (tx) => {
    await tx.pasoExpediente.update({ where: { id: pasoId }, data });
    const pasos = await tx.pasoExpediente.findMany({ where: { expedienteId: id }, select: { hecho: true } });
    const { completo } = progreso(pasos);
    const actual = await tx.expediente.findUniqueOrThrow({ where: { id }, select: { completadoEn: true } });
    return tx.expediente.update({
      where: { id },
      data: {
        ultimaActividadEn: ahora,
        // Se mantiene la fecha original si ya estaba completo; se borra si
        // se destildó algún paso.
        completadoEn: completo ? actual.completadoEn ?? ahora : null,
      },
      include: {
        pasos: { orderBy: { orden: "asc" }, include: { completadoPor: { select: { nombre: true } } } },
      },
    });
  }, TX_OPCIONES);

  return NextResponse.json(expediente);
}
