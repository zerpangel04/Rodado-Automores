import { createHash } from "crypto";

// Cookie que marca este navegador como confiable para un usuario puntual
// después de verificar un código de un solo uso — mientras exista y su
// hash coincida con un DispositivoConfiable en la base, el login no vuelve
// a pedir código para ese usuario.
export const DISPOSITIVO_COOKIE_NAME = "rodado_dispositivo";
export const DISPOSITIVO_MAX_AGE_DIAS = 90;
export const DISPOSITIVO_MAX_AGE_SEGUNDOS = DISPOSITIVO_MAX_AGE_DIAS * 24 * 60 * 60;

// sha256 alcanza: el valor de la cookie son 32 bytes aleatorios (256 bits
// de entropía), no una contraseña de baja entropía — no hace falta bcrypt.
export function hashDispositivoToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
