-- CreateTable
CREATE TABLE "DispositivoConfiable" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoUso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispositivoConfiable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodigoVerificacionLogin" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "codigoHash" TEXT NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodigoVerificacionLogin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DispositivoConfiable_usuarioId_tokenHash_idx" ON "DispositivoConfiable"("usuarioId", "tokenHash");

-- CreateIndex
CREATE INDEX "CodigoVerificacionLogin_usuarioId_idx" ON "CodigoVerificacionLogin"("usuarioId");

-- AddForeignKey
ALTER TABLE "DispositivoConfiable" ADD CONSTRAINT "DispositivoConfiable_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodigoVerificacionLogin" ADD CONSTRAINT "CodigoVerificacionLogin_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
