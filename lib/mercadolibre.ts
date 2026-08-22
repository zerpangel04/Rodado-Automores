import { prisma } from "@/lib/prisma";

// El redirect_uri de Mercado Libre tiene que ser un string estático que
// coincida carácter por carácter con el registrado en el dashboard de la
// app — por eso va hardcodeado acá, no como env var.
const REDIRECT_URI = "https://rodado-automores.vercel.app/api/mercadolibre/callback";
const AUTH_URL = "https://auth.mercadolibre.com.ar/authorization";
const TOKEN_URL = "https://api.mercadolibre.com/oauth/token";

// Margen antes de que expire el access_token para disparar el refresh.
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
};

function getClientCredentials() {
  const clientId = process.env.MERCADOLIBRE_CLIENT_ID;
  const clientSecret = process.env.MERCADOLIBRE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Faltan configurar MERCADOLIBRE_CLIENT_ID / MERCADOLIBRE_CLIENT_SECRET");
  }
  return { clientId, clientSecret };
}

export function getMercadoLibreAuthUrl(state: string) {
  const { clientId } = getClientCredentials();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    // offline_access es lo que habilita que ML emita un refresh_token.
    scope: "offline_access read write",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function requestToken(body: Record<string, string>): Promise<TokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      ...body,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Mercado Libre rechazó el pedido de token (${res.status}): ${detail}`);
  }

  return res.json();
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  return requestToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  });
}

async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  return requestToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

/**
 * Devuelve un access_token vigente para el tenant, renovándolo con el
 * refresh_token si está por vencer. Devuelve null si la agencia no
 * conectó su cuenta de Mercado Libre.
 */
export async function getValidAccessToken(tenantId: string): Promise<string | null> {
  const conexion = await prisma.mercadoLibreConexion.findUnique({ where: { tenantId } });
  if (!conexion) return null;

  const vigente = conexion.expiresAt.getTime() - Date.now() > EXPIRY_BUFFER_MS;
  if (vigente) return conexion.accessToken;

  const tokens = await refreshTokens(conexion.refreshToken);
  await prisma.mercadoLibreConexion.update({
    where: { tenantId },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      mlUserId: String(tokens.user_id),
    },
  });

  return tokens.access_token;
}
