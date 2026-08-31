import type { Vehiculo } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registrarActividad } from "@/lib/actividad";

// El redirect_uri de Mercado Libre tiene que ser un string estático que
// coincida carácter por carácter con el registrado en el dashboard de la
// app — por eso va hardcodeado acá, no como env var.
const REDIRECT_URI = "https://rodado-automores.vercel.app/api/mercadolibre/callback";
const AUTH_URL = "https://auth.mercadolibre.com.ar/authorization";
const TOKEN_URL = "https://api.mercadolibre.com/oauth/token";
// "Autos y Camionetas" en Argentina, estable hace años en la API de ML.
// Usamos esta categoría fija en vez del endpoint de domain_discovery: la
// predicción por texto del título falla con nombres de modelo ambiguos
// (ej. "Golf GTI" se predijo como palos de golf, no el auto Volkswagen).
// Como acá TODO lo que publicamos es un vehículo, no hace falta "adivinar".
export const VEHICLE_CATEGORY_ID = "MLA1744";

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

export type MercadoLibreAddress = {
  address: string;
  city: string;
  state: string;
  zip_code: string;
};

/**
 * Trae la dirección ya cargada en el perfil de Mercado Libre del vendedor
 * conectado. Las publicaciones de vehículos (clasificados) exigen una
 * ubicación y no tenemos un campo de dirección de agencia en Rodado, así
 * que reusamos la que el vendedor ya cargó en su cuenta de ML.
 */
