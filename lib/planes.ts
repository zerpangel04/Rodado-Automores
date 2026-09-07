import { prisma } from "@/lib/prisma";
import type { Plan } from "@prisma/client";

// Plan Básico "hardcodeado" como último recurso: solo se usa si ni el
// tenant ni la fila del plan Básico aparecen en la base (no debería pasar
// nunca en operación normal). Evita que una sesión con un tenantId
// inválido/huérfano tire un 500 en vez de degradar a los límites más
// restrictivos.
const PLAN_BASICO_FALLBACK: Plan = {
  id: "basico",
  nombre: "Básico",
  limiteSucursales: 1,
  limiteVehiculos: 25,
  limiteUsuarios: 2,
  reportesAvanzados: false,
  asistenteIA: false,
  soportePrioritario: false,
  createdAt: new Date(0),
};

// Trae el plan comercial vigente de un tenant. Nunca null ni excepción:
// si el tenant de la sesión no aparece en la base (sesión vieja apuntando
// a un tenant borrado, dato inconsistente, etc.) degrada al plan Básico
// en vez de romper la página con un 500.
export async function getPlanTenant(tenantId: string): Promise<Plan> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });
  if (tenant) return tenant.plan;

  console.error(
    `getPlanTenant: no se encontró el tenant ${tenantId} (sesión con tenantId inválido u obsoleto) — usando plan Básico por default`
  );
  const basico = await prisma.plan.findUnique({ where: { id: "basico" } });
  return basico ?? PLAN_BASICO_FALLBACK;
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
