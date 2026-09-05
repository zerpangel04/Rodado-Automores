import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, CODIGO_MAX_INTENTOS } from "@/lib/auth";
import {
  DISPOSITIVO_COOKIE_NAME,
  DISPOSITIVO_MAX_AGE_SEGUNDOS,
  hashDispositivoToken,
} from "@/lib/dispositivoConfiable";

// Verificación del código de 4 dígitos desde la pantalla /login/verificar-codigo.
// Devuelve JSON en vez de redirigir para que el cliente controle el timing
// de la animación de éxito/error antes de navegar — con React 18 no hay
// useActionState/useFormState para eso vía server action.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const intentoId = typeof body?.intentoId === "string" ? body.intentoId : "";
  const codigo = typeof body?.codigo === "string" ? body.codigo.trim() : "";
  const callbackUrl = typeof body?.callbackUrl === "string" && body.callbackUrl ? body.callbackUrl : "/panel";

  if (!intentoId || !codigo) {
    return NextResponse.json({ ok: false, error: "invalido" }, { status: 400 });
  }

  let redirectUrl: string;
  try {
    redirectUrl = (await signIn("credentials", {
      modo: "codigo",
      intentoId,
      codigo,
      redirectTo: callbackUrl,
      redirect: false,
    })) as string;
  } catch (error) {
    if (error instanceof AuthError) {
      // authorize() ya registró el intento fallido (o el código venció
      // solo, por tiempo) — leemos el estado actual de la fila para
      // decidir qué mensaje devolver, sin duplicar esa lógica acá.
      const actual = await prisma.codigoVerificacionLogin.findUnique({ where: { id: intentoId } });

      if (!actual || actual.usedAt) {
        return NextResponse.json({ ok: false, error: "invalido" });
      }
      if (actual.expiresAt < new Date()) {
        return NextResponse.json({ ok: false, error: "vencido" });
      }
      if (actual.intentos >= CODIGO_MAX_INTENTOS) {
        return NextResponse.json({ ok: false, error: "bloqueado" });
      }
      return NextResponse.json({
        ok: false,
        error: "incorrecto",
        intentosRestantes: CODIGO_MAX_INTENTOS - actual.intentos,
      });
    }
    throw error;
  }

  // Código correcto y sesión creada: marcamos este navegador como
  // confiable para que la próxima vez no vuelva a pedir código.
  const intentoUsado = await prisma.codigoVerificacionLogin.findUnique({ where: { id: intentoId } });
  if (intentoUsado) {
    const dispositivoToken = randomBytes(32).toString("hex");
    await prisma.dispositivoConfiable.create({
      data: {
        usuarioId: intentoUsado.usuarioId,
        tokenHash: hashDispositivoToken(dispositivoToken),
      },
    });
    const cookieStore = await cookies();
    cookieStore.set(DISPOSITIVO_COOKIE_NAME, dispositivoToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: DISPOSITIVO_MAX_AGE_SEGUNDOS,
    });
  }

  return NextResponse.json({ ok: true, redirectUrl });
}
