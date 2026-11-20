// Acceso a la base para expedientes de trámites (la lógica pura está en
// lib/tramites.ts). Reciben `db` para poder usarse dentro de una
// transacción o con el cliente normal.
import type { Prisma, PrismaClient } from "@prisma/client";
import { pasosParaExpediente, plantillaDefault } from "@/lib/tramites";

type Db = PrismaClient | Prisma.TransactionClient;

// Plantilla de pasos de la agencia. Si todavía no tiene (primera vez que usa
// Trámites o registra una venta), se crea con la lista por defecto.
export async function asegurarPlantilla(db: Db, tenantId: string) {
  const existentes = await db.pasoTramitePlantilla.findMany({
    where: { tenantId },
    orderBy: { orden: "asc" },
  });
  if (existentes.length > 0) return existentes;
  await db.pasoTramitePlantilla.createMany({
    data: plantillaDefault().map((p) => ({ ...p, tenantId })),
  });
  return db.pasoTramitePlantilla.findMany({ where: { tenantId }, orderBy: { orden: "asc" } });
}

// Crea el expediente de una venta copiando los pasos activos de la plantilla
// (los cambios futuros de la plantilla no lo afectan).
export async function crearExpediente(db: Db, tenantId: string, ventaId: string) {
  const plantilla = await asegurarPlantilla(db, tenantId);
  const pasos = pasosParaExpediente(plantilla);
  return db.expediente.create({
    data: {
      tenantId,
      ventaId,
      pasos: { create: pasos },
    },
    include: { pasos: { orderBy: { orden: "asc" } } },
  });
}
