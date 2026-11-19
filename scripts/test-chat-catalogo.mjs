// Pruebas del stock que se le pasa al chat del catálogo (lib/chatCatalogo.ts).
// Uso: npm test   (o: node --test scripts/test-chat-catalogo.mjs)
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

const chat = await import("../lib/chatCatalogo.ts");
const auto = (o) => ({ id: "x", marca: "Fiat", modelo: "Uno", anio: 2012, km: 140000, precio: 9500000, moneda: "ARS", estado: "DISPONIBLE", transmision: null, motor: null, ...o });
const oficial = { tipo: "OFICIAL", venta: 1580, fecha: "2026-11-19T13:00:00.000Z" };

test("chat: cada precio en su moneda, con ≈ de la cotización de la agencia", () => {
  const txt = chat.formatearStock([auto(), auto({ marca: "Peugeot", modelo: "208", precio: 17800, moneda: "USD" })], oficial);
  assert.match(txt, /\$9\.500\.000 \(en pesos; ≈ USD 6\.013\)/);
  assert.match(txt, /USD 17\.800 \(en dólares; ≈ \$28\.124\.000\)/);
  assert.doesNotMatch(txt, /USD 9\.500\.000/); // el bug de antes: pesos leídos como dólares
});

test("chat: sin cotización no hay ≈ y el prompt lo dice", () => {
  const txt = chat.formatearStock([auto()], null);
  assert.match(txt, /\$9\.500\.000 \(en pesos\)/);
  assert.doesNotMatch(txt, /≈/);
  assert.match(chat.textoCotizacionChat(null), /no des equivalentes/);
});

test("chat: el texto de cotización nombra el tipo, el valor y la fecha", () => {
  assert.equal(
    chat.textoCotizacionChat(oficial),
    'Los equivalentes "≈" están calculados con el dólar oficial ($1.580 por dólar, 19/11 10:00).'
  );
  assert.match(chat.textoCotizacionChat({ ...oficial, tipo: "BLUE" }), /dólar blue/);
});
