import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import Image from "next/image";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import styles from "../../auth.module.css";

async function getIntentoVigente(intentoId: string) {
  if (!intentoId) return null;
  const intento = await prisma.googleSignupPendiente.findUnique({ where: { id: intentoId } });
  if (!intento) return null;
  if (intento.usedAt) return null;
  if (intento.expiresAt < new Date()) return null;
  return intento;
}

export default async function CompletarGoogleSignupPage(
  props: {
    searchParams: Promise<{ intento?: string; error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = searchParams;
  const intentoId = params.intento ?? "";
  const intento = await getIntentoVigente(intentoId);

  async function completarAction(formData: FormData) {
    "use server";

    const intentoIdForm = String(formData.get("intentoId") ?? "");
    const agencia = String(formData.get("agencia") ?? "").trim();

    const vigente = await getIntentoVigente(intentoIdForm);
    if (!vigente) {
      redirect("/login?error=GoogleSignupVencido");
    }
    if (!agencia) {
      redirect(`/signup/completar-google?intento=${intentoIdForm}&error=DatosInvalidos`);
    }

    // Ya se sabe que no existe por el chequeo en el callback signIn, pero
    // se vuelve a confirmar acá por si alguien completó el signup por
    // otro medio mientras tanto (ej. dos pestañas).
    const existente = await prisma.usuario.findUnique({ where: { email: vigente.email } });
    if (existente) {
      redirect("/login?error=EmailEnUso");
    }

    const baseSlug = slugify(agencia) || "agencia";
    let dominio = baseSlug;
    let intentoSlug = 1;
    while (await prisma.tenant.findUnique({ where: { dominio } })) {
      intentoSlug += 1;
      dominio = `${baseSlug}-${intentoSlug}`;
    }

    // Cuenta creada por Google: no tiene contraseña propia todavía — se
    // guarda un hash random e inutilizable. Si más adelante quiere
    // entrar también con contraseña, "olvidé mi contraseña" le permite
    // definir una sin problema (no le importa cuál sea el hash actual).
    const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

    await prisma.$transaction([
      prisma.tenant.create({
        data: {
          nombre: agencia,
          dominio,
          usuarios: {
            create: {
              nombre: vigente.nombre,
              email: vigente.email,
              passwordHash,
              rol: "DUENIO",
            },
          },
          sucursales: {
            create: { nombre: "Sucursal Principal" },
          },
        },
      }),
      prisma.googleSignupPendiente.update({
        where: { id: vigente.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // La cuenta ya existe — un segundo paso por Google (normalmente sin
    // pantalla de consentimiento de nuevo, ya que se acaba de otorgar)
    // cierra el círculo: esta vez el callback signIn la encuentra y
    // arma la sesión real.
    await signIn("google", { redirectTo: "/panel" });
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

        {!intento ? (
          <>
            <h1 className={`disp ${styles.title}`}>Este link ya no es válido</h1>
            <p className={styles.subtitle}>
              El link para completar tu cuenta venció o ya se usó. Volvé a entrar con Google para
              generar uno nuevo.
            </p>
            <p className={styles.foot}>
              <a href="/login">Volver a iniciar sesión</a>
            </p>
          </>
        ) : (
          <>
            <h1 className={`disp ${styles.title}`}>Un último paso</h1>
            <p className={styles.subtitle}>
              Entraste como {intento.nombre} ({intento.email}). Para terminar de crear tu cuenta,
              contanos el nombre de tu agencia.
            </p>

            {params.error === "DatosInvalidos" && (
              <div className={styles.errorBox}>Ingresá el nombre de tu agencia.</div>
            )}

            <form action={completarAction} className={styles.form}>
              <input type="hidden" name="intentoId" value={intentoId} />
              <div className={styles.field}>
                <label htmlFor="agencia">Nombre de la agencia</label>
                <input id="agencia" name="agencia" type="text" required placeholder="Agencia Demo" />
              </div>
              <button type="submit" className={styles.submit}>
                Crear agencia
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
