// Pruebas de lib/moneda.ts y lib/cotizacion.ts.
// Uso: npm test   (o: node --test scripts/test-moneda.mjs)
import { test } from "node:test";
import assert from "node:assert/strict";

const m = await import("../lib/moneda.ts");
const c = await import("../lib/cotizacion.ts");

// ---------------- lib/moneda.ts ----------------

test("formatearPrecio: USD con prefijo y ARS con $, sin decimales", () => {
  assert.equal(m.formatearPrecio(28000, "USD"), "USD 28.000");
  assert.equal(m.formatearPrecio(9500000, "ARS"), "$9.500.000");
  assert.equal(m.formatearPrecio(1234.6, "USD"), "USD 1.235");
});

test("convertir entre monedas con pesos por dólar", () => {
  assert.equal(m.convertir(100, "USD", "ARS", 1570), 157000);
  assert.equal(m.convertir(157000, "ARS", "USD", 1570), 100);
  assert.equal(m.convertir(500, "USD", "USD", 1570), 500);
});

test("equivalente: la otra moneda redondeada, o null sin cotización", () => {
  assert.deepEqual(m.equivalente(25600, "USD", 1570), { monto: 40192000, moneda: "ARS" });
  assert.deepEqual(m.equivalente(9500000, "ARS", 1570), { monto: 6051, moneda: "USD" });
  assert.equal(m.equivalente(25600, "USD", null), null);
  assert.equal(m.equivalente(25600, "USD", 0), null);
});

test("aUsdParaComparar: USD tal cual, ARS convertido, null sin cotización", () => {
  assert.equal(m.aUsdParaComparar(28000, "USD", null), 28000);
  assert.equal(m.aUsdParaComparar(1570000, "ARS", 1570), 1000);
  assert.equal(m.aUsdParaComparar(1570000, "ARS", null), null);
});

test("totales: se suman por separado y nunca se mezclan", () => {
  const t = m.sumarPorMoneda([
    { monto: 400000, moneda: "USD" },
    { monto: 50000, moneda: "USD" },
    { monto: 12000000, moneda: "ARS" },
  ]);
  assert.deepEqual(t, { USD: 450000, ARS: 12000000 });
  assert.equal(m.formatearTotales(t), "USD 450.000 + $12.000.000");
  assert.equal(m.formatearTotales({ USD: 450000, ARS: 0 }), "USD 450.000");
  assert.equal(m.formatearTotales({ USD: 0, ARS: 9000000 }), "$9.000.000");
  assert.equal(m.formatearTotales({ USD: 0, ARS: 0 }), "USD 0");
});

test("esMoneda y otraMoneda", () => {
  assert.equal(m.esMoneda("USD"), true);
  assert.equal(m.esMoneda("ARS"), true);
  assert.equal(m.esMoneda("EUR"), false);
  assert.equal(m.otraMoneda("USD"), "ARS");
});

// ---------------- lib/cotizacion.ts ----------------

const respuesta = (venta, fecha = "2026-11-13T18:00:00.000Z") => async (url) =>
  new Response(JSON.stringify({ venta, fechaActualizacion: fecha, url }), { status: 200 });

test("cotización: consulta oficial o blue según se pida, con respaldo separado", async () => {
  const pedidas = [];
  const fetchOriginal = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      throw new Error("sin red");
    };
    assert.equal(await c.getCotizacion("BLUE"), null, "sin red y sin respaldo → null");

    globalThis.fetch = async (url, init) => {
      pedidas.push(String(url));
      return respuesta(String(url).endsWith("/blue") ? 1575 : 1570)(url, init);
    };
    assert.deepEqual(await c.getCotizacion("OFICIAL"), { tipo: "OFICIAL", venta: 1570, fecha: "2026-11-13T18:00:00.000Z" });
    assert.deepEqual(await c.getCotizacion("BLUE"), { tipo: "BLUE", venta: 1575, fecha: "2026-11-13T18:00:00.000Z" });
    assert.deepEqual(pedidas, ["https://dolarapi.com/v1/dolares/oficial", "https://dolarapi.com/v1/dolares/blue"]);

    globalThis.fetch = async () => new Response("error", { status: 500 });
    assert.equal((await c.getCotizacion("BLUE"))?.venta, 1575, "error → última blue buena");
    assert.equal((await c.getCotizacion("OFICIAL"))?.venta, 1570, "error → última oficial buena (no se mezclan)");
    assert.equal((await c.getCotizacionOficial())?.venta, 1570, "atajo oficial");
  } finally {
    globalThis.fetch = fetchOriginal;
  }
});

test("cotización: nombre y fecha en hora de Argentina", () => {
  assert.equal(c.nombreCotizacion("OFICIAL"), "dólar oficial");
  assert.equal(c.nombreCotizacion("BLUE"), "dólar blue");
  assert.equal(c.fechaCotizacionCorta("2026-11-13T18:00:00.000Z"), "13/11 15:00");
});
