import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EquipoView, type UsuarioDTO } from "./EquipoView";
import styles from "../panel.module.css";

export default async function EquipoPage() {
  const session = await auth();
  const { tenantId, rol, id: userId } = session!.user;

  if (rol !== "DUENIO") {
    return (
      <>
        <div className={styles.topbar}>
          <div>
            <h1 className="disp">Equipo</h1>
          </div>
        </div>
        <div className={styles.content}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Solo el dueño de la agencia puede gestionar el equipo.
          </p>
        </div>
      </>
    );
  }

  const usuarios = await prisma.usuario.findMany({
    where: { tenantId },
    select: { id: true, nombre: true, email: true, rol: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Equipo</h1>
          <div className={styles.topbarSub}>
            Dueño, admins y vendedores de tu agencia
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <EquipoView initialItems={usuarios as UsuarioDTO[]} userId={userId} />
      </div>
    </>
  );
}
