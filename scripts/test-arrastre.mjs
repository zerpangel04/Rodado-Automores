// Pruebas del botón flotante arrastrable (lib/arrastre.ts).
// Uso: npm test   (o: node --test scripts/test-arrastre.mjs)
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

const a = await import("../lib/arrastre.ts");
// Botón de 52px en su lugar por defecto: abajo a la derecha de 1366×641, a 24px.
const caja = { left: 1290, top: 565, right: 1342, bottom: 617 };

test("toque vs arrastre: hasta 6px es un toque", () => {
  assert.equal(a.superoUmbral(0, 0), false);
  assert.equal(a.superoUmbral(4, 4), false); // 5,66px
  assert.equal(a.superoUmbral(6, 0), false); // justo el umbral
  assert.equal(a.superoUmbral(5, 4), true); // 6,4px
  assert.equal(a.superoUmbral(0, -30), true);
});

test("no sale de la pantalla (margen de 8px)", () => {
  // Muy a la izquierda/arriba → queda pegado al margen.
  assert.deepEqual(a.limitarDesplazamiento({ x: -5000, y: -5000 }, caja, 1366, 641), { x: 8 - 1290, y: 8 - 565 });
  // Más allá de la esquina por defecto → no puede pasar el borde derecho/inferior.
  assert.deepEqual(a.limitarDesplazamiento({ x: 500, y: 500 }, caja, 1366, 641), { x: 1366 - 8 - 1342, y: 641 - 8 - 617 });
  // Dentro de los límites → no cambia.
  assert.deepEqual(a.limitarDesplazamiento({ x: -300, y: -200 }, caja, 1366, 641), { x: -300, y: -200 });
});

test("si la pantalla se achica, la posición guardada se vuelve a encuadrar", () => {
  // Guardado en una pantalla grande, abierto en un celular de 360×640.
  const cajaCel = { left: 294, top: 574, right: 346, bottom: 626 };
  const d = a.limitarDesplazamiento({ x: -1200, y: -500 }, cajaCel, 360, 640);
  assert.equal(cajaCel.left + d.x, 8);
  assert.equal(cajaCel.top + d.y, 74);
});

test("pantalla más chica que el botón: se centra en lugar de romperse", () => {
  const d = a.limitarDesplazamiento({ x: 0, y: 0 }, { left: 0, top: 0, right: 100, bottom: 100 }, 50, 50);
  assert.ok(Number.isFinite(d.x) && Number.isFinite(d.y));
});

test("lectura de localStorage tolerante a basura", () => {
  assert.deepEqual(a.leerDesplazamiento('{"x":-120,"y":-40}'), { x: -120, y: -40 });
  assert.equal(a.leerDesplazamiento(null), null);
  assert.equal(a.leerDesplazamiento(""), null);
  assert.equal(a.leerDesplazamiento("no json"), null);
  assert.equal(a.leerDesplazamiento('{"x":"1","y":2}'), null);
  assert.equal(a.leerDesplazamiento('{"x":null,"y":2}'), null);
  assert.equal(a.leerDesplazamiento("[1,2]"), null);
});

test("se guarda redondeado y el transform usa translate3d", () => {
  assert.equal(a.serializarDesplazamiento({ x: -120.6, y: 40.2 }), '{"x":-121,"y":40}');
  assert.equal(a.transformDe({ x: 0, y: 0 }), "");
  assert.equal(a.transformDe({ x: -120.4, y: -40 }), "translate3d(-120px, -40px, 0)");
});

test("viewport sin tamaño (pestaña oculta/minimizada): no mueve el botón", () => {
  assert.deepEqual(a.limitarDesplazamiento({ x: 0, y: 0 }, caja, 0, 0), { x: 0, y: 0 });
  assert.deepEqual(a.limitarDesplazamiento({ x: -120, y: -40 }, caja, 0, 641), { x: -120, y: -40 });
});
