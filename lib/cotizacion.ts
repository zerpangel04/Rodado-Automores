// Cotización del dólar oficial para mostrar equivalentes en pesos.
// Misma fuente que el resto del sistema (FxBox en el panel, Ventas, ficha de
// lead, Tu plan): dolarapi.com.

export type Cotizacion = {
  // Precio de venta del dólar oficial, en pesos.
  venta: number;
  // Fecha y hora de esa cotización según la fuente (ISO).
  fecha: string;
};

const URL_OFICIAL = "https://dolarapi.com/v1/dolares/oficial";
// La caché de datos de Next la comparte entre visitas (y entre instancias en
// Vercel): no se consulta la API en cada carga del catálogo.
const REVALIDAR_SEGUNDOS = 15 * 60;
// Si la API no responde, se usa la última cotización buena de este servidor
// mientras no tenga más de 48 h; si no hay ninguna, no se muestra el
// equivalente (nunca un número escrito a mano).
const MAX_ANTIGUEDAD_RESPALDO_MS = 48 * 60 * 60 * 1000;

let ultimaBuena: { cotizacion: Cotizacion; guardada: number } | null = null;

export async function getCotizacionOficial(): Promise<Cotizacion | null> {
  try {
    const res = await fetch(URL_OFICIAL, { next: { revalidate: REVALIDAR_SEGUNDOS } });
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.venta === "number" && data.venta > 0) {
        const cotizacion: Cotizacion = {
          venta: data.venta,
          fecha: typeof data.fechaActualizacion === "string" ? data.fechaActualizacion : new Date().toISOString(),
        };
        ultimaBuena = { cotizacion, guardada: Date.now() };
        return cotizacion;
      }
    }
  } catch {
    // se intenta con el respaldo
  }
  if (ultimaBuena && Date.now() - ultimaBuena.guardada < MAX_ANTIGUEDAD_RESPALDO_MS) {
    return ultimaBuena.cotizacion;
  }
  return null;
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
