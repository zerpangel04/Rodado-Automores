// Vehículos destacados del catálogo público.
//
// Un vehículo está marcado si tiene `destacadoEn` (fecha en que se marcó).
// Se muestran como destacados solo los primeros `limite` marcados (los más
// antiguos primero) que no estén vendidos: si el plan baja, los que sobran
// quedan guardados pero no se muestran, y con límite 0 no se muestra
// ninguno.

type ConDestacado = {
  id: string;
  estado: string;
  destacadoEn: Date | null;
};

// Marcados que no están vendidos, en orden de marcado.
export function ordenarMarcados<T extends ConDestacado>(vehiculos: T[]): T[] {
  return vehiculos
    .filter((v) => v.destacadoEn !== null && v.estado !== "VENDIDO")
    .sort((a, b) => a.destacadoEn!.getTime() - b.destacadoEn!.getTime());
}

// Ids de los que efectivamente se muestran como destacados.
export function idsDestacadosVigentes<T extends ConDestacado>(
  vehiculos: T[],
  limite: number
): Set<string> {
  return new Set(
    ordenarMarcados(vehiculos)
      .slice(0, Math.max(0, limite))
      .map((v) => v.id)
  );
}
