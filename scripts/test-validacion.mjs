// Pruebas de los schemas de vehículos (lib/validation.ts).
// Uso: npm test   (o: node --test scripts/test-validacion.mjs)
//
// Node ejecuta TypeScript directo (type stripping), pero lib/ importa sin
// extensión ("./catalogo"); este hook agrega ".ts" a esos imports relativos.
import { register } from "node:module";
import { test } from "node:test";
import assert from "node:assert/strict";

register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(specifier, context, next) {
        if (/^\\.{1,2}\\//.test(specifier) && !/\\.[a-z]+$/i.test(specifier)) {
          try { return await next(specifier + ".ts", context); } catch {}
        }
        return next(specifier, context);
      }`),
  import.meta.url
);

const { vehiculoInputSchema, vehiculoUpdateSchema } = await import("../lib/validation.ts");

test("PATCH parcial { estado } solo cambia el estado (no borra documentos ni VTV)", () => {
  const r = vehiculoUpdateSchema.parse({ estado: "RESERVADO" });
  assert.deepEqual(r, { estado: "RESERVADO" });
});

test("PATCH parcial sin estado no lo vuelve a DISPONIBLE", () => {
  const r = vehiculoUpdateSchema.parse({ km: 45000 });
  assert.deepEqual(r, { km: 45000 });
});

test("PATCH vacío no toca nada", () => {
  assert.deepEqual(vehiculoUpdateSchema.parse({}), {});
});

test("PATCH puede limpiar la VTV a propósito con null o string vacío", () => {
  assert.equal(vehiculoUpdateSchema.parse({ vtvVencimiento: null }).vtvVencimiento, null);
  assert.equal(vehiculoUpdateSchema.parse({ vtvVencimiento: "" }).vtvVencimiento, null);
});

test("PATCH puede desmarcar un documento a propósito", () => {
  assert.deepEqual(vehiculoUpdateSchema.parse({ docTitulo: false }), { docTitulo: false });
});

test("PATCH sigue validando lo que viene", () => {
  assert.equal(vehiculoUpdateSchema.safeParse({ estado: "ROBADO" }).success, false);
  assert.equal(vehiculoUpdateSchema.safeParse({ km: -1 }).success, false);
});

test("Alta: lo que no viene toma su default", () => {
  const r = vehiculoInputSchema.parse({
    sucursalId: "s1",
    marca: "Toyota",
    modelo: "Corolla",
    anio: 2020,
    km: 10000,
    precioUsd: 20000,
  });
  assert.equal(r.estado, "DISPONIBLE");
  assert.equal(r.docTitulo, false);
  assert.equal(r.docCedula, false);
  assert.equal(r.docDominio, false);
  assert.equal(r.docLibreDeuda, false);
  assert.equal(r.vtvVencimiento, null);
});

test("Alta: sigue exigiendo los campos obligatorios", () => {
  assert.equal(vehiculoInputSchema.safeParse({ marca: "Toyota" }).success, false);
});
