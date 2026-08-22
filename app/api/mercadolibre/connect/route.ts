import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { getMercadoLibreAuthUrl } from "@/lib/mercadolibre";

export async function GET(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const state = randomBytes(24).toString("hex");

  let authUrl: string;
  try {
    authUrl = getMercadoLibreAuthUrl(state);
  } catch (err) {
    console.error("Error armando la URL de autorización de Mercado Libre:", err);
    const integracionesUrl = new URL("/panel/integraciones", req.url);
    integracionesUrl.searchParams.set("ml_error", "config");
    return NextResponse.redirect(integracionesUrl);
  }

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("ml_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
