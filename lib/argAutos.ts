// Cliente para Arg Autos API (https://argautos.com/docs/api) — fuente pública
// y gratuita (sin API key) con datos CCA/ACARA/InfoAuto actualizados
// mensualmente. Se usa para traer un precio de referencia REAL al tasar un
// vehículo nuevo, como complemento de la estimación simulada de
// lib/tasacion.ts.
//
// Sin API key el servicio limita a 3 requests/min y ~30/día (headers
// X-RateLimit-* / X-DailyQuota-*), así que este módulo:
//  - nunca tira: cualquier error de red, timeout, 404/429/5xx o JSON
//    inesperado devuelve `null` (el caller cae a la estimación simulada).
//  - cachea en memoria por 24hs para no repetir la misma consulta.
import { slugify } from "@/lib/slug";

const API_BASE = "https://argautos.com/api/v1";
const FETCH_TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type SearchItem = {
  version_id: number;
  brand: string;
  brand_slug: string;
  model: string;
  model_slug: string;
  version: string;
  price: string;
  price_year: number;
};

type SearchResponse = { data: SearchItem[] };

type ValuationRow = {
  year: number;
  price: string;
};

type ValuationResponse = { data: ValuationRow[] };

export type PrecioReferenciaMercado = {
  precioUsd: number;
  anio: number;
  marca: string;
  modelo: string;
  version: string;
  fuente: "Arg Autos API";
};

const cache = new Map<string, { value: PrecioReferenciaMercado | null; expiresAt: number }>();

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Comparación laxa entre slugs: cubre variantes de escritura razonables
// ("Hilux" vs "hilux-pick-up", "Mercedes Benz" vs "mercedes-benz") sin
// aceptar coincidencias arbitrarias.
function slugsCoinciden(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a === b || a.startsWith(b) || b.startsWith(a) || a.includes(b) || b.includes(a);
}

async function buscarSinCache({
  marca,
  modelo,
  anio,
  marcaSlug,
  modeloSlug,
}: {
  marca: string;
  modelo: string;
  anio: number;
  marcaSlug: string;
  modeloSlug: string;
}): Promise<PrecioReferenciaMercado | null> {
  const query = `${marca} ${modelo}`.trim();
  const searchUrl = `${API_BASE}/search?q=${encodeURIComponent(query)}&per_page=20&sort=year_desc`;
  const searchRes = await fetchJson<SearchResponse>(searchUrl);
  if (!searchRes?.data?.length) return null;

  const candidatos = searchRes.data.filter(
    (item) => slugsCoinciden(item.brand_slug, marcaSlug) && slugsCoinciden(item.model_slug, modeloSlug)
  );
  if (candidatos.length === 0) return null;

  candidatos.sort((a, b) => Math.abs(a.price_year - anio) - Math.abs(b.price_year - anio));
  const mejor = candidatos[0];

  // El resultado de /search trae el precio de un solo año (el más reciente
  // con dato para esa versión). Si no coincide con el año del vehículo,
  // intentamos pedir el año exacto a /valuations; si no está disponible,
  // seguimos con el año que ya trajo /search.
  let precioUsd = Number(mejor.price);
  let anioEncontrado = mejor.price_year;

  if (mejor.price_year !== anio) {
    const valUrl = `${API_BASE}/versions/${mejor.version_id}/valuations?year=${anio}&currency=USD`;
    const valRes = await fetchJson<ValuationResponse>(valUrl);
    const filaExacta = valRes?.data?.[0];
    if (filaExacta) {
      precioUsd = Number(filaExacta.price);
      anioEncontrado = filaExacta.year;
    }
  }

  if (!Number.isFinite(precioUsd) || precioUsd <= 0) return null;

  return {
    precioUsd: Math.round(precioUsd),
    anio: anioEncontrado,
    marca: mejor.brand,
    modelo: mejor.model,
    version: mejor.version,
    fuente: "Arg Autos API",
  };
}

/**
 * Busca un precio de referencia real para marca/modelo/año en Arg Autos API.
 * Devuelve `null` si no hay coincidencia razonable de marca/modelo, o si el
 * servicio falla/no responde a tiempo — nunca lanza una excepción.
 */
export async function buscarPrecioReferenciaMercado({
  marca,
  modelo,
  anio,
}: {
  marca: string;
  modelo: string;
  anio: number;
}): Promise<PrecioReferenciaMercado | null> {
  const marcaSlug = slugify(marca);
  const modeloSlug = slugify(modelo);
  if (!marcaSlug || !modeloSlug || !anio) return null;

  const cacheKey = `${marcaSlug}|${modeloSlug}|${anio}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let value: PrecioReferenciaMercado | null;
  try {
    value = await buscarSinCache({ marca, modelo, anio, marcaSlug, modeloSlug });
  } catch {
    value = null;
  }

  cache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}
