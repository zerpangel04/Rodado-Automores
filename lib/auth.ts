import { randomInt } from "crypto";
import { cookies } from "next/headers";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { checkRateLimit, recordRateLimitHit, clearRateLimit } from "@/lib/rateLimit";
import { sendLoginVerificationEmail } from "@/lib/email";
import { DISPOSITIVO_COOKIE_NAME, hashDispositivoToken } from "@/lib/dispositivoConfiable";

// Exportadas para que app/login/page.tsx pueda leer el mismo estado de
// rate limit después de un intento fallido y mostrar el aviso progresivo
// ("te quedan N intentos" / "esperá M minutos") con los mismos números
// que usó authorize() acá abajo.
export const LOGIN_MAX_INTENTOS = 5;
export const LOGIN_VENTANA_MS = 15 * 60 * 1000; // 15 minutos
export const loginRateLimitKey = (email: string) => `login:${email.toLowerCase().trim()}`;

// Verificación de dispositivo nuevo: código de 4 dígitos, un solo uso,
// máximo CODIGO_MAX_INTENTOS intentos antes de invalidarlo, vence a los
// CODIGO_TTL_MS.
export const CODIGO_MAX_INTENTOS = 5;
export const CODIGO_TTL_MS = 10 * 60 * 1000; // 10 minutos

// Lanzado desde authorize() cuando la contraseña es correcta pero el
// dispositivo no está marcado como confiable — ya se generó y mandó el
// código por email; app/login/page.tsx atrapa este error puntual (antes
// que el catch genérico de AuthError) para mandar al usuario a la pantalla
// de "ingresá el código" en vez de mostrar "credenciales inválidas".
export class CodigoRequeridoError extends CredentialsSignin {
  intentoId: string;
  constructor(intentoId: string) {
    super();
    this.intentoId = intentoId;
  }
}

// Lanzado cuando la contraseña es correcta pero Resend falló al mandar el
// código — distinto de "credenciales inválidas" para no confundir al
// usuario con un mensaje que sugiera que escribió mal el email/contraseña.
export class EnvioCodigoFallidoError extends CredentialsSignin {}

// Hash "de relleno" fijo para comparar contra emails que no existen — sin
// esto, un email inexistente responde instantáneo (no hay hash contra el
// que comparar) mientras uno existente con password incorrecta tarda lo
// que tarda bcrypt.compare. Esa diferencia de tiempo es una forma clásica
// de enumerar qué emails están registrados; comparar siempre contra algo
// pareja los tiempos.
const DUMMY_HASH = "$2b$10$8t56epYXlHSgQxg1R.tkjej9tSlGiNaeFVrDvQqYeOA3ajkrk2XNS";

// Genera un código de 4 dígitos, lo manda por email y crea la fila de
// intento — usado tanto por authorize() (primer envío) como por la acción
// de "reenviar" en la pantalla de verificación (mismo criterio, sin volver
// a pedir la contraseña).
export async function generarCodigoVerificacion(usuario: { id: string; email: string }) {
  const codigoPlano = randomInt(0, 10_000).toString().padStart(4, "0");

  try {
    await sendLoginVerificationEmail(usuario.email, codigoPlano);
  } catch (err) {
    console.error("No se pudo enviar el código de verificación:", err);
    throw new EnvioCodigoFallidoError();
  }

  const codigoHash = await bcrypt.hash(codigoPlano, 10);
  return prisma.codigoVerificacionLogin.create({
    data: {
      usuarioId: usuario.id,
      codigoHash,
      expiresAt: new Date(Date.now() + CODIGO_TTL_MS),
    },
  });
}

