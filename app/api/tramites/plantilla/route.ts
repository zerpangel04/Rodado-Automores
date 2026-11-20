import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { plantillaTramitesSchema } from "@/lib/validation";
import { asegurarPlantilla } from "@/lib/expedientes";
import { errorPlantilla } from "@/lib/tramites";

// Plantilla de pasos del expediente y umbral de "trabado" de la agencia.
// GET: Dueño o Admin (para verla). PUT: solo el Dueño.
export async function GET() {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol === "VENDEDOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { tenantId } = session.user;
  const [pasos, tenant] = await Promise.all([
    asegurarPlantilla(prisma, tenantId),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { diasExpedienteTrabado: true } }),
  ]);
  return NextResponse.json({
    pasos: pasos.map((p) => ({ id: p.id, nombre: p.nombre, orden: p.orden, activo: p.activo })),
    diasExpedienteTrabado: tenant.diasExpedienteTrabado,
  });
}

// Guarda la plantilla completa (en el orden recibido) y el umbral. Los
// pasos que no vienen se borran de la PLANTILLA; los expedientes ya
// creados no cambian (tienen su propia copia de los pasos).
export async function PUT(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "Solo el dueño puede cambiar los pasos del expediente" }, { status: 403 });
  }
  const { tenantId } = session.user;

  const body = await req.json().catch(() => null);
  const parsed = plantillaTramitesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const { pasos, diasExpedienteTrabado } = parsed.data;
  const error = errorPlantilla(pasos);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  // Los ids que vienen tienen que ser de esta agencia.
  const existentes = await asegurarPlantilla(prisma, tenantId);
  const idsPropios = new Set(existentes.map((p) => p.id));
  const idsRecibidos = pasos.flatMap((p) => (p.id ? [p.id] : []));
  if (idsRecibidos.some((id) => !idsPropios.has(id)) || new Set(idsRecibidos).size !== idsRecibidos.length) {
    return NextResponse.json({ error: "Algún paso no pertenece a esta plantilla. Recargá la página." }, { status: 400 });
  }

  // Transacción en lote (array) y no interactiva: con hasta 30 pasos, una
  // interactiva se pasaba del timeout de 5 s de Prisma contra Supabase.
  await prisma.$transaction([
    prisma.pasoTramitePlantilla.deleteMany({
      where: { tenantId, id: { notIn: idsRecibidos } },
    }),
    ...pasos.map((p, i) => {
      const datos = { nombre: p.nombre.trim(), activo: p.activo, orden: i + 1 };
      return p.id
        ? prisma.pasoTramitePlantilla.update({ where: { id: p.id }, data: datos })
        : prisma.pasoTramitePlantilla.create({ data: { ...datos, tenantId } });
    }),
    prisma.tenant.update({ where: { id: tenantId }, data: { diasExpedienteTrabado } }),
  ]);

  const guardada = await prisma.pasoTramitePlantilla.findMany({ where: { tenantId }, orderBy: { orden: "asc" } });
  return NextResponse.json({
    pasos: guardada.map((p) => ({ id: p.id, nombre: p.nombre, orden: p.orden, activo: p.activo })),
    diasExpedienteTrabado,
  });
}
