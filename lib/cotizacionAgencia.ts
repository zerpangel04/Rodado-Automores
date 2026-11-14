import { prisma } from "@/lib/prisma";
import { getCotizacion, type Cotizacion } from "@/lib/cotizacion";

// La cotización que eligió la agencia (Panel → Catálogo → General) para los
// equivalentes "≈". Separado de lib/cotizacion.ts para que ese archivo no
// dependa de Prisma (se usa también desde componentes de cliente y tests).
export async function getCotizacionDeAgencia(tenantId: string): Promise<Cotizacion | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { cotizacionPreferida: true },
  });
  return getCotizacion(tenant?.cotizacionPreferida ?? "OFICIAL");
}
