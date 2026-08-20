import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    tenantId: string;
    tenantNombre: string;
    rol: string;
  }

  interface Session {
    user: {
      id: string;
      tenantId: string;
      tenantNombre: string;
      rol: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId: string;
    tenantNombre: string;
    rol: string;
  }
}
