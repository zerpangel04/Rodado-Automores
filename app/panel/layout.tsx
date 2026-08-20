import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const [stockCount, leadsCount] = await Promise.all([
    prisma.vehiculo.count({
      where: { tenantId, estado: { not: "VENDIDO" } },
    }),
    prisma.lead.count({
      where: {
        tenantId,
        etapa: { not: "CERRADO" },
        ...(rol === "VENDEDOR" ? { vendedorId: userId } : {}),
      },
    }),
  ]);

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className={styles.app}>
      <Sidebar
        tenantNombre={session.user.tenantNombre}
        userName={session.user.name ?? session.user.email ?? ""}
        rol={session.user.rol}
        stockCount={stockCount}
        leadsCount={leadsCount}
        onLogout={logoutAction}
      />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