export async function getMercadoLibreAddress(
  accessToken: string
): Promise<MercadoLibreAddress | null> {
  const res = await fetch("https://api.mercadolibre.com/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.address ?? null;
}

export type MercadoLibreListingResult =
  | { ok: true; itemId: string; permalink: string; status: string }
  | { ok: false; error: string };

type MlErrorCause = { code?: string; message?: string; references?: string[] };
type MlErrorBody = { message?: string; error?: string; cause?: MlErrorCause[] };

/** Crea una publicación en Mercado Libre. Ver /publica-vehiculos en los
 * docs de ML para el shape del payload — buying_mode:"classified" es
 * obligatorio para vehículos, si no ML devuelve un error confuso sobre
 * un campo "family_name" que no aplica acá.
 *
 * Importante: ML puede devolver HTTP 402 (payment_required) con el ítem
 * YA CREADO en el body — pasa con listing_type_id pagos como "silver"
 * cuando la cuenta no tiene medio de pago cargado. Hay que chequear si
 * vino un `id` en el body antes de asumir que un status no-2xx es un
 * error real, si no perdemos publicaciones que sí se crearon. */
export async function createMercadoLibreListing(
  accessToken: string,
  payload: Record<string, unknown>
): Promise<MercadoLibreListingResult> {
  const res = await fetch("https://api.mercadolibre.com/items", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (data?.id && data?.permalink) {
    return { ok: true, itemId: data.id, permalink: data.permalink, status: data.status ?? "unknown" };
  }

  const body = data as MlErrorBody | null;
  const causeDetail = body?.cause
    ?.map((c) => c.message ?? c.code)
    .filter(Boolean)
    .join("; ");
  const error = causeDetail || body?.message || `Mercado Libre devolvió HTTP ${res.status}`;
  return { ok: false, error };
}

/**
 * Empuja a Mercado Libre lo que cambió al editar un vehículo ya publicado
 * (precio/stock y fotos/descripción), respetando los switches de la
 * conexión. Nunca tira: si algo falla, guarda el motivo en mlLastError y
 * queda registrado en el feed de actividad — la edición del vehículo en
 * Rodado ya se hizo y no depende de que esto salga bien.
 */
export async function syncVehiculoAMercadoLibre(
  tenantId: string,
  antes: Vehiculo,
  despues: Vehiculo
) {
  if (!despues.mlItemId) return;

  const conexion = await prisma.mercadoLibreConexion.findUnique({ where: { tenantId } });
  if (!conexion) return;

  const payload: Record<string, unknown> = {};
  const cambios: string[] = [];

  if (conexion.syncPrecios && Number(antes.precioUsd) !== Number(despues.precioUsd)) {
    payload.price = Number(despues.precioUsd);
    cambios.push("precio");
  }
  if (conexion.syncPrecios && antes.estado !== despues.estado && despues.estado !== "VENDIDO") {
    payload.available_quantity = despues.estado === "DISPONIBLE" ? 1 : 0;
    cambios.push("disponibilidad");
  }
  if (conexion.syncFotos && JSON.stringify(antes.fotos) !== JSON.stringify(despues.fotos)) {
    payload.pictures = despues.fotos.map((url) => ({ source: url }));
    cambios.push("fotos");
  }

  if (Object.keys(payload).length === 0) return;

  try {
    const accessToken = await getValidAccessToken(tenantId);
    if (!accessToken) return;

    const resultado = await updateMercadoLibreListing(accessToken, despues.mlItemId, payload);

    if (resultado.ok) {
      if (despues.mlLastError) {
        await prisma.vehiculo.update({ where: { id: despues.id }, data: { mlLastError: null } });
      }
      await registrarActividad({
        tenantId,
        tipo: "ML_ACTUALIZADO",
        descripcion: `${despues.marca} ${despues.modelo} — ${cambios.join(" y ")} actualizado en Mercado Libre`,
        vehiculoId: despues.id,
      });
    } else {
      await prisma.vehiculo.update({ where: { id: despues.id }, data: { mlLastError: resultado.error } });
      await registrarActividad({
        tenantId,
        tipo: "ML_ATENCION",
        descripcion: `${despues.marca} ${despues.modelo} — no se pudo sincronizar con Mercado Libre`,
        vehiculoId: despues.id,
      });
    }
  } catch (err) {
    // getValidAccessToken puede tirar si Mercado Libre rechaza el refresh
    // del token — no debe tumbar la edición del vehículo, que ya se guardó
    // en Rodado antes de llegar acá.
    console.error("Error sincronizando con Mercado Libre:", err);
    await prisma.vehiculo
      .update({ where: { id: despues.id }, data: { mlLastError: "No se pudo sincronizar con Mercado Libre" } })
      .catch(() => {});
  }
}

/**
 * Pausa la publicación en Mercado Libre cuando se registra la venta del
 * vehículo, si el switch "Pausar al vender" está activo. Mismo criterio
 * de no-fatal que syncVehiculoAMercadoLibre.
 */
export async function pausarPublicacionMercadoLibre(tenantId: string, vehiculo: Vehiculo) {
  if (!vehiculo.mlItemId) return;

  const conexion = await prisma.mercadoLibreConexion.findUnique({ where: { tenantId } });
  if (!conexion || !conexion.pausarAlVender) return;

  try {
    const accessToken = await getValidAccessToken(tenantId);
    if (!accessToken) return;

    const resultado = await updateMercadoLibreListing(accessToken, vehiculo.mlItemId, {
      status: "paused",
    });

    if (resultado.ok) {
      await registrarActividad({
        tenantId,
        tipo: "ML_PAUSADA",
        descripcion: `${vehiculo.marca} ${vehiculo.modelo} — publicación pausada en Mercado Libre por venta`,
        vehiculoId: vehiculo.id,
      });
    } else {
      await prisma.vehiculo.update({ where: { id: vehiculo.id }, data: { mlLastError: resultado.error } });
      await registrarActividad({
        tenantId,
        tipo: "ML_ATENCION",
        descripcion: `${vehiculo.marca} ${vehiculo.modelo} — no se pudo pausar la publicación en Mercado Libre`,
        vehiculoId: vehiculo.id,
      });
    }
  } catch (err) {
    console.error("Error pausando la publicación en Mercado Libre:", err);
    await prisma.vehiculo
      .update({ where: { id: vehiculo.id }, data: { mlLastError: "No se pudo pausar la publicación en Mercado Libre" } })
      .catch(() => {});
  }
}

export type MercadoLibreUpdateResult = { ok: true } | { ok: false; error: string };

/** Actualiza una publicación existente (precio, fotos, estado pausado,
 * etc.) — PUT parcial, solo hace falta mandar los campos que cambian. */
export async function updateMercadoLibreListing(
  accessToken: string,
  itemId: string,
  payload: Record<string, unknown>
): Promise<MercadoLibreUpdateResult> {
  const res = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (res.ok) return { ok: true };

  const data = await res.json().catch(() => null);
  const body = data as MlErrorBody | null;
  const causeDetail = body?.cause
    ?.map((c) => c.message ?? c.code)
    .filter(Boolean)
    .join("; ");
  const error = causeDetail || body?.message || `Mercado Libre devolvió HTTP ${res.status}`;
  return { ok: false, error };
}
