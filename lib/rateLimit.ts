import { prisma } from "@/lib/prisma";

/**
 * Rate limit genérico basado en la tabla RateLimitHit (una fila por
 * intento). Pensado para volumen bajo/medio — cuenta cuántas filas hay
 * para `key` dentro de `windowMs`, y de paso borra las de esa key que ya
 * vencieron para que la tabla no crezca sin límite.
 *
 * No inserta la fila automáticamente: quien llama decide qué cuenta como
 * "intento" (ej. login: solo los fallidos; formularios: cada request).
 */
export async function checkRateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - windowMs);

  await prisma.rateLimitHit.deleteMany({
    where: { key, createdAt: { lt: windowStart } },
  });

  const count = await prisma.rateLimitHit.count({
    where: { key, createdAt: { gte: windowStart } },
  });

  return { allowed: count < max, remaining: Math.max(0, max - count) };
}

export async function recordRateLimitHit(key: string) {
  await prisma.rateLimitHit.create({ data: { key } });
}

export async function clearRateLimit(key: string) {
  await prisma.rateLimitHit.deleteMany({ where: { key } });
}

/**
 * IP del visitante detrás del proxy de Vercel. x-forwarded-for puede traer
 * una lista "cliente, proxy1, proxy2" — el primer valor es el visitante
 * real. Sin esa cabecera (dev local) cae a un valor fijo, así el rate
 * limit sigue funcionando (todos los requests locales comparten bucket)
 * en vez de quedar deshabilitado silenciosamente.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "desconocida";
}