function usuarioToSessionUser(usuario: {
  id: string;
  nombre: string;
  email: string;
  tenantId: string;
  tenant: { nombre: string };
  rol: string;
}) {
  return {
    id: usuario.id,
    name: usuario.nombre,
    email: usuario.email,
    tenantId: usuario.tenantId,
    tenantNombre: usuario.tenant.nombre,
    rol: usuario.rol,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
        // Solo se usan en el segundo paso (pantalla de "ingresá el código");
        // el primer paso (email + password) no los manda.
        modo: { label: "Modo", type: "text" },
        intentoId: { label: "Intento", type: "text" },
        codigo: { label: "Código", type: "text" },
      },
      async authorize(credentials) {
        // Segundo paso del login en dispositivo nuevo: el usuario ya pasó
        // la contraseña (por eso existe intentoId) y ahora manda el código
        // de 4 dígitos que le llegó por email.
        if (credentials?.modo === "codigo") {
          const intentoId = credentials.intentoId;
          const codigoIngresado = credentials.codigo;
          if (typeof intentoId !== "string" || typeof codigoIngresado !== "string") {
            return null;
          }

          const intento = await prisma.codigoVerificacionLogin.findUnique({
            where: { id: intentoId },
            include: { usuario: { include: { tenant: true } } },
          });

          const vigente =
            !!intento &&
            !intento.usedAt &&
            intento.expiresAt > new Date() &&
            intento.intentos < CODIGO_MAX_INTENTOS;

          if (!vigente || !intento) {
            return null;
          }

          const codigoValido = await bcrypt.compare(codigoIngresado, intento.codigoHash);
          if (!codigoValido) {
            await prisma.codigoVerificacionLogin.update({
              where: { id: intentoId },
              data: { intentos: { increment: 1 } },
            });
            return null;
          }

          await prisma.codigoVerificacionLogin.update({
            where: { id: intentoId },
            data: { usedAt: new Date() },
          });

          return usuarioToSessionUser(intento.usuario);
        }

        // Primer paso: email + contraseña, como siempre.
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const emailNormalizado = email.toLowerCase().trim();
        const rateLimitKey = loginRateLimitKey(emailNormalizado);

        const { allowed } = await checkRateLimit(rateLimitKey, {
          max: LOGIN_MAX_INTENTOS,
          windowMs: LOGIN_VENTANA_MS,
        });
        if (!allowed) {
          // authorize() en sí no distingue "bloqueado" de "credenciales
          // inválidas" — devuelve null en los dos casos, así que nunca
          // corre bcrypt de más ni cambia de forma el flujo interno de
          // NextAuth. El aviso de "te quedan N intentos" / "esperá M
          // minutos" lo arma app/login/page.tsx aparte, leyendo el estado
          // del rate limit después del intento (ver loginAction).
          return null;
        }

        const usuario = await prisma.usuario.findUnique({
          where: { email: emailNormalizado },
          include: { tenant: true },
        });

        const valido = await bcrypt.compare(
          password,
          usuario?.passwordHash ?? DUMMY_HASH
        );

        if (!usuario || !valido) {
          await recordRateLimitHit(rateLimitKey);
          return null;
        }

        await clearRateLimit(rateLimitKey);

        // Dispositivo ya verificado antes para este usuario -> login
        // directo, sin pedir código de nuevo.
        const cookieStore = await cookies();
        const dispositivoToken = cookieStore.get(DISPOSITIVO_COOKIE_NAME)?.value;
        if (dispositivoToken) {
          const dispositivo = await prisma.dispositivoConfiable.findFirst({
            where: {
              usuarioId: usuario.id,
              tokenHash: hashDispositivoToken(dispositivoToken),
            },
          });
          if (dispositivo) {
            await prisma.dispositivoConfiable.update({
              where: { id: dispositivo.id },
              data: { ultimoUso: new Date() },
            });
            return usuarioToSessionUser(usuario);
          }
        }

        // Dispositivo nuevo (o cookie borrada): generamos un código de un
        // solo uso y lo mandamos por email antes de dar la contraseña por
        // buena del todo.
        const intento = await generarCodigoVerificacion(usuario);
        throw new CodigoRequeridoError(intento.id);
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = user.tenantId;
        token.tenantNombre = user.tenantNombre;
        token.rol = user.rol;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.tenantId = token.tenantId as string;
        session.user.tenantNombre = token.tenantNombre as string;
        session.user.rol = token.rol as string;
      }
      return session;
    },
  },
});
