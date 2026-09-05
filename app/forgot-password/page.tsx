import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { forgotPasswordInputSchema } from "@/lib/validation";
import { sendPasswordResetEmail } from "@/lib/email";
import styles from "../auth.module.css";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function getBaseUrl(hdrs: Headers) {
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${proto}://${host}`;
}

export default async function ForgotPasswordPage(
  props: {
    searchParams: Promise<{ sent?: string; error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = searchParams;

  async function forgotPasswordAction(formData: FormData) {
    "use server";

    const parsed = forgotPasswordInputSchema.safeParse({
      email: formData.get("email"),
    });
    if (!parsed.success) {
      redirect("/forgot-password?error=EmailInvalido");
    }

    const { email } = parsed.data;
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    // Siempre respondemos igual, exista o no el email, para no filtrar
    // qué emails están registrados.
    if (usuario) {
      const token = randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: {
          token,
          usuarioId: usuario.id,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      });

      const baseUrl = getBaseUrl(await headers());
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      try {
        await sendPasswordResetEmail(usuario.email, resetUrl);
      } catch (err) {
        console.error("No se pudo enviar el email de reset:", err);
      }
    }

    redirect("/forgot-password?sent=1");
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
        <h1 className={`disp ${styles.title}`}>Recuperar contraseña</h1>
        <p className={styles.subtitle}>
          Te enviamos un link para elegir una contraseña nueva
        </p>

        {params.error === "EmailInvalido" && (
          <div className={styles.errorBox}>Ingresá un email válido.</div>
        )}

        {params.sent === "1" ? (
          <div className={styles.successBox}>
            Si el email existe, te enviamos un link para restablecer tu contraseña.
          </div>
        ) : (
          <form action={forgotPasswordAction} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required placeholder="vos@agencia.com" />
            </div>
            <button type="submit" className={styles.submit}>
              Enviar link
            </button>
          </form>
        )}

        <p className={styles.foot}>
          <a href="/login">Volver a iniciar sesión</a>
        </p>
      </div>
    </div>
  );
}
