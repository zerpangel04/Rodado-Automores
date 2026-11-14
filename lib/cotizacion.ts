// Cotización del dólar (oficial o blue) para mostrar equivalentes entre
// pesos y dólares. Misma fuente y mismo dato que el resto del sistema
// (FxBox en el panel, Ventas, ficha de lead, Tu plan): dolarapi.com, precio
// de venta. FxBox la consulta desde el navegador; esto es para el servidor.

export type TipoCotizacion = "OFICIAL" | "BLUE";

export type Cotizacion = {
  tipo: TipoCotizacion;
  // Precio de venta del dólar, en pesos.
  venta: number;
  // Fecha y hora de esa cotización según la fuente (ISO).
  fecha: string;
};

const URL_BASE = "https://dolarapi.com/v1/dolares/";
const CASA: Record<TipoCotizacion, string> = { OFICIAL: "oficial", BLUE: "blue" };
// La caché de datos de Next la comparte entre visitas (y entre instancias en
// Vercel): no se consulta la API en cada carga del catálogo.
const REVALIDAR_SEGUNDOS = 15 * 60;
// Si la API no responde, se usa la última cotización buena de este servidor
// (de ese tipo) mientras no tenga más de 48 h; si no hay ninguna, no se
// muestra el equivalente (nunca un número escrito a mano).
const MAX_ANTIGUEDAD_RESPALDO_MS = 48 * 60 * 60 * 1000;

const ultimaBuena: Partial<Record<TipoCotizacion, { cotizacion: Cotizacion; guardada: number }>> = {};

export async function getCotizacion(tipo: TipoCotizacion): Promise<Cotizacion | null> {
  try {
    const res = await fetch(URL_BASE + CASA[tipo], { next: { revalidate: REVALIDAR_SEGUNDOS } });
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.venta === "number" && data.venta > 0) {
        const cotizacion: Cotizacion = {
          tipo,
          venta: data.venta,
          fecha: typeof data.fechaActualizacion === "string" ? data.fechaActualizacion : new Date().toISOString(),
        };
        ultimaBuena[tipo] = { cotizacion, guardada: Date.now() };
        return cotizacion;
      }
    }
  } catch {
    // se intenta con el respaldo
  }
  const respaldo = ultimaBuena[tipo];
  if (respaldo && Date.now() - respaldo.guardada < MAX_ANTIGUEDAD_RESPALDO_MS) {
    return respaldo.cotizacion;
  }
  return null;
}

// Atajo para el dólar oficial (lo que usaba el catálogo antes de que la
// cotización fuera una preferencia de cada agencia).
export function getCotizacionOficial(): Promise<Cotizacion | null> {
  return getCotizacion("OFICIAL");
}

// "dólar oficial" / "dólar blue", para mostrar junto al "≈".
export function nombreCotizacion(tipo: TipoCotizacion): string {
  return tipo === "BLUE" ? "dólar blue" : "dólar oficial";
}

// "13/11 15:00" en hora de Argentina.
export function fechaCotizacionCorta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  })
    .format(d)
    .replace(",", "");
}
