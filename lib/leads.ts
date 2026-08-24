import { prisma } from "@/lib/prisma";
import type { CanalLead } from "@prisma/client";

// Lógica de creación de leads compartida entre el formulario de contacto
// público (/api/public/leads) y el asistente de IA (/api/[dominio]/chat) —
// ambos son "alguien de afuera del panel deja sus datos", solo cambia el canal.
export class LeadPublicoError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function resolverTenantPublico(dominio: string) {
  const tenant = await prisma.tenant.findUnique({ where: { dominio } });
  if (!tenant) {
    throw new LeadPublicoError("Agencia no encontrada", 404);
  }
  return tenant;
}

export async function crearLeadPublico(params: {
  tenantId: string;
  vehiculoId?: string | null;
  nombreCliente: string;
  contacto: string;
  mensaje?: string | null;
  canal: CanalLead;
}) {
  const { tenantId, vehiculoId, nombreCliente, contacto, mensaje, canal } = params;

  let vehiculoIdFinal: string | null = null;
  if (vehiculoId) {
    const vehiculo = await prisma.vehiculo.findUnique({ where: { id: vehiculoId } });
    if (!vehiculo || vehiculo.tenantId !== tenantId) {
      throw new LeadPublicoError("Vehículo no encontrado", 404);
    }
    if (vehiculo.estado === "VENDIDO") {
      throw new LeadPublicoError("Este vehículo ya no está disponible", 400);
    }
    vehiculoIdFinal = vehiculo.id;
  }

  return prisma.lead.create({
    data: {
      tenantId,
      vehiculoId: vehiculoIdFinal,
      nombreCliente,
      contacto,
      mensaje: mensaje || null,
      canal,
      etapa: "NUEVO",
    },
  });
}
