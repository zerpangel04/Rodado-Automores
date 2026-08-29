import { redirect } from "next/navigation";
import Image from "next/image";
import { AuthError } from "next-auth";
import { signIn, LOGIN_MAX_INTENTOS, LOGIN_VENTANA_MS, loginRateLimitKey } from "@/lib/auth";
import { getRateLimitStatus } from "@/lib/rateLimit";
import { LoginForm } from "./LoginForm";
import styles from "../auth.module.css";

// A partir de qué intento fallido mostramos el aviso de "te quedan N" en
// vez del mensaje genérico — con MAX=5, mostrarlo desde que quedan 2
// (o sea, ya van 3 fallidos) da margen para reaccionar sin alarmar en el
// primer error de tipeo.
const AVISO_DESDE_INTENTOS_RESTANTES = 2;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; callbackUrl?: string; reset?: string; intentos?: string; espera?: string };
}) {
  const params = searchParams;

  async function loginAction(formData: FormData) {
    "use server";
    const email = formData.get("email");
    try {
      await signIn("credentials", {
        email,
        password: formData.get("password"),
        redirectTo: (formData.get("callbackUrl") as string) || "/panel",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        // authorize() ya registró (o bloqueó) el intento — leemos ese
        // mismo estado acá para decidir qué mensaje mostrar, sin duplicar
        // la lógica de rate limit.
        if (typeof email === "string" && email.trim()) {
          const { remaining, retryAfterSeconds } = await getRateLimitStatus(
            loginRateLimitKey(email),
            { max: LOGIN_MAX_INTENTOS, windowMs: LOGIN_VENTANA_MS }
          );

          if (remaining <= 0) {
            redirect(`/login?error=bloqueado&espera=${retryAfterSeconds}`);
          }
          if (remaining <= AVISO_DESDE_INTENTOS_RESTANTES) {
            redirect(`/login?error=CredentialsSignin&intentos=${remaining}`);
          }
        }
        redirect(`/login?error=CredentialsSignin`);
      }
      throw error;
    }
  }

  return (
    <div className={styles.authScreen}>
      <div className={styles.authCard}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>
            <Image src="/logo-rodado.png" alt="Rodado" width={64} height={64} />
          </div>
          <span className="disp">Rodado</span>
        </div>
        <h1 className={`disp ${styles.title}`}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Entrá al panel de tu agencia</p>

        {params.reset === "1" && (
          <div className={styles.successBox}>
            Contraseña actualizada. Ya podés iniciar sesión.
          </div>
        )}

        <LoginForm
          loginAction={loginAction}
          callbackUrl={params.callbackUrl ?? ""}
          errorTipo={params.error}
          intentos={params.intentos}
          esperaSegundosInicial={params.espera ? Number(params.espera) : 0}
        />

        <p className={styles.foot}>
          <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
        </p>
        <p className={styles.foot}>
          ¿No tenés cuenta? <a href="/signup">Creá tu agencia</a>
        </p>
      </div>
    </div>
  );
}
