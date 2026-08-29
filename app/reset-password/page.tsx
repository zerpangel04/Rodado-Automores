import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { resetPasswordInputSchema } from "@/lib/validation";
import styles from "../auth.module.css";

async function findValidToken(token: string) {
  if (!token) return null;
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt < new Date()) return null;
  return record;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; error?: string };
}) {
  const params = searchParams;
  const token = params.token ?? "";
  const validToken = await findValidToken(token);

  async function resetPasswordAction(formData: FormData) {
    "use server";

    const parsed = resetPasswordInputSchema.safeParse({
      token: formData.get("token"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      const reason =
        parsed.error.issues[0]?.path[0] === "confirmPassword"
          ? "NoCoincide"
          : "DatosInvalidos";
      redirect(`/reset-password?token=${formData.get("token")}&error=${reason}`);
    }

    const record = await findValidToken(parsed.data.token);
    if (!record) {
      redirect(`/reset-password?token=${parsed.data.token}&error=TokenInvalido`);
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: record.usuarioId },
        data: { passwordHash },
      }),
      // Invalida el token usado y cualquier otro pedido de reset pendiente
      // para el mismo usuario.
      prisma.passwordResetToken.deleteMany({
        where: { usuarioId: record.usuarioId },
      }),
    ]);

    redirect("/login?reset=1");
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
        <h1 className={`disp ${styles.title}`}>Elegir nueva contraseña</h1>

        {!validToken ? (
          <>
            <p className={styles.subtitle}>
              Este link no es válido o ya venció.
            </p>
            <div className={styles.errorBox}>
              Pedí un nuevo link desde &quot;Olvidé mi contraseña&quot;.
            </div>
            <p className={styles.foot}>
              <a href="/forgot-password">Pedir un link nuevo</a>
            </p>
          </>
        ) : (
          <>
            <p className={styles.subtitle}>Elegí una contraseña nueva para tu cuenta</p>

            {params.error === "NoCoincide" && (
              <div className={styles.errorBox}>Las contraseñas no coinciden.</div>
            )}
            {params.error === "DatosInvalidos" && (
              <div className={styles.errorBox}>
                La contraseña necesita al menos 8 caracteres.
              </div>
            )}
            {params.error === "TokenInvalido" && (
              <div className={styles.errorBox}>
                El link venció mientras completabas el formulario. Pedí uno nuevo.
              </div>
            )}

            <form action={resetPasswordAction} className={styles.form}>
              <input type="hidden" name="token" value={token} />
              <div className={styles.field}>
                <label htmlFor="password">Contraseña nueva</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Repetí la contraseña"
                />
              </div>
              <button type="submit" className={styles.submit}>
                Guardar nueva contraseña
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
