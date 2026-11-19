// Pruebas de "clientes dormidos" (lib/leadsDormidos.ts).
// Uso: npm test   (o: node --test scripts/test-leads-dormidos.mjs)
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

const d = await import("../lib/leadsDormidos.ts");
const ahora = new Date("2026-11-19T12:00:00Z");
const haceDias = (n, horas = 0) => new Date(ahora.getTime() - n * 864e5 - horas * 36e5);

test("dormido desde el umbral inclusive (7 días justos cuentan)", () => {
  assert.equal(d.esDormido({ etapa: "NUEVO", ultimaActividadEn: haceDias(7) }, 7, ahora), true);
  assert.equal(d.esDormido({ etapa: "NUEVO", ultimaActividadEn: haceDias(6, 23) }, 7, ahora), false);
});

test("un lead cerrado nunca está dormido", () => {
  assert.equal(d.esDormido({ etapa: "CERRADO", ultimaActividadEn: haceDias(200) }, 7, ahora), false);
});

test("aplica a cualquier etapa abierta, no solo NUEVO", () => {
  for (const etapa of ["NUEVO", "CONTACTADO", "TEST_DRIVE", "NEGOCIACION"]) {
    assert.equal(d.esDormido({ etapa, ultimaActividadEn: haceDias(10) }, 7, ahora), true, etapa);
  }
});

test("el umbral de la agencia cambia el resultado", () => {
  const lead = { etapa: "CONTACTADO", ultimaActividadEn: haceDias(10) };
  assert.equal(d.esDormido(lead, 14, ahora), false);
  assert.equal(d.esDormido(lead, 10, ahora), true);
});

test("acepta fechas como string ISO (lo que llega al cliente)", () => {
  assert.equal(d.diasSinMovimiento(haceDias(12).toISOString(), ahora), 12);
  assert.equal(d.diasSinMovimiento("no es fecha", ahora), 0);
  assert.equal(d.diasSinMovimiento(new Date(ahora.getTime() + 864e5), ahora), 0); // futuro → 0
});

test("corte para la base: dormido <=> ultimaActividadEn <= corte", () => {
  const corte = d.corteDormidos(7, ahora);
  assert.equal(corte.toISOString(), haceDias(7).toISOString());
});

test("opciones del umbral y validación", () => {
  assert.equal(d.DIAS_DORMIDO_DEFAULT, 7);
  assert.ok(d.esDiasDormidoValido(7));
  assert.ok(d.esDiasDormidoValido(30));
  assert.equal(d.esDiasDormidoValido(8), false);
  assert.equal(d.esDiasDormidoValido("7"), false);
});

test("texto de días", () => {
  assert.equal(d.textoDiasSinMovimiento(0), "hoy");
  assert.equal(d.textoDiasSinMovimiento(1), "hace 1 día");
  assert.equal(d.textoDiasSinMovimiento(12), "hace 12 días");
});
