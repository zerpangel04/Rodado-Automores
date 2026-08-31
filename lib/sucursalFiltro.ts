import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SUCURSAL_COOKIE = "sucursalId";

/**
 * Sucursal elegida en el selector del sidebar, validada contra el tenant
 * actual. Devuelve null si no hay selección o si quedó inválida (agencia
 * distinta tras un cambio de cuenta, sucursal borrada) — en ese caso se
 * ve todo consolidado ("Todas las sucursales").
 *
 * Envuelta en cache() de React: tanto el layout del panel como cada
 * page.tsx individual llaman esto con el mismo tenantId dentro del mismo
 * request — sin cache() eso son dos round-trips a la base por la misma
 * fila. cache() memoiza por (función, argumentos) durante el ciclo de
 * render del server, así el segundo llamado reusa el resultado en vez de
 * repetir la query.
 */
export const getSucursalActual = cache(async function getSucursalActual(
  tenantId: string
): Promise<{ id: string; nombre: string } | null> {
  const raw = cookies().get(SUCURSAL_COOKIE)?.value;
  if (!raw) return null;

  const sucursal = await prisma.sucursal.findFirst({
    where: { id: raw, tenantId },
    select: { id: true, nombre: true },
  });

  return sucursal;
});
