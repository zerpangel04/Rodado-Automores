// Pruebas de expedientes de trámites (lib/tramites.ts).
// Uso: npm test   (o: node --test scripts/test-tramites.mjs)
//
// Node ejecuta TypeScript directo; este hook resuelve los imports "@/..."
// (alias del proyecto) y los relativos sin extensión a archivos .ts.
import { register } from "node:module";
import { test } from "node:test";
import assert from "node:assert/strict";

register(
  "data:text/javascript," +
    encodeURIComponent(`
      const raiz = ${JSON.stringify(new URL("../", import.meta.url).href)};
      export async function resolve(specifier, context, next) {
        if (specifier.startsWith("@/")) specifier = raiz + specifier.slice(2);
        if ((/^\\.{1,2}\\//.test(specifier) || specifier.startsWith(raiz)) && !/\\.[a-z]+$/i.test(specifier)) {
          try { return await next(specifier + ".ts", context); } catch {}
        }
        return next(specifier, context);
      }`),
  import.meta.url
);

const t = await import("../lib/tramites.ts");
const ahora = new Date("2026-11-20T12:00:00Z");
const haceDias = (n) => new Date(ahora.getTime() - n * 864e5);

test("la plantilla por defecto tiene los 10 pasos acordados, con Entrega al final", () => {
  assert.equal(t.PASOS_DEFAULT.length, 10);
  assert.equal(t.PASOS_DEFAULT[0], "Boleto de compraventa firmado");
  assert.equal(t.PASOS_DEFAULT[9], "Entrega del vehículo");
  assert.ok(!t.PASOS_DEFAULT.some((p) => /denuncia de venta/i.test(p)));
  const pl = t.plantillaDefault();
  assert.deepEqual(pl.map((p) => p.orden), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.ok(pl.every((p) => p.activo));
});

test("el expediente copia solo los pasos activos, en orden y renumerados", () => {
  const pasos = t.pasosParaExpediente([
    { nombre: " Entrega ", orden: 9, activo: true },
    { nombre: "Boleto", orden: 1, activo: true },
    { nombre: "Verificación policial", orden: 4, activo: false },
    { nombre: "Denuncia de venta", orden: 12, activo: true },
  ]);
  assert.deepEqual(pasos, [
    { nombre: "Boleto", orden: 1 },
    { nombre: "Entrega", orden: 2 },
    { nombre: "Denuncia de venta", orden: 3 },
  ]);
});

test("progreso y próximo paso", () => {
  const pasos = [
    { nombre: "A", orden: 1, hecho: true },
    { nombre: "C", orden: 3, hecho: false },
    { nombre: "B", orden: 2, hecho: false },
  ];
  assert.deepEqual(t.progreso(pasos), { hechos: 1, total: 3, completo: false, pct: 33 });
  assert.equal(t.proximoPaso(pasos).nombre, "B");
  const todos = pasos.map((p) => ({ ...p, hecho: true }));
  assert.equal(t.progreso(todos).completo, true);
  assert.equal(t.proximoPaso(todos), null);
  assert.equal(t.progreso([]).completo, false); // sin pasos no está "completo"
});

test("trabado: en curso y sin movimiento hace 10 días o más", () => {
  assert.equal(t.estaTrabado({ completadoEn: null, ultimaActividadEn: haceDias(10) }, 10, ahora), true);
  assert.equal(t.estaTrabado({ completadoEn: null, ultimaActividadEn: haceDias(9) }, 10, ahora), false);
  // Completo nunca está trabado, aunque sea viejo.
  assert.equal(t.estaTrabado({ completadoEn: haceDias(40), ultimaActividadEn: haceDias(40) }, 10, ahora), false);
  assert.equal(t.corteTrabados(10, ahora).toISOString(), haceDias(10).toISOString());
});

test("umbral de trabado: 10 por defecto y opciones válidas", () => {
  assert.equal(t.DIAS_TRABADO_DEFAULT, 10);
  assert.ok(t.esDiasTrabadoValido(10));
  assert.equal(t.esDiasTrabadoValido(8), false);
  assert.equal(t.esDiasTrabadoValido("10"), false);
});

test("permisos para tildar: dueño, admin y el vendedor de esa venta", () => {
  assert.ok(t.puedeEditarPasos("DUENIO", "u1", "v9"));
  assert.ok(t.puedeEditarPasos("ADMIN", "u1", "v9"));
  assert.ok(t.puedeEditarPasos("VENDEDOR", "v9", "v9"));
  assert.equal(t.puedeEditarPasos("VENDEDOR", "v1", "v9"), false);
});

test("revertir la venta: bloqueado si hay algún paso hecho", () => {
  assert.ok(t.puedeRevertirConExpediente(null));
  assert.ok(t.puedeRevertirConExpediente([{ hecho: false }, { hecho: false }]));
  assert.equal(t.puedeRevertirConExpediente([{ hecho: false }, { hecho: true }]), false);
});

test("validación de la plantilla", () => {
  assert.equal(t.errorPlantilla([{ nombre: "Boleto", activo: true }]), null);
  assert.match(t.errorPlantilla([]), /al menos un paso/);
  assert.match(t.errorPlantilla([{ nombre: "  ", activo: true }]), /sin nombre/);
  assert.match(t.errorPlantilla([{ nombre: "Boleto", activo: true }, { nombre: "boleto ", activo: true }]), /repetido/);
  assert.match(t.errorPlantilla([{ nombre: "Boleto", activo: false }]), /al menos un paso activo/);
  assert.match(t.errorPlantilla([{ nombre: "x".repeat(81), activo: true }]), /80 caracteres/);
  assert.match(t.errorPlantilla(Array.from({ length: 31 }, (_, i) => ({ nombre: `P${i}`, activo: true }))), /hasta 30/);
});

test("fechas del paso", () => {
  assert.equal(t.hoyArgentina(new Date("2026-11-20T02:30:00Z")), "2026-11-19"); // 23:30 en Argentina
  assert.equal(t.hoyArgentina(new Date("2026-11-20T03:30:00Z")), "2026-11-20");
  assert.ok(t.esFechaYmd("2026-11-30"));
  assert.equal(t.esFechaYmd("2026-02-30"), false);
  assert.equal(t.esFechaYmd("30/11/2026"), false);
});
