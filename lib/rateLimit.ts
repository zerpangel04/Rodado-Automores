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

/**
 * Lectura sin efectos secundarios (no inserta ni borra) para mostrarle al
 * usuario cuántos intentos le quedan / cuánto tiene que esperar — pensado
 * para usar DESPUÉS de que authorize() ya registró el intento fallido.
 * retryAfterSeconds se cuenta desde el intento MÁS VIEJO de la ventana
 * (el primero en "salir" de la ventana), no un valor fijo — así, si el
 * usuario ya esperó una parte, el número que ve baja en consecuencia en
 * vez de reiniciar en el máximo cada vez que reintenta.
 */
export async function getRateLimitStatus(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): Promise<{ count: number; remaining: number; retryAfterSeconds: number }> {
  const windowStart = new Date(Date.now() - windowMs);
  const hits = await prisma.rateLimitHit.findMany({
    where: { key, createdAt: { gte: windowStart } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  const count = hits.length;
  const remaining = Math.max(0, max - count);
  let retryAfterSeconds = 0;
  if (count > 0) {
    const oldest = hits[0].createdAt.getTime();
    retryAfterSeconds = Math.max(0, Math.ceil((oldest + windowMs - Date.now()) / 1000));
  }

  return { count, remaining, retryAfterSeconds };
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
