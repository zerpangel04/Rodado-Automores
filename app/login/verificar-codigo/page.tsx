import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, CODIGO_MAX_INTENTOS } from "@/lib/auth";
import {
  DISPOSITIVO_COOKIE_NAME,
  DISPOSITIVO_MAX_AGE_SEGUNDOS,
  hashDispositivoToken,
} from "@/lib/dispositivoConfiable";
import { VerificarCodigoForm } from "./VerificarCodigoForm";
import styles from "../../auth.module.css";

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
    searchParams: Promise<{ intento?: string; callbackUrl?: string; error?: string; intentos?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = searchParams;
  const intentoId = params.intento ?? "";
  const callbackUrl = params.callbackUrl ?? "/panel";
  const intento = await getIntentoVigente(intentoId);

  async function verificarCodigoAction(formData: FormData) {
    "use server";

    const intentoIdForm = String(formData.get("intentoId") ?? "");
    const codigo = String(formData.get("codigo") ?? "").trim();
    const callbackUrlForm = String(formData.get("callbackUrl") ?? "") || "/panel";

    let redirectUrl: string;
    try {
      redirectUrl = (await signIn("credentials", {
        modo: "codigo",
        intentoId: intentoIdForm,
        codigo,
        redirectTo: callbackUrlForm,
        redirect: false,
      })) as string;
    } catch (error) {
      if (error instanceof AuthError) {
        // authorize() ya registró el intento fallido (o el código venció
        // solo, por tiempo) — leemos el estado actual de la fila para
        // decidir qué mensaje mostrar, sin duplicar esa lógica acá.
        const actual = await prisma.codigoVerificacionLogin.findUnique({
          where: { id: intentoIdForm },
        });
        const qs = new URLSearchParams({ intento: intentoIdForm, callbackUrl: callbackUrlForm });

        if (!actual || actual.usedAt) {
          qs.set("error", "invalido");
        } else if (actual.expiresAt < new Date()) {
          qs.set("error", "vencido");
        } else if (actual.intentos >= CODIGO_MAX_INTENTOS) {
          qs.set("error", "bloqueado");
        } else {
          qs.set("error", "incorrecto");
          qs.set("intentos", String(CODIGO_MAX_INTENTOS - actual.intentos));
        }
        redirect(`/login/verificar-codigo?${qs.toString()}`);
      }
      throw error;
    }

    // Código correcto y sesión creada: marcamos este navegador como
    // confiable para que la próxima vez no vuelva a pedir código.
    const intentoUsado = await prisma.codigoVerificacionLogin.findUnique({
      where: { id: intentoIdForm },
    });
    if (intentoUsado) {
      const dispositivoToken = randomBytes(32).toString("hex");
      await prisma.dispositivoConfiable.create({
        data: {
          usuarioId: intentoUsado.usuarioId,
          tokenHash: hashDispositivoToken(dispositivoToken),
        },
      });
      const cookieStore = await cookies();
      cookieStore.set(DISPOSITIVO_COOKIE_NAME, dispositivoToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: DISPOSITIVO_MAX_AGE_SEGUNDOS,
      });
    }

    redirect(redirectUrl);
  }

  return (
    <div className={styles.authScreen}>
      <div className={styles.authCard}>
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
              Te enviamos un código de 6 dígitos a {intento.usuario.email}. Vence en 10 minutos.
            </p>

            <VerificarCodigoForm
              verificarCodigoAction={verificarCodigoAction}
              intentoId={intentoId}
              callbackUrl={callbackUrl}
              errorTipo={params.error}
              intentosRestantes={params.intentos}
            />
          </>
        )}
      </div>
    </div>
  );
}
