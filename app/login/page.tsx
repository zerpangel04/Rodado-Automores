import { redirect } from "next/navigation";
import Image from "next/image";
import { AuthError } from "next-auth";
import { signIn, LOGIN_MAX_INTENTOS, LOGIN_VENTANA_MS, loginRateLimitKey } from "@/lib/auth";
import { getRateLimitStatus } from "@/lib/rateLimit";
import { LoginForm } from "./LoginForm";
import styles from "./login.module.css";
import authStyles from "../auth.module.css";

// A partir de qué intento fallido mostramos el aviso de "te quedan N" en
// vez del mensaje genérico — con MAX=5, mostrarlo desde que quedan 2
// (o sea, ya van 3 fallidos) da margen para reaccionar sin alarmar en el
// primer error de tipeo.
const AVISO_DESDE_INTENTOS_RESTANTES = 2;

const hitos = [
  { title: "Stock y documentación", color: "var(--accent)" },
  { title: "Catálogo y Mercado Libre", color: "var(--warn)" },
  { title: "Leads y ventas", color: "var(--success)" },
];

export default async function LoginPage(
  props: {
    searchParams: Promise<{ error?: string; callbackUrl?: string; reset?: string; intentos?: string; espera?: string }>;
  }
) {
  const searchParams = await props.searchParams;
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
    <div className={styles.wrap}>
      <div className={styles.left}>
        <div className={styles.headerRow}>
          <div className={styles.brand}>
            <div className={styles.logoMark}>
              <Image src="/logo-rodado.png" alt="Rodado" width={64} height={64} />
            </div>
            <span className={styles.brandName}>Rodado</span>
          </div>
          <span className={styles.panelLabel}>Panel de gestión</span>
        </div>

        <div className={styles.formArea}>
          <div className={styles.heading}>
            <h1>Bienvenido de nuevo</h1>
            <p>Entrá con tu cuenta para seguir gestionando tu agencia.</p>
          </div>

          {params.reset === "1" && (
            <div className={authStyles.successBox}>Contraseña actualizada. Ya podés iniciar sesión.</div>
          )}

          <LoginForm
            loginAction={loginAction}
            callbackUrl={params.callbackUrl ?? ""}
            errorTipo={params.error}
            intentos={params.intentos}
            esperaSegundosInicial={params.espera ? Number(params.espera) : 0}
          />

          <p className={authStyles.foot} style={{ margin: 0, textAlign: "left" }}>
            ¿Todavía no tenés cuenta? <a href="/signup">Creá tu agencia →</a>
          </p>
        </div>

        <div className={styles.footRow}>
          <div className={styles.trustRow}>
            <span className={styles.trustDot} />
            Conexión cifrada · Los datos de tu agencia están aislados del resto
          </div>
          <a href="/forgot-password" className={styles.problemsLink}>
            ¿Problemas para entrar?
          </a>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.rightBg} />
        <div className={styles.rightGlow} />
        <div className={styles.rightPattern} />

        <div className={styles.rightMark}>
          <Image src="/logo-rodado.png" alt="" width={40} height={40} aria-hidden="true" />
        </div>

        <div className={styles.rightContent}>
          <div className={styles.rightTitle}>
            Hola de nuevo,
            <br />
            bienvenido a <span className={styles.hl}>Rodado</span>.
          </div>
          <div className={styles.rightSubtitle}>
            Dejá el Excel y los mensajes sueltos. Stock, documentación, compradores y ventas de tu
            concesionaria, ordenados en un solo lugar.
          </div>
          <div className={styles.hitos}>
            {hitos.map((h) => (
              <span key={h.title} className={styles.hito}>
                <span className={styles.hitoDot} style={{ background: h.color }} />
                {h.title}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.rightFooter}>© {new Date().getFullYear()} Rodado. Todos los derechos reservados.</div>
      </div>
    </div>
  );
}
