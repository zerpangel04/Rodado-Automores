import { equivalente, formatearPrecio, type Moneda } from "./moneda";
import { fechaCotizacionCorta, nombreCotizacion, type Cotizacion } from "./cotizacion";

// Stock tal como se le pasa a Rodi (chat del catálogo). Cada precio va en su
// propia moneda, como en el catálogo; el "≈" se calcula acá con la
// cotización que eligió la agencia, así el modelo nunca convierte por su
// cuenta (y si no hay cotización, directamente no hay equivalente).
export type VehiculoStock = {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  km: number;
  precio: number;
  moneda: Moneda;
  estado: string;
  transmision: string | null;
  motor: string | null;
};

export function formatearStock(vehiculos: VehiculoStock[], cotizacion: Cotizacion | null): string {
  if (vehiculos.length === 0) {
    return "(no hay vehículos en stock en este momento)";
  }
  return vehiculos
    .map((v, i) => {
      const estado = v.estado === "RESERVADO" ? "reservado (todavía no vendido)" : "disponible";
      const eq = equivalente(v.precio, v.moneda, cotizacion?.venta);
      const precio =
        `${formatearPrecio(v.precio, v.moneda)} (${v.moneda === "USD" ? "en dólares" : "en pesos"}` +
        (eq ? `; ≈ ${formatearPrecio(eq.monto, eq.moneda)}` : "") +
        ")";
      const detalles = [
        `${v.km.toLocaleString("es-AR")} km`,
        precio,
        estado,
        v.transmision ? `transmisión ${v.transmision}` : null,
        v.motor ? `motor ${v.motor}` : null,
      ]
        .filter(Boolean)
        .join(" — ");
      return `${i + 1}. ${v.marca} ${v.modelo} ${v.anio} — ${detalles} — id:${v.id}`;
    })
    .join("\n");
}

// Línea del prompt que explica de dónde salen los "≈" (o que no hay).
export function textoCotizacionChat(cotizacion: Cotizacion | null): string {
  if (!cotizacion) {
    return "No hay cotización del dólar disponible ahora: no des equivalentes entre pesos y dólares.";
  }
  const fecha = fechaCotizacionCorta(cotizacion.fecha);
  return `Los equivalentes "≈" están calculados con el ${nombreCotizacion(cotizacion.tipo)} ($${cotizacion.venta.toLocaleString("es-AR")} por dólar${fecha ? `, ${fecha}` : ""}).`;
}
