import { prisma } from "@/lib/prisma";
import { getSucursalActual } from "@/lib/sucursalFiltro";
import { Sidebar } from "./Sidebar";
import { logoutAction, setSucursalAction } from "./actions";

// Server component aparte (en vez de vivir directo en layout.tsx) para que
// sus queries corran detrás de un <Suspense> propio — así el layout en sí
// no bloquea en ellas antes de poder pintar el resto de la pantalla.
export async function SidebarData({
  tenantId,
  userId,
  rol,
  tenantNombre,
  userName,
}: {
  tenantId: string;
  userId: string;
  rol: string;
  tenantNombre: string;
  userName: string;
}) {
  const sucursalActual = await getSucursalActual(tenantId);

  const [sucursales, stockCount, leadsCount] = await Promise.all([
    prisma.sucursal.findMany({
      where: { tenantId },
      select: { id: true, nombre: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.vehiculo.count({
      where: {
        tenantId,
        estado: { not: "VENDIDO" },
        ...(sucursalActual ? { sucursalId: sucursalActual.id } : {}),
      },
    }),
    prisma.lead.count({
      where: {
        tenantId,
        etapa: { not: "CERRADO" },
        ...(rol === "VENDEDOR" ? { vendedorId: userId } : {}),
        ...(sucursalActual ? { vehiculo: { sucursalId: sucursalActual.id } } : {}),
      },
    }),
  ]);

  return (
    <Sidebar
      tenantNombre={tenantNombre}
      userName={userName}
      rol={rol}
      stockCount={stockCount}
      leadsCount={leadsCount}
      sucursales={sucursales}
      selectedSucursalId={sucursalActual?.id ?? null}
      onLogout={logoutAction}
      onSelectSucursal={setSucursalAction}
    />
  );
}
