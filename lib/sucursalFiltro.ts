import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SUCURSAL_COOKIE = "sucursalId";

/**
 * Sucursal elegida en el selector del sidebar, validada contra el tenant
 * actual. Devuelve null si no hay selección o si quedó inválida (agencia
 * distinta tras un cambio de cuenta, sucursal borrada) — en ese caso se
 * ve todo consolidado ("Todas las sucursales").
 */
export async function getSucursalActual(
  tenantId: string
): Promise<{ id: string; nombre: string } | null> {
  const raw = cookies().get(SUCURSAL_COOKIE)?.value;
  if (!raw) return null;

  const sucursal = await prisma.sucursal.findFirst({
    where: { id: raw, tenantId },
    select: { id: true, nombre: true },
  });

  return sucursal;
}
