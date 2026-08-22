import { prisma } from "@/lib/prisma";

export async function findOwnedVehiculo(id: string, tenantId: string) {
  const vehiculo = await prisma.vehiculo.findUnique({ where: { id } });
  if (!vehiculo || vehiculo.tenantId !== tenantId) return null;
  return vehiculo;
}
