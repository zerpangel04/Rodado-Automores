import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "../panel.module.css";
import integStyles from "./integraciones.module.css";

const errorLabel: Record<string, string> = {
  estado_invalido: "La conexión expiró o no pudimos validarla, probá de nuevo.",
  token_error: "Mercado Libre rechazó la conexión, probá de nuevo.",
  config: "Falta configurar las credenciales de Mercado Libre del lado del servidor.",
};

export default async function IntegracionesPage({
  searchParams,
}: {
  searchParams: { ml_connected?: string; ml_error?: string };
}) {
  const session = await auth();
  const { tenantId, rol } = session!.user;

  if (rol !== "DUENIO") {
    return (
      <>
        <div className={styles.topbar}>
          <div>
            <h1 className="disp">Integraciones</h1>
          </div>
        </div>
        <div className={styles.content}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Solo el dueño de la agencia puede gestionar las integraciones.
          </p>
        </div>
      </>
    );
  }

  const conexion = await prisma.mercadoLibreConexion.findUnique({ where: { tenantId } });

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className="disp">Integraciones</h1>
          <div className={styles.topbarSub}>Conectá tu agencia con otras plataformas</div>
        </div>
      </div>
      <div className={styles.content}>
        {searchParams.ml_connected === "1" && (
          <div className={`${integStyles.banner} ${integStyles.bannerSuccess}`}>
            ✓ Cuenta de Mercado Libre conectada correctamente.
          </div>
        )}
        {searchParams.ml_error && (
          <div className={`${integStyles.banner} ${integStyles.bannerError}`}>
            {errorLabel[searchParams.ml_error] ?? "No se pudo conectar con Mercado Libre."}
          </div>
        )}

        <div className={`${styles.card} ${integStyles.card}`}>
          <div className={integStyles.cardHead}>
            <div className={integStyles.logo}>ML</div>
            <div>
              <h3 className="disp">Mercado Libre</h3>
              <p>Publicá tu stock y sincronizá precios y estado automáticamente</p>
            </div>
          </div>

          {conexion ? (
            <div className={integStyles.statusRow}>
              <span className="pill pill-green">Conectada</span>
              Cuenta de Mercado Libre #{conexion.mlUserId}
            </div>
          ) : (
            <div className={integStyles.statusRow}>
              <span className="pill pill-gray">Sin conectar</span>
              Todavía no vinculaste una cuenta
            </div>
          )}

          <a href="/api/mercadolibre/connect" className={integStyles.btnPrimary}>
            {conexion ? "Reconectar con Mercado Libre" : "Conectar con Mercado Libre"} →
          </a>
        </div>
      </div>
    </>
  );
}
