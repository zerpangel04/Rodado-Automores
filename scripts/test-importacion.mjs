// Pruebas de la importación CSV de vehículos (lib/importVehiculos.ts).
// Uso: npm test   (o: node --test scripts/test-importacion.mjs)
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

const { validarFilasImportacion, PLANTILLA_COLUMNAS, parsearNumeroAr } = await import("../lib/importVehiculos.ts");

const sucursales = [{ id: "s1", nombre: "Casa central" }];
const filas = (csv) => validarFilasImportacion(csv, sucursales);

test("la plantilla tiene precio y moneda (ya no precioUsd)", () => {
  assert.ok(PLANTILLA_COLUMNAS.includes("precio"));
  assert.ok(PLANTILLA_COLUMNAS.includes("moneda"));
  assert.ok(!PLANTILLA_COLUMNAS.includes("precioUsd"));
});

test("CSV viejo (columna precioUsd, sin moneda) se sigue aceptando, en USD", () => {
  const r = filas("marca,modelo,anio,km,precioUsd\nToyota,Corolla,2020,45000,18500");
  assert.equal(r.errorGeneral, null);
  assert.equal(r.filas[0].error, null);
  assert.equal(r.filas[0].datos.precio, 18500);
  assert.equal(r.filas[0].datos.moneda, "USD");
});

test("columna moneda: USD, ARS, variantes y vacía (= USD)", () => {
  const r = filas(
    "marca,modelo,anio,km,precio,moneda\n" +
      "Toyota,Corolla,2020,45000,18500,USD\n" +
      "Fiat,Uno,2012,140000,9500000,ARS\n" +
      "Ford,Ka,2018,80000,12300,U$S\n" +
      "VW,Gol,2015,100000,8900000,pesos\n" +
      "Renault,Clio,2014,120000,7600,"
  );
  assert.deepEqual(
    r.filas.map((f) => [f.error, f.datos?.moneda, f.datos?.precio]),
    [
      [null, "USD", 18500],
      [null, "ARS", 9500000],
      [null, "USD", 12300],
      [null, "ARS", 8900000],
      [null, "USD", 7600],
    ]
  );
});

test("una moneda que no se reconoce da error en esa fila (no se adivina)", () => {
  const r = filas("marca,modelo,anio,km,precio,moneda\nToyota,Corolla,2020,45000,18500,EUR\nFiat,Uno,2012,1,9500000,ARS");
  assert.match(r.filas[0].error, /La moneda "EUR" no se reconoce/);
  assert.equal(r.filas[0].datos, null);
  assert.equal(r.filas[1].error, null);
});

test("el tope de precio depende de la moneda de la fila", () => {
  const r = filas("marca,modelo,anio,km,precio,moneda\nA,B,2020,1,150000000,USD\nC,D,2020,1,150000000,ARS");
  assert.match(r.filas[0].error, /USD 100\.000\.000/);
  assert.equal(r.filas[1].error, null);
});

test("faltan columnas obligatorias: el mensaje pide 'precio'", () => {
  const r = filas("marca,modelo,anio,km\nToyota,Corolla,2020,45000");
  assert.match(r.errorGeneral, /\(marca, modelo, anio, km, precio\)/);
});

// --- Formato argentino de números (punto de miles, coma decimal) ---

test("precio con punto de miles en USD: 18.500 = dieciocho mil quinientos", () => {
  const r = filas("marca,modelo,anio,km,precio,moneda\nToyota,Corolla,2020,45000,18.500,USD\nFord,Ka,2018,80000,1.250,USD");
  assert.equal(r.filas[0].error, null);
  assert.equal(r.filas[0].datos.precio, 18500);
  assert.equal(r.filas[0].datos.moneda, "USD");
  assert.equal(r.filas[1].datos.precio, 1250);
});

test("precio con punto de miles en ARS, números grandes", () => {
  const r = filas(
    "marca,modelo,anio,km,precio,moneda\n" +
      "Fiat,Uno,2012,140000,9.500.000,ARS\n" +
      "VW,Amarok,2022,30000,48.750.000,ARS\n" +
      'Peugeot,208,2021,25000,"23.900.000,50",ARS'
  );
  assert.deepEqual(
    r.filas.map((f) => [f.error, f.datos?.precio, f.datos?.moneda]),
    [
      [null, 9500000, "ARS"],
      [null, 48750000, "ARS"],
      [null, 23900000.5, "ARS"],
    ]
  );
});

test("precio sin separadores se sigue leyendo igual", () => {
  const r = filas("marca,modelo,anio,km,precio,moneda\nToyota,Corolla,2020,45000,18500,USD\nFiat,Uno,2012,140000,9500000,ARS");
  assert.equal(r.filas[0].datos.precio, 18500);
  assert.equal(r.filas[1].datos.precio, 9500000);
});

test("km con punto de miles: 45.000 = cuarenta y cinco mil", () => {
  const r = filas("marca,modelo,anio,km,precio\nToyota,Corolla,2020,45.000,18500");
  assert.equal(r.filas[0].error, null);
  assert.equal(r.filas[0].datos.km, 45000);
});

test("precio ambiguo: la fila da error y no se importa (no se adivina)", () => {
  const r = filas(
    "marca,modelo,anio,km,precio,moneda\n" +
      'A,B,2020,1,"18,500",USD\n' + // ¿coma de miles inglesa o 18,5?
      'C,D,2020,1,"18,500.00",USD\n' + // formato inglés completo
      "E,F,2020,1,18.5,USD\n" + // punto que no agrupa de a 3
      "G,H,2020,1,1.85.000,ARS\n" + // grupos mal formados
      'I,J,2020,1,"18.500,123",USD\n' + // tres decimales tras la coma
      "K,L,2020,1,18500,USD" // control: esta sí
  );
  for (const f of r.filas.slice(0, 5)) {
    assert.match(f.error, /no se puede interpretar con seguridad/, `fila ${f.numeroFila}: ${f.precio}`);
    assert.equal(f.datos, null);
  }
  assert.equal(r.filas[5].error, null);
  assert.equal(r.filas[5].datos.precio, 18500);
});

test("km con decimales o ambiguo da error", () => {
  const r = filas('marca,modelo,anio,km,precio\nA,B,2020,"45,5",18500\nC,D,2020,45.00,18500');
  assert.match(r.filas[0].error, /El km "45,5" no se puede interpretar/);
  assert.match(r.filas[1].error, /El km "45.00" no se puede interpretar/);
});

test("parsearNumeroAr: tabla de casos", () => {
  const casos = [
    ["0", 0], ["18500", 18500], ["18.500", 18500], ["9.500.000", 9500000],
    ["18.500,5", 18500.5], ["18.500,50", 18500.5], ["18500,5", 18500.5], [" 18.500 ", 18500],
    ["18.5", null], ["18.50", null], ["18,500", null], ["18,500.00", null],
    ["1.85.000", null], ["18.500,123", null], ["-500", null], ["$18.500", null],
    ["18 500", null], ["", null], [".500", null], ["18.", null], ["18,", null],
  ];
  for (const [txt, esperado] of casos) assert.equal(parsearNumeroAr(txt), esperado, JSON.stringify(txt));
  assert.equal(parsearNumeroAr("18.500,5", { decimales: false }), null);
});
