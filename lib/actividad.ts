import { prisma } from "@/lib/prisma";
import type { TipoActividad } from "@prisma/client";

// Registra un evento en el feed de "Actividad reciente" del Panel general.
// Se llama desde cada punto donde ya pasa la acción real (crear un lead,
// cambiar de etapa, registrar una venta, reservar un vehículo) — nunca a
// mano. Nunca debe tumbar la operación principal: si falla, se loguea y
// listo, la acción real ya se hizo.
export async function registrarActividad(params: {
  tenantId: string;
  tipo: TipoActividad;
  descripcion: string;
  leadId?: string | null;
  vehiculoId?: string | null;
  ventaId?: string | null;
  vendedorId?: string | null;
}) {
  try {
    await prisma.actividadLog.create({
      data: {
        tenantId: params.tenantId,
        tipo: params.tipo,
        descripcion: params.descripcion,
        leadId: params.leadId ?? null,
        vehiculoId: params.vehiculoId ?? null,
        ventaId: params.ventaId ?? null,
        vendedorId: params.vendedorId ?? null,
      },
    });
  } catch (err) {
    console.error("No se pudo registrar actividad:", err);
  }
}
