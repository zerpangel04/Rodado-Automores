import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LandingView, type PlanPublico } from "./LandingView";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/panel");

  const planesDb = await prisma.plan.findMany({ orderBy: { createdAt: "asc" } });
  const planes: PlanPublico[] = planesDb.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precioUsd: Number(p.precioUsd),
    limiteSucursales: p.limiteSucursales,
    limiteVehiculos: p.limiteVehiculos,
    limiteUsuarios: p.limiteUsuarios,
    reportesAvanzados: p.reportesAvanzados,
    asistenteIA: p.asistenteIA,
    soportePrioritario: p.soportePrioritario,
  }));

  return <LandingView planes={planes} />;
}
