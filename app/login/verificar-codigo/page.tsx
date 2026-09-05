import { redirect } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { CODIGO_MAX_INTENTOS, generarCodigoVerificacion, EnvioCodigoFallidoError } from "@/lib/auth";
import { checkRateLimit, recordRateLimitHit } from "@/lib/rateLimit";
import styles from "../../auth.module.css";
import vcStyles from "./verificar-codigo.module.css";
import { VerificarCodigoForm } from "./VerificarCodigoForm";

// Límite de reenvíos: sin esto, cualquiera con el link de esta pantalla
// (que no requiere volver a poner la contraseña) podría pedir códigos en
// cadena — saturando el envío de emails o inflando la factura de Resend.
// Dos ventanas superpuestas: una ráfaga corta (no más de 1 cada 60s) y un
// tope total por hora, las dos por cuenta (no por IP, para que alguien
// no lo esquive cambiando de red).
const RESEND_BURST_MAX = 1;
const RESEND_BURST_VENTANA_MS = 60 * 1000;
const RESEND_HORA_MAX = 5;
const RESEND_HORA_VENTANA_MS = 60 * 60 * 1000;

const RESEND_MENSAJES: Record<string, string> = {
  espera: "Esperá un minuto antes de pedir un código nuevo.",
  limite: "Ya pediste varios códigos seguidos. Esperá un rato antes de volver a intentar.",
};

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
    searchParams: Promise<{ intento?: string; callbackUrl?: string; resendError?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = searchParams;
  const intentoId = params.intento ?? "";
  const callbackUrl = params.callbackUrl ?? "/panel";
  const resendError = params.resendError ? RESEND_MENSAJES[params.resendError] : null;
  const intento = await getIntentoVigente(intentoId);

  async function resendCodigoAction(formData: FormData) {
    "use server";

    const intentoIdForm = String(formData.get("intentoId") ?? "");
    const callbackUrlForm = String(formData.get("callbackUrl") ?? "") || "/panel";
    const volverAqui = (resendErr?: string) =>
      `/login/verificar-codigo?intento=${intentoIdForm}&callbackUrl=${encodeURIComponent(callbackUrlForm)}${
        resendErr ? `&resendError=${resendErr}` : ""
      }`;

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

    // Rate limit por cuenta (no por intentoId, que cambia en cada
    // reenvío) — así alguien no lo esquiva simplemente pidiendo un
    // intento nuevo cada vez.
    const burstKey = `resend-codigo-burst:${anterior.usuario.id}`;
    const horaKey = `resend-codigo-hora:${anterior.usuario.id}`;

    const burst = await checkRateLimit(burstKey, {
      max: RESEND_BURST_MAX,
      windowMs: RESEND_BURST_VENTANA_MS,
    });
    if (!burst.allowed) {
      redirect(volverAqui("espera"));
    }
    const hora = await checkRateLimit(horaKey, {
      max: RESEND_HORA_MAX,
      windowMs: RESEND_HORA_VENTANA_MS,
    });
    if (!hora.allowed) {
      redirect(volverAqui("limite"));
    }

    await recordRateLimitHit(burstKey);
    await recordRateLimitHit(horaKey);

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

              {resendError && <div className={styles.errorBox}>{resendError}</div>}

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
