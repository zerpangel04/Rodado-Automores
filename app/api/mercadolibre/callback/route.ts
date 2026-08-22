import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/lib/mercadolibre";

export async function GET(req: NextRequest) {
  const integracionesUrl = new URL("/panel/integraciones", req.url);

  const session = await currentSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("ml_oauth_state")?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    integracionesUrl.searchParams.set("ml_error", "estado_invalido");
    const res = NextResponse.redirect(integracionesUrl);
    res.cookies.delete("ml_oauth_state");
    return res;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await prisma.mercadoLibreConexion.upsert({
      where: { tenantId: session.user.tenantId },
      create: {
        tenantId: session.user.tenantId,
        mlUserId: String(tokens.user_id),
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
      update: {
        mlUserId: String(tokens.user_id),
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });
    integracionesUrl.searchParams.set("ml_connected", "1");
  } catch (err) {
    console.error("Error conectando Mercado Libre:", err);
    integracionesUrl.searchParams.set("ml_error", "token_error");
  }

  const res = NextResponse.redirect(integracionesUrl);
  res.cookies.delete("ml_oauth_state");
  return res;
}
