// Links de WhatsApp para números argentinos.
//
// WhatsApp identifica a los celulares argentinos como 54 9 + código de área
// (sin 0) + número (sin 15): 10 dígitos después del 9. El link viejo armaba
// "54" + número tal cual, sin el 9 y con el 0/15 si la agencia los había
// escrito, así que en muchos casos abría un chat con un número inexistente.

export const WHATSAPP_MAX = 30;

/**
 * Devuelve el número en formato internacional para wa.me (ej. "5491123456789")
 * o null si no se puede interpretar como un celular argentino.
 * Acepta las formas habituales: "11 2345-6789", "011 15 2345-6789",
 * "+54 9 11 2345 6789", "(0351) 15-123-4567", "5491123456789".
 */
export function normalizarWhatsappAR(entrada: string): string | null {
  let d = entrada.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);

  if (d.startsWith("54")) {
    d = d.slice(2);
    if (d.startsWith("9")) d = d.slice(1);
  }
  if (d.startsWith("0")) d = d.slice(1);

  // Código de área (2 a 4 dígitos) + 15 + número: sacamos el 15.
  if (d.length === 12) {
    const i = [2, 3, 4].find((pos) => d.slice(pos, pos + 2) === "15");
    if (i === undefined) return null;
    d = d.slice(0, i) + d.slice(i + 2);
  }

  if (d.length !== 10) return null;
  return `549${d}`;
}

export function urlWhatsapp(numero: string, mensaje?: string): string | null {
  const n = normalizarWhatsappAR(numero);
  if (!n) return null;
  return mensaje ? `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}` : `https://wa.me/${n}`;
}

// Número del catálogo: el propio de la agencia si lo cargó; si no, el
// primer teléfono de sucursal que sirva (puede ser un fijo, por eso conviene
// cargar el campo propio).
export function whatsappDelCatalogo(
  whatsappAgencia: string | null,
  telefonosSucursales: (string | null)[]
): string | null {
  for (const t of [whatsappAgencia, ...telefonosSucursales]) {
    if (t && normalizarWhatsappAR(t)) return t;
  }
  return null;
}
