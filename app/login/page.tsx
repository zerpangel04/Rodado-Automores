import { redirect } from "next/navigation";
import Image from "next/image";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import styles from "../auth.module.css";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; callbackUrl?: string; reset?: string };
}) {
  const params = searchParams;

  async function loginAction(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: (formData.get("callbackUrl") as string) || "/panel",
      });
    } catch (error) {
      if (error instanceof AuthError) {
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

        {params.error && (
          <div className={styles.errorBox}>
            Email o contraseña incorrectos.
          </div>
        )}
        {params.reset === "1" && (
          <div className={styles.successBox}>
            Contraseña actualizada. Ya podés iniciar sesión.
          </div>
        )}

        <form action={loginAction} className={styles.form}>
          <input type="hidden" name="callbackUrl" value={params.callbackUrl ?? ""} />
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required placeholder="vos@agencia.com" />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" required placeholder="••••••••" />
          </div>
          <button type="submit" className={styles.submit}>
            Entrar
          </button>
        </form>

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
