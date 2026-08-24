import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUCURSAL_COOKIE, getSucursalActual } from "@/lib/sucursalFiltro";
import { Sidebar } from "./Sidebar";
import styles from "./panel.module.css";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { tenantId, id: userId, rol } = session.user;

  const [sucursales, sucursalActual] = await Promise.all([
    prisma.sucursal.findMany({
      where: { tenantId },
      select: { id: true, nombre: true },
      orderBy: { createdAt: "asc" },
    }),
    getSucursalActual(tenantId),
  ]);

  const [stockCount, leadsCount] = await Promise.all([
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

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  async function setSucursalAction(sucursalId: string) {
    "use server";
    const store = cookies();
    if (sucursalId) {
      store.set(SUCURSAL_COOKIE, sucursalId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    } else {
      store.delete(SUCURSAL_COOKIE);
    }
    revalidatePath("/panel", "layout");
  }

  return (
    <div className={styles.app}>
      <Sidebar
        tenantNombre={session.user.tenantNombre}
        userName={session.user.name ?? session.user.email ?? ""}
        rol={session.user.rol}
        stockCount={stockCount}
        leadsCount={leadsCount}
        sucursales={sucursales}
        selectedSucursalId={sucursalActual?.id ?? null}
        onLogout={logoutAction}
        onSelectSucursal={setSucursalAction}
      />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
