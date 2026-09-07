-- CreateTable
CREATE TABLE "SolicitudIntegracion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombrePlataforma" TEXT NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitudIntegracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteresIntegracion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipoIntegracion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteresIntegracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SolicitudIntegracion_tenantId_idx" ON "SolicitudIntegracion"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "InteresIntegracion_tenantId_tipoIntegracion_key" ON "InteresIntegracion"("tenantId", "tipoIntegracion");

-- AddForeignKey
ALTER TABLE "SolicitudIntegracion" ADD CONSTRAINT "SolicitudIntegracion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteresIntegracion" ADD CONSTRAINT "InteresIntegracion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
