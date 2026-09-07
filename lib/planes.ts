import { prisma } from "@/lib/prisma";
import type { Plan } from "@prisma/client";

// Trae el plan comercial vigente de un tenant. Nunca null: todo tenant
// tiene un planId válido (default "basico" en el schema).
export async function getPlanTenant(tenantId: string): Promise<Plan> {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    include: { plan: true },
  });
  return tenant.plan;
}

export type LimiteRecurso = "sucursales" | "vehículos" | "usuarios";

const RECURSO_SINGULAR: Record<LimiteRecurso, string> = {
  sucursales: "sucursal",
  vehículos: "vehículo",
  usuarios: "usuario",
};

function nombreRecurso(recurso: LimiteRecurso, cantidad: number): string {
  return cantidad === 1 ? RECURSO_SINGULAR[recurso] : recurso;
}

// Evalúa si crear una unidad más de `recurso` (contando `actualAntes`
// unidades ya existentes) respeta el límite del plan. `limite === null`
// significa sin límite (plan Empresa). Si el resultado deja al tenant a
// 3 unidades o menos del límite, se agrega un aviso preventivo — pero la
// creación igual se permite.
export function evaluarLimitePlan(params: {
  limite: number | null;
  actualAntes: number;
  recurso: LimiteRecurso;
}): { bloqueado: boolean; error?: string; aviso?: string } {
  const { limite, actualAntes, recurso } = params;

  if (limite === null) {
    return { bloqueado: false };
  }

  if (actualAntes >= limite) {
    return {
      bloqueado: true,
      error: `Llegaste al límite de ${limite} ${nombreRecurso(recurso, limite)} de tu plan actual.`,
    };
  }

  const restantesDespues = limite - (actualAntes + 1);
  if (restantesDespues <= 3) {
    return {
      bloqueado: false,
      aviso: `Estás por llegar al límite de tu plan: te quedan ${restantesDespues} ${nombreRecurso(recurso, restantesDespues)} disponibles.`,
    };
  }

  return { bloqueado: false };
}
