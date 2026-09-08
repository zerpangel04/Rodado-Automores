import { vehiculoInputSchema } from "@/lib/validation";
import { evaluarLimitePlan } from "@/lib/planes";
import type { Plan } from "@prisma/client";

// Columnas del CSV, en el orden en que se generan en la plantilla. La
// columna "sucursal" solo aplica si el tenant tiene más de una — se
// agrega dinámicamente en app/api/vehiculos/plantilla/route.ts.
export const PLANTILLA_COLUMNAS = [
  "marca",
  "modelo",
  "anio",
  "km",
  "precioUsd",
  "transmision",
  "motor",
  "categoria",
  "fechaIngreso",
] as const;

const CAMPO_LABEL: Record<string, string> = {
  sucursalId: "Sucursal",
  marca: "Marca",
  modelo: "Modelo",
  anio: "Año",
  km: "Km",
  precioUsd: "Precio (USD)",
  categoria: "Categoría",
  transmision: "Transmisión",
  motor: "Motor",
  fechaIngreso: "Fecha de ingreso",
};

// Parser CSV mínimo (RFC4180 básico): separador coma, campos entre
// comillas dobles pueden contener comas y comillas escapadas como "".
// No usamos una librería externa porque el formato que necesitamos
// soportar es simple y así evitamos sumar una dependencia nueva.
export function parseCsv(texto: string): string[][] {
  const limpio = texto.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let entreComillas = false;

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (entreComillas) {
      if (c === '"') {
        if (limpio[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreComillas = false;
        }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === ",") {
      fila.push(campo);
      campo = "";
    } else if (c === "\n") {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else {
      campo += c;
    }
  }
  if (campo.length > 0 || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }

  return filas.filter((f) => f.some((c) => c.trim() !== ""));
}

export type FilaImportacion = {
  numeroFila: number; // 1-indexado sobre las filas de datos (sin contar el encabezado)
  marca: string;
  modelo: string;
  anio: string;
  precioUsd: string;
  sucursalNombre: string | null;
  error: string | null;
  datos: {
    sucursalId: string;
    marca: string;
    modelo: string;
    anio: number;
    km: number;
    precioUsd: number;
    categoria: string | null;
    transmision: string | null;
    motor: string | null;
    fechaIngreso: Date | undefined;
  } | null;
};

function buscarColumna(encabezado: string[], ...nombres: string[]): number {
  for (const nombre of nombres) {
    const i = encabezado.indexOf(nombre);
    if (i !== -1) return i;
  }
  return -1;
}

// Valida el CSV completo reusando vehiculoInputSchema (la misma validación
// que ya usa POST /api/vehiculos) — así los criterios de "campo inválido"
// nunca se duplican ni pueden desalinearse entre el alta individual y la
// importación masiva.
export function validarFilasImportacion(
  csvTexto: string,
  sucursales: { id: string; nombre: string }[]
): { filas: FilaImportacion[]; errorGeneral: string | null } {
  const filasCrudas = parseCsv(csvTexto);
  if (filasCrudas.length === 0) {
    return { filas: [], errorGeneral: "El archivo está vacío." };
  }

  const encabezado = filasCrudas[0].map((h) => h.trim().toLowerCase());
  const iMarca = buscarColumna(encabezado, "marca");
  const iModelo = buscarColumna(encabezado, "modelo");
  const iAnio = buscarColumna(encabezado, "anio", "año");
  const iKm = buscarColumna(encabezado, "km");
  const iPrecio = buscarColumna(encabezado, "preciousd", "precio");
  const iTransmision = buscarColumna(encabezado, "transmision", "transmisión");
  const iMotor = buscarColumna(encabezado, "motor");
  const iCategoria = buscarColumna(encabezado, "categoria", "categoría");
  const iFecha = buscarColumna(encabezado, "fechaingreso", "fecha de ingreso");
  const iSucursal = buscarColumna(encabezado, "sucursal");

  if (iMarca === -1 || iModelo === -1 || iAnio === -1 || iKm === -1 || iPrecio === -1) {
    return {
      filas: [],
      errorGeneral:
        "Al archivo le faltan columnas obligatorias (marca, modelo, anio, km, precioUsd). Descargá la plantilla para ver el formato correcto.",
    };
  }

  const sucursalPorNombre = new Map(sucursales.map((s) => [s.nombre.trim().toLowerCase(), s.id]));
  const sucursalUnicaId = sucursales.length === 1 ? sucursales[0].id : null;

  const filas: FilaImportacion[] = [];

  for (let i = 1; i < filasCrudas.length; i++) {
    const cols = filasCrudas[i];
    const get = (idx: number) => (idx === -1 ? "" : (cols[idx] ?? "").trim());

    const marca = get(iMarca);
    const modelo = get(iModelo);
    const anio = get(iAnio);
    const km = get(iKm);
    const precioUsd = get(iPrecio);
    const transmision = get(iTransmision);
    const motor = get(iMotor);
    const categoria = get(iCategoria);
    const fechaIngreso = get(iFecha);
    const sucursalNombreCrudo = get(iSucursal);

    const base = { marca, modelo, anio, precioUsd, sucursalNombre: sucursalNombreCrudo || null };

    const faltantes = [
      !marca && "marca",
      !modelo && "modelo",
      !anio && "anio",
      !km && "km",
      !precioUsd && "precioUsd",
    ].filter(Boolean) as string[];
    if (faltantes.length > 0) {
      filas.push({
        numeroFila: i,
        ...base,
        error: `Falta completar: ${faltantes.join(", ")}`,
        datos: null,
      });
      continue;
    }

    if (isNaN(Number(anio))) {
      filas.push({ numeroFila: i, ...base, error: `El año "${anio}" no es un número válido`, datos: null });
      continue;
    }
    if (isNaN(Number(km))) {
      filas.push({ numeroFila: i, ...base, error: `El km "${km}" no es un número válido`, datos: null });
      continue;
    }
    if (isNaN(Number(precioUsd))) {
      filas.push({ numeroFila: i, ...base, error: `El precio "${precioUsd}" no es un número válido`, datos: null });
      continue;
    }

    let sucursalId: string | null = null;
    let errorSucursal: string | null = null;
    if (sucursalNombreCrudo) {
      sucursalId = sucursalPorNombre.get(sucursalNombreCrudo.toLowerCase()) ?? null;
      if (!sucursalId) errorSucursal = `La sucursal "${sucursalNombreCrudo}" no existe`;
    } else if (sucursalUnicaId) {
      sucursalId = sucursalUnicaId;
    } else {
      errorSucursal = "Falta indicar la sucursal (la agencia tiene más de una)";
    }

    if (errorSucursal || !sucursalId) {
      filas.push({ numeroFila: i, ...base, error: errorSucursal, datos: null });
      continue;
    }

    const parsed = vehiculoInputSchema.safeParse({
      sucursalId,
      marca,
      modelo,
      anio,
      km,
      precioUsd,
      categoria: categoria || undefined,
      transmision: transmision || undefined,
      motor: motor || undefined,
      fechaIngreso: fechaIngreso || undefined,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const campo = CAMPO_LABEL[String(issue?.path?.[0])] ?? String(issue?.path?.[0] ?? "");
      filas.push({
        numeroFila: i,
        ...base,
        error: campo ? `${campo}: ${issue.message}` : (issue?.message ?? "Datos inválidos"),
        datos: null,
      });
      continue;
    }

    filas.push({
      numeroFila: i,
      ...base,
      error: null,
      datos: {
        sucursalId: parsed.data.sucursalId,
        marca: parsed.data.marca,
        modelo: parsed.data.modelo,
        anio: parsed.data.anio,
        km: parsed.data.km,
        precioUsd: parsed.data.precioUsd,
        categoria: parsed.data.categoria ?? null,
        transmision: parsed.data.transmision ?? null,
        motor: parsed.data.motor ?? null,
        fechaIngreso: parsed.data.fechaIngreso,
      },
    });
  }

  return { filas, errorGeneral: null };
}

// Aplica el límite de vehículos del plan sobre el lote de filas válidas,
// en orden, reusando evaluarLimitePlan fila por fila — el mismo criterio
// y los mismos mensajes que ya usa la creación individual.
export function aplicarLimitePlanImportacion(
  filasValidas: FilaImportacion[],
  plan: Plan,
  actualAntes: number
): {
  importables: FilaImportacion[];
  omitidosPorLimite: number;
  limiteAlcanzado: boolean;
  errorLimite?: string;
  avisoLimite?: string;
} {
  const importables: FilaImportacion[] = [];
  let omitidosPorLimite = 0;
  let limiteAlcanzado = false;
  let errorLimite: string | undefined;
  let avisoLimite: string | undefined;
  let contador = actualAntes;

  for (const fila of filasValidas) {
    const evaluacion = evaluarLimitePlan({ limite: plan.limiteVehiculos, actualAntes: contador, recurso: "vehículos" });
    if (evaluacion.bloqueado) {
      omitidosPorLimite++;
      limiteAlcanzado = true;
      if (!errorLimite) errorLimite = evaluacion.error;
      continue;
    }
    importables.push(fila);
    contador++;
    if (evaluacion.aviso) avisoLimite = evaluacion.aviso;
  }

  return { importables, omitidosPorLimite, limiteAlcanzado, errorLimite, avisoLimite };
}
