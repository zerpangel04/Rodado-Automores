-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "diasExpedienteTrabado" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "PasoTramitePlantilla" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "orden" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasoTramitePlantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expediente" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaActividadEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completadoEn" TIMESTAMP(3),

    CONSTRAINT "Expediente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasoExpediente" (
    "id" TEXT NOT NULL,
    "expedienteId" TEXT NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "orden" INTEGER NOT NULL,
    "hecho" BOOLEAN NOT NULL DEFAULT false,
    "fecha" DATE,
    "nota" VARCHAR(300),
    "completadoPorId" TEXT,
    "completadoEn" TIMESTAMP(3),

    CONSTRAINT "PasoExpediente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasoTramitePlantilla_tenantId_orden_idx" ON "PasoTramitePlantilla"("tenantId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "Expediente_ventaId_key" ON "Expediente"("ventaId");

-- CreateIndex
CREATE INDEX "Expediente_tenantId_ultimaActividadEn_idx" ON "Expediente"("tenantId", "ultimaActividadEn");

-- CreateIndex
CREATE INDEX "PasoExpediente_expedienteId_orden_idx" ON "PasoExpediente"("expedienteId", "orden");

-- AddForeignKey
ALTER TABLE "PasoTramitePlantilla" ADD CONSTRAINT "PasoTramitePlantilla_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expediente" ADD CONSTRAINT "Expediente_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expediente" ADD CONSTRAINT "Expediente_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasoExpediente" ADD CONSTRAINT "PasoExpediente_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasoExpediente" ADD CONSTRAINT "PasoExpediente_completadoPorId_fkey" FOREIGN KEY ("completadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

