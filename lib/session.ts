import { auth } from "@/lib/auth";

/**
 * Sesión + tenant actual para usar en API routes. Devuelve null si no hay
 * usuario autenticado — cada route decide cómo responder (401, redirect, etc.)
 */
export async function currentSession() {
  const session = await auth();
  if (!session?.user?.tenantId) return null;
  return session;
}
