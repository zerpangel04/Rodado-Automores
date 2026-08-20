import type { NextAuthConfig } from "next-auth";

/**
 * Config edge-safe: sin provider de Credentials (usa bcrypt + Prisma, que no
 * corren en el Edge Runtime del middleware). El resto de la app usa auth.ts.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isPanelRoute = request.nextUrl.pathname.startsWith("/panel");
      if (isPanelRoute) return !!auth?.user;
      return true;
    },
  },
} satisfies NextAuthConfig;
