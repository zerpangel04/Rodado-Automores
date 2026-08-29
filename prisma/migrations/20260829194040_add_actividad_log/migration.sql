-- CreateEnum
CREATE TYPE "TipoActividad" AS ENUM ('NUEVO_LEAD', 'CAMBIO_ETAPA_LEAD', 'VENTA_REGISTRADA', 'VEHICULO_VENDIDO', 'VEHICULO_RESERVADO');

-- CreateTable
CREATE TABLE "ActividadLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" "TipoActividad" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "leadId" TEXT,
    "vehiculoId" TEXT,
    "ventaId" TEXT,
    "vendedorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActividadLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActividadLog_tenantId_createdAt_idx" ON "ActividadLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ActividadLog_tenantId_vendedorId_createdAt_idx" ON "ActividadLog"("tenantId", "vendedorId", "createdAt");

-- AddForeignKey
ALTER TABLE "ActividadLog" ADD CONSTRAINT "ActividadLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadLog" ADD CONSTRAINT "ActividadLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadLog" ADD CONSTRAINT "ActividadLog_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadLog" ADD CONSTRAINT "ActividadLog_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadLog" ADD CONSTRAINT "ActividadLog_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
