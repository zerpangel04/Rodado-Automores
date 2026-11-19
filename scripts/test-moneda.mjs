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

test("monedaDesdeTexto: variantes comunes de planilla", () => {
  for (const t of ["USD", "usd", "U$S", "u$s", "US$", "U$D", "Dólares", "dolar", " u.s.d "]) {
    assert.equal(m.monedaDesdeTexto(t), "USD", t);
  }
  for (const t of ["ARS", "ars", "$", "Pesos", "peso", "AR$", "$ARS", "$ ARS"]) {
    assert.equal(m.monedaDesdeTexto(t), "ARS", t);
  }
  for (const t of ["EUR", "reales", "u", "dolares blue", ""]) {
    assert.equal(m.monedaDesdeTexto(t), null, t);
  }
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

test("cotizacionVista: valor, nombre y fecha corta; null sin cotización", () => {
  assert.deepEqual(c.cotizacionVista({ tipo: "BLUE", venta: 1450, fecha: "2026-11-13T18:00:00.000Z" }), {
    venta: 1450,
    nombre: "dólar blue",
    fecha: "13/11 15:00",
  });
  assert.equal(c.cotizacionVista(null), null);
});

// ---------------- orden, "Desde" y textos del catálogo ----------------

const autos = [
  { id: "corolla", precio: 18500, moneda: "USD" },
  { id: "uno", precio: 9_500_000, moneda: "ARS" }, // ≈ USD 6.333 con 1500
  { id: "amarok", precio: 27900, moneda: "USD" },
  { id: "cronos", precio: 30_000_000, moneda: "ARS" }, // ≈ USD 20.000 con 1500
];
const orden = (lista, cot) => lista.slice().sort((a, b) => m.compararPrecioAsc(a, b, cot)).map((v) => v.id);

test("compararPrecioAsc: mezcla monedas comparando en USD", () => {
  assert.deepEqual(orden(autos, 1500), ["uno", "corolla", "cronos", "amarok"]);
  // Con otra cotización cambia el lugar de los autos en pesos.
  assert.deepEqual(orden(autos, 1000), ["uno", "corolla", "amarok", "cronos"]);
});

test("compararPrecioAsc: sin cotización, los precios en pesos van al final (ordenados entre sí)", () => {
  assert.deepEqual(orden(autos, null), ["corolla", "amarok", "uno", "cronos"]);
});

test("masBarato: el más barato en USD, o null si no hay autos", () => {
  assert.equal(m.masBarato(autos, 1500).id, "uno");
  assert.equal(m.masBarato(autos, null).id, "corolla"); // sin cotización no se compara un precio en pesos
  assert.equal(m.masBarato(autos.filter((v) => v.moneda === "ARS"), null).id, "uno");
  assert.equal(m.masBarato([], 1500), null);
});

test("formatearCompacto: miles con k y millones con M", () => {
  assert.equal(m.formatearCompacto(18500), "18,5k");
  assert.equal(m.formatearCompacto(9_500_000), "9,5M");
  assert.equal(m.formatearCompacto(0), "0,0k");
});

test("textoMonedas: dólares, pesos o ambas", () => {
  assert.equal(m.textoMonedas(["USD", "USD"]), "en dólares");
  assert.equal(m.textoMonedas(["ARS"]), "en pesos");
  assert.equal(m.textoMonedas(["USD", "ARS"]), "en dólares y en pesos");
  assert.equal(m.textoMonedas([]), "en dólares");
});

// ---------------- Ventas ----------------

const ventas = [
  { monto: 27500, moneda: "USD", cotizacion: 1500 },
  { monto: 9_000_000, moneda: "ARS", cotizacion: 1500 }, // USD 6.000 con SU cotización
  { monto: 12300, moneda: "USD", cotizacion: null }, // venta vieja en USD: no necesita cotización
  { monto: 5_000_000, moneda: "ARS", cotizacion: null }, // pesos sin cotización: no se puede convertir
];

test("sumarVentasEnUsd: cada venta con su cotización guardada; sin cotización en pesos, se omite", () => {
  assert.deepEqual(m.sumarVentasEnUsd(ventas), { usd: 27500 + 6000 + 12300, omitidas: 1 });
  assert.deepEqual(m.sumarVentasEnUsd([]), { usd: 0, omitidas: 0 });
});

test("partesKpi: USD principal y pesos aparte, nunca sumados", () => {
  assert.deepEqual(m.partesKpi({ USD: 27500, ARS: 0 }), { valor: "27.500", unidad: "USD", extra: null });
  assert.deepEqual(m.partesKpi({ USD: 0, ARS: 9_500_000 }), { valor: "9.500.000", unidad: "pesos", extra: null });
  assert.deepEqual(m.partesKpi({ USD: 27500, ARS: 9_500_000 }), {
    valor: "27.500",
    unidad: "USD",
    extra: "+ $9.500.000",
  });
  assert.deepEqual(m.partesKpi({ USD: 0, ARS: 0 }), { valor: "0", unidad: "USD", extra: null });
});

test("montoCortoPorMoneda: solo USD queda como antes; pesos y mixto por separado", () => {
  assert.deepEqual(m.montoCortoPorMoneda({ USD: 1250, ARS: 0 }, { decimalesUsd: 2 }), { valor: "1,25k", nota: "USD del mes" });
  assert.deepEqual(m.montoCortoPorMoneda({ USD: 45600, ARS: 0 }), { valor: "45,6k", nota: "USD del mes" });
  assert.deepEqual(m.montoCortoPorMoneda({ USD: 0, ARS: 9_500_000 }), { valor: "$9,5M", nota: "pesos del mes" });
  assert.deepEqual(m.montoCortoPorMoneda({ USD: 1250, ARS: 190_000 }, { decimalesUsd: 2 }), {
    valor: "1,25k + $190,0k",
    nota: "del mes",
  });
});

// Modal de venta: lo que queda en "Precio final" al tocar USD / $ ARS.
const auto208 = { precioAuto: 17800, monedaAuto: "USD", cotizacion: 1570 };
const cambio = (precioActual, monedaActual, monedaNueva, extra = {}) =>
  m.precioAlCambiarMonedaVenta({ ...auto208, precioActual, monedaActual, monedaNueva, ...extra });

test("venta: precio sin tocar se convierte al cambiar de moneda (pesos a miles)", () => {
  // 17.800 × 1570 = 27.946.000 (ya redondo a miles)
  assert.equal(cambio("17800", "USD", "ARS"), "27946000");
  // Auto en pesos vendido en dólares: 9.500.000 / 1570 = 6050,9 → 6051
  assert.equal(
    m.precioAlCambiarMonedaVenta({ precioActual: "9500000", monedaActual: "ARS", monedaNueva: "USD", precioAuto: 9_500_000, monedaAuto: "ARS", cotizacion: 1570 }),
    "6051"
  );
});

test("venta: volver a la moneda del auto sin editar restaura su precio", () => {
  assert.equal(cambio("27946000", "ARS", "USD"), "17800");
});

test("venta: si el usuario ya editó el precio, cambiar la moneda no lo toca", () => {
  assert.equal(cambio("17500", "USD", "ARS"), "17500"); // editado antes de cambiar
  assert.equal(cambio("28000000", "ARS", "USD"), "28000000"); // editado en pesos y vuelve a USD
});

test("venta: sin cotización nunca convierte", () => {
  assert.equal(cambio("17800", "USD", "ARS", { cotizacion: null }), "17800");
  assert.equal(cambio("17800", "USD", "ARS", { cotizacion: 0 }), "17800");
});

test("venta: elegir la misma moneda no cambia nada", () => {
  assert.equal(cambio("17800", "USD", "USD"), "17800");
});
