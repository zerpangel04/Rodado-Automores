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

const {
  vehiculoInputSchema,
  vehiculoUpdateSchema,
  catalogoGeneralSchema,
  ventaInputSchema,
  errorTopePrecioVenta,
} = await import("../lib/validation.ts");

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
    precio: 20000,
  });
  assert.equal(r.estado, "DISPONIBLE");
  assert.equal(r.docTitulo, false);
  assert.equal(r.docCedula, false);
  assert.equal(r.docDominio, false);
  assert.equal(r.docLibreDeuda, false);
  assert.equal(r.vtvVencimiento, null);
});

test("Moneda: el alta sin moneda queda en USD", () => {
  const r = vehiculoInputSchema.parse({ sucursalId: "s1", marca: "Fiat", modelo: "Uno", anio: 2010, km: 1, precio: 9500000 });
  assert.equal(r.moneda, "USD");
  assert.equal(r.precio, 9500000);
});

test("Moneda: el alta acepta ARS y rechaza otras monedas", () => {
  const base = { sucursalId: "s1", marca: "Fiat", modelo: "Uno", anio: 2010, km: 1, precio: 9500000 };
  assert.equal(vehiculoInputSchema.parse({ ...base, moneda: "ARS" }).moneda, "ARS");
  assert.equal(vehiculoInputSchema.safeParse({ ...base, moneda: "EUR" }).success, false);
});

test("Moneda: un PATCH sin moneda no la toca (sin default en la edición)", () => {
  assert.deepEqual(vehiculoUpdateSchema.parse({ km: 1000 }), { km: 1000 });
  assert.equal("moneda" in vehiculoUpdateSchema.parse({ estado: "RESERVADO" }), false);
});

test("Moneda: un PATCH puede cambiar solo la moneda", () => {
  assert.deepEqual(vehiculoUpdateSchema.parse({ moneda: "ARS" }), { moneda: "ARS" });
  assert.equal(vehiculoUpdateSchema.safeParse({ moneda: "pesos" }).success, false);
});

test("Tope de precio según la moneda (USD 100 M, ARS 500 M)", () => {
  const base = { sucursalId: "s1", marca: "Fiat", modelo: "Uno", anio: 2010, km: 1 };
  assert.equal(vehiculoInputSchema.safeParse({ ...base, precio: 100_000_000, moneda: "USD" }).success, true);
  const usd = vehiculoInputSchema.safeParse({ ...base, precio: 150_000_000, moneda: "USD" });
  assert.equal(usd.success, false);
  assert.match(usd.error.issues[0].message, /USD 100\.000\.000/);
  assert.equal(vehiculoInputSchema.safeParse({ ...base, precio: 150_000_000, moneda: "ARS" }).success, true);
  const ars = vehiculoInputSchema.safeParse({ ...base, precio: 600_000_000, moneda: "ARS" });
  assert.equal(ars.success, false);
  assert.match(ars.error.issues[0].message, /cero de más/);
});

test("Alta: sigue exigiendo los campos obligatorios", () => {
  assert.equal(vehiculoInputSchema.safeParse({ marca: "Toyota" }).success, false);
});

const generalBase = { sobreNosotros: null, anioInicio: null, mostrarMapa: true, whatsapp: null, sucursales: [] };

test("Catálogo general: la cotización preferida es opcional (si no viene, no se toca)", () => {
  const r = catalogoGeneralSchema.safeParse(generalBase);
  assert.ok(r.success);
  assert.equal(r.data.cotizacionPreferida, undefined);
});

test("Catálogo general: acepta OFICIAL o BLUE y rechaza otra cosa con mensaje en castellano", () => {
  assert.equal(catalogoGeneralSchema.parse({ ...generalBase, cotizacionPreferida: "BLUE" }).cotizacionPreferida, "BLUE");
  const r = catalogoGeneralSchema.safeParse({ ...generalBase, cotizacionPreferida: "MEP" });
  assert.ok(!r.success);
  assert.equal(r.error.issues[0].message, "Elegí dólar oficial o dólar blue");
});

// ---------------- Venta ----------------

const ventaBase = { vendedorId: "u1", precioFinal: 27500, comision: 500 };

test("Venta: sin moneda queda sin definir (la API usa la del vehículo, no un USD fijo)", () => {
  const r = ventaInputSchema.parse(ventaBase);
  assert.equal(r.moneda, undefined);
});

test("Venta: acepta USD o ARS y rechaza otra moneda con mensaje en castellano", () => {
  assert.equal(ventaInputSchema.parse({ ...ventaBase, moneda: "ARS" }).moneda, "ARS");
  const r = ventaInputSchema.safeParse({ ...ventaBase, moneda: "EUR" });
  assert.ok(!r.success);
  assert.equal(r.error.issues[0].message, "La moneda tiene que ser USD o ARS");
});

test("Venta: la comisión no puede superar el precio final", () => {
  const r = ventaInputSchema.safeParse({ ...ventaBase, precioFinal: 27500, comision: 190000 });
  assert.ok(!r.success);
  assert.match(r.error.issues[0].message, /no puede ser mayor que el precio final/);
  assert.ok(ventaInputSchema.safeParse({ ...ventaBase, comision: 27500 }).success);
});

test("Venta: no acepta montos negativos", () => {
  assert.ok(!ventaInputSchema.safeParse({ ...ventaBase, precioFinal: -1 }).success);
  assert.ok(!ventaInputSchema.safeParse({ ...ventaBase, comision: -1 }).success);
});

test("Venta: el tope de precio depende de la moneda", () => {
  assert.equal(errorTopePrecioVenta(150_000_000, "ARS"), null);
  assert.match(errorTopePrecioVenta(150_000_000, "USD"), /USD 100\.000\.000/);
  assert.equal(errorTopePrecioVenta(27500, "USD"), null);
});
