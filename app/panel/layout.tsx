import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarData } from "./SidebarData";
import { SidebarSkeleton } from "./SidebarSkeleton";
import { NotificationBell } from "./NotificationBell";
import styles from "./panel.module.css";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { tenantId, id: userId, rol, tenantNombre } = session.user;
  const userName = session.user.name ?? session.user.email ?? "";

  return (
    <div className={styles.app}>
      <Suspense fallback={<SidebarSkeleton />}>
        <SidebarData
          tenantId={tenantId}
          userId={userId}
          rol={rol}
          tenantNombre={tenantNombre}
          userName={userName}
        />
      </Suspense>
      <div className={styles.desktopBell}>
        <NotificationBell />
      </div>
      <div className={styles.main}>{children}</div>
    </div>
  );
}
