// Margen para transacciones interactivas cortas de Prisma
// (`prisma.$transaction(async (tx) => …, TX_OPCIONES)`).
//
// El default de Prisma son 5 s de timeout y 2 s de espera por una conexión.
// Contra Supabase cada consulta tarda: con 4-5 consultas se pasaba y la
// transacción fallaba con P2028 ("Transaction not found"), deshaciéndose
// entera. Con dinero de por medio (liquidar/anular comisiones) eso es un
// error visible para el usuario, aunque no deja datos a medias.
export const TX_OPCIONES = { timeout: 15_000, maxWait: 10_000 } as const;
