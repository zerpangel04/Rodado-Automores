import { redirect } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { CODIGO_MAX_INTENTOS, generarCodigoVerificacion, EnvioCodigoFallidoError } from "@/lib/auth";
import styles from "../../auth.module.css";
import vcStyles from "./verificar-codigo.module.css";
import { VerificarCodigoForm } from "./VerificarCodigoForm";

async function getIntentoVigente(intentoId: string) {
  if (!intentoId) return null;
  const intento = await prisma.codigoVerificacionLogin.findUnique({
    where: { id: intentoId },
    include: { usuario: { select: { email: true } } },
  });
  if (!intento) return null;
  if (intento.usedAt) return null;
  if (intento.expiresAt < new Date()) return null;
  if (intento.intentos >= CODIGO_MAX_INTENTOS) return null;
  return intento;
}

export default async function VerificarCodigoPage(
  props: {
    searchParams: Promise<{ intento?: string; callbackUrl?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = searchParams;
  const intentoId = params.intento ?? "";
  const callbackUrl = params.callbackUrl ?? "/panel";
  const intento = await getIntentoVigente(intentoId);

  async function resendCodigoAction(formData: FormData) {
    "use server";

    const intentoIdForm = String(formData.get("intentoId") ?? "");
    const callbackUrlForm = String(formData.get("callbackUrl") ?? "") || "/panel";

    // No hace falta la contraseña de nuevo: si llegó hasta acá es porque
    // ya la puso bien una vez para este mismo intento. Buscamos el usuario
    // a partir de la fila anterior (puede estar vencida/agotada, no
    // importa acá — solo la usamos para saber a quién mandarle el nuevo).
    const anterior = await prisma.codigoVerificacionLogin.findUnique({
      where: { id: intentoIdForm },
      select: { usuario: { select: { id: true, email: true } } },
    });

    if (!anterior) {
      redirect("/login");
    }

    try {
      const nuevoIntento = await generarCodigoVerificacion(anterior.usuario);
      redirect(
        `/login/verificar-codigo?intento=${nuevoIntento.id}&callbackUrl=${encodeURIComponent(callbackUrlForm)}`
      );
    } catch (error) {
      if (error instanceof EnvioCodigoFallidoError) {
        redirect("/login?error=EnvioFallido");
      }
      throw error;
    }
  }

  return (
    <div className={styles.authScreen}>
      <div className={styles.authCard}>
        <div className={vcStyles.screenEnter}>
          <div className={styles.brand}>
            <div className={styles.logoMark}>
              <Image src="/logo-icono.png" alt="" width={32} height={32} aria-hidden="true" unoptimized />
            </div>
            <span className="disp">Rodado</span>
          </div>
          <h1 className={`disp ${styles.title}`}>Verificá tu dispositivo</h1>

          {!intento ? (
            <>
              <p className={styles.subtitle}>Este código venció o ya no es válido.</p>
              <div className={styles.errorBox}>
                Volvé a iniciar sesión para que te mandemos un código nuevo.
              </div>
              <p className={styles.foot}>
                <a href="/login">Volver a iniciar sesión</a>
              </p>
            </>
          ) : (
            <>
              <p className={styles.subtitle}>
                Te enviamos un código de 4 dígitos a {intento.usuario.email}. Vence en 10 minutos.
              </p>

              <VerificarCodigoForm
                intentoId={intentoId}
                callbackUrl={callbackUrl}
                resendCodigoAction={resendCodigoAction}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
