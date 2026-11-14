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

const { validarFilasImportacion, PLANTILLA_COLUMNAS } = await import("../lib/importVehiculos.ts");

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
