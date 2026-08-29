import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { checkRateLimit, recordRateLimitHit, clearRateLimit } from "@/lib/rateLimit";

const LOGIN_MAX_INTENTOS = 5;
const LOGIN_VENTANA_MS = 15 * 60 * 1000; // 15 minutos

// Hash "de relleno" fijo para comparar contra emails que no existen — sin
// esto, un email inexistente responde instantáneo (no hay hash contra el
// que comparar) mientras uno existente con password incorrecta tarda lo
// que tarda bcrypt.compare. Esa diferencia de tiempo es una forma clásica
// de enumerar qué emails están registrados; comparar siempre contra algo
// pareja los tiempos.
const DUMMY_HASH = "$2b$10$8t56epYXlHSgQxg1R.tkjej9tSlGiNaeFVrDvQqYeOA3ajkrk2XNS";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const emailNormalizado = email.toLowerCase().trim();
        const rateLimitKey = `login:${emailNormalizado}`;

        const { allowed } = await checkRateLimit(rateLimitKey, {
          max: LOGIN_MAX_INTENTOS,
          windowMs: LOGIN_VENTANA_MS,
        });
        if (!allowed) {
          // Mismo resultado que credenciales inválidas a propósito: no le
          // damos a un atacante una señal distinta de "estás bloqueado"
          // vs. "la contraseña está mal".
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

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.email,
          tenantId: usuario.tenantId,
          tenantNombre: usuario.tenant.nombre,
          rol: usuario.rol,
        };
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
