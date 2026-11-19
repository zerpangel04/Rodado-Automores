// Pruebas de comisiones de vendedores (lib/comisiones.ts).
// Uso: npm test   (o: node --test scripts/test-comisiones.mjs)
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

const c = await import("../lib/comisiones.ts");

test("% efectivo: el del vendedor pisa al de la agencia", () => {
  assert.equal(c.pctEfectivo(2.5, 3), 2.5);
  assert.equal(c.pctEfectivo(0, 3), 0); // 0% propio es válido, no "sin cargar"
  assert.equal(c.pctEfectivo(null, 3), 3);
  assert.equal(c.pctEfectivo(undefined, 3), 3);
  assert.equal(c.pctEfectivo(null, null), null);
});

test("cálculo con % y redondeo por moneda", () => {
  assert.equal(c.calcularComision(27500, 3, "USD"), 825);
  assert.equal(c.calcularComision(25617, 3, "USD"), 769); // 768,51 → 769
  assert.equal(c.calcularComision(9500000, 3, "ARS"), 285000);
  assert.equal(c.calcularComision(9516350, 3, "ARS"), 285500); // 285.490,5 → centena
  assert.equal(c.calcularComision(9516650, 3, "ARS"), 285500); // 285.499,5 → 285.500
});

test("sin % o sin precio válido no sugiere comisión", () => {
  assert.equal(c.calcularComision(27500, null, "USD"), null);
  assert.equal(c.calcularComision(0, 3, "USD"), null);
  assert.equal(c.calcularComision(NaN, 3, "USD"), null);
});

test("validación del %", () => {
  assert.ok(c.esPctComisionValido(0));
  assert.ok(c.esPctComisionValido(3.25));
  assert.ok(c.esPctComisionValido(20));
  assert.equal(c.esPctComisionValido(20.01), false);
  assert.equal(c.esPctComisionValido(-1), false);
  assert.equal(c.esPctComisionValido("3"), false);
});

test("sumar montos sin errores de coma flotante", () => {
  assert.equal(c.sumarMontos([0.1, 0.2]), 0.3);
  assert.equal(c.sumarMontos([825, 768]), 1593);
  assert.equal(c.sumarMontos([]), 0);
});

const venta = (o) => ({ id: "v", vendedorId: "m", vendedorNombre: "Martín", moneda: "USD", comision: 0, fecha: "2026-11-01T12:00:00Z", liquidacionId: null, ...o });

test("agrupa pendientes por vendedor y moneda, nunca mezcla USD con pesos", () => {
  const g = c.agruparPendientes([
    venta({ id: "1", comision: 825, fecha: "2026-10-10T12:00:00Z" }),
    venta({ id: "2", comision: 768, fecha: "2026-10-20T12:00:00Z" }),
    venta({ id: "3", moneda: "ARS", comision: 285000 }),
    venta({ id: "4", vendedorId: "n", vendedorNombre: "Nicolás", comision: 1185 }),
    venta({ id: "5", vendedorId: "n", vendedorNombre: "Nicolás", comision: 894, liquidacionId: "liq1" }), // ya liquidada
  ]);
  assert.deepEqual(
    g.map((x) => [x.vendedorNombre, x.moneda, x.total, x.cantidad, x.ventaIds.join(",")]),
    [
      ["Martín", "USD", 1593, 2, "1,2"],
      ["Martín", "ARS", 285000, 1, "3"],
      ["Nicolás", "USD", 1185, 1, "4"],
    ]
  );
  assert.equal(g[0].desde, "2026-10-10T12:00:00.000Z");
  assert.equal(g[0].hasta, "2026-10-20T12:00:00.000Z");
});

test("sin pendientes no hay grupos", () => {
  assert.deepEqual(c.agruparPendientes([venta({ liquidacionId: "x" })]), []);
});

test("'hasta' incluye todo el día en hora de Argentina", () => {
  assert.equal(c.finDelDiaArgentina("2026-11-30").toISOString(), "2026-12-01T02:59:59.999Z");
  assert.equal(c.finDelDiaArgentina("30/11/2026"), null);
  assert.equal(c.finDelDiaArgentina("2026-13-40"), null);
});

test("textos del log de actividad", () => {
  assert.equal(c.textoLiquidacion("Martín Rivas", "USD", 1593, 2), "Se liquidaron USD 1.593 de comisiones a Martín Rivas (2 ventas)");
  assert.equal(c.textoLiquidacion("Martín Rivas", "ARS", 285000, 1), "Se liquidaron $285.000 de comisiones a Martín Rivas (1 venta)");
  assert.equal(
    c.textoAnulacion("Nicolás", "USD", 1185, 1, "monto mal cargado"),
    "Se anuló la liquidación de USD 1.185 a Nicolás: 1 venta vuelve a pendiente. Motivo: monto mal cargado"
  );
  assert.equal(c.textoAnulacion("Martín", "USD", 1593, 2), "Se anuló la liquidación de USD 1.593 a Martín: 2 ventas vuelven a pendiente");
});
