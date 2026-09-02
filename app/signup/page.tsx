import { redirect } from "next/navigation";
import Image from "next/image";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, CodigoRequeridoError, EnvioCodigoFallidoError } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import styles from "../auth.module.css";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const params = searchParams;

  async function signupAction(formData: FormData) {
    "use server";

    const agencia = String(formData.get("agencia") ?? "").trim();
    const nombre = String(formData.get("nombre") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!agencia || !nombre || !email || password.length < 8) {
      redirect("/signup?error=DatosInvalidos");
    }

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      redirect("/signup?error=EmailEnUso");
    }

    const baseSlug = slugify(agencia) || "agencia";
    let dominio = baseSlug;
    let intento = 1;
    while (await prisma.tenant.findUnique({ where: { dominio } })) {
      intento += 1;
      dominio = `${baseSlug}-${intento}`;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.tenant.create({
      data: {
        nombre: agencia,
        dominio,
        usuarios: {
          create: {
            nombre,
            email,
            passwordHash,
            rol: "DUENIO",
          },
        },
        sucursales: {
          create: {
            nombre: "Sucursal Principal",
          },
        },
      },
    });

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: "/panel",
      });
    } catch (error) {
      if (error instanceof CodigoRequeridoError) {
        // Cuenta recién creada = dispositivo nuevo siempre. El código ya
        // se mandó por email desde authorize(); lo llevamos a la misma
        // pantalla que usa el login para pedirlo.
        redirect(
          `/login/verificar-codigo?intento=${error.intentoId}&callbackUrl=${encodeURIComponent("/panel")}`
        );
      }
      if (error instanceof EnvioCodigoFallidoError) {
        redirect("/login?error=EnvioFallido");
      }
      if (error instanceof AuthError) {
        redirect("/login");
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
        <h1 className={`disp ${styles.title}`}>Creá tu agencia</h1>
        <p className={styles.subtitle}>
          Un usuario dueño y tu espacio de trabajo, listos en un minuto
        </p>

        {params.error === "EmailEnUso" && (
          <div className={styles.errorBox}>Ese email ya está registrado.</div>
        )}
        {params.error === "DatosInvalidos" && (
          <div className={styles.errorBox}>
            Revisá los datos: la contraseña necesita al menos 8 caracteres.
          </div>
        )}

        <form action={signupAction} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="agencia">Nombre de la agencia</label>
            <input id="agencia" name="agencia" type="text" required placeholder="Agencia Demo" />
          </div>
          <div className={styles.field}>
            <label htmlFor="nombre">Tu nombre</label>
            <input id="nombre" name="nombre" type="text" required placeholder="Juan Pérez" />
          </div>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required placeholder="vos@agencia.com" />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <button type="submit" className={styles.submit}>
            Crear agencia
          </button>
        </form>

        <p className={styles.foot}>
          ¿Ya tenés cuenta? <a href="/login">Iniciá sesión</a>
        </p>
      </div>
    </div>
  );
}
