// Tasación simulada — heurística por categoría/año/km para prototipar el flujo.
// NO son datos reales de mercado. Para producción, conectar una fuente real
// (API de mercado o modelo entrenado con datos propios).
const categoryBase: Record<string, number> = {
  Compacto: 18000,
  Sedán: 24000,
  SUV: 32000,
  Pickup: 38000,
};

export function estimarPrecio({
  categoria,
  anio,
  km,
}: {
  categoria: string;
  anio: number;
  km: number;
}): number {
  const base = categoryBase[categoria] ?? 20000;
  const edad = Math.max(0, new Date().getFullYear() - anio);
  const precio = base * Math.pow(0.92, edad) - (km / 10000) * 150;
  return Math.max(Math.round(precio), 3000);
}
