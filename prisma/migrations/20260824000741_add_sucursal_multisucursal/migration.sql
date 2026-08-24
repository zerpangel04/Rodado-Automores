-- CreateTable
CREATE TABLE "Sucursal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sucursal_tenantId_idx" ON "Sucursal"("tenantId");

-- AddForeignKey
ALTER TABLE "Sucursal" ADD CONSTRAINT "Sucursal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: agregamos la columna nullable primero para poder backfillear
-- sin romper los datos existentes de cada tenant (incluida Agencia Demo).
ALTER TABLE "Vehiculo" ADD COLUMN "sucursalId" TEXT;

-- Data migration: creamos una "Sucursal Principal" por cada tenant que ya
-- existe y le asignamos todos sus vehículos actuales, para que nadie note
-- ningún cambio en los datos que ya tienen.
INSERT INTO "Sucursal" ("id", "tenantId", "nombre", "createdAt")
SELECT gen_random_uuid()::text, "id", 'Sucursal Principal', CURRENT_TIMESTAMP
FROM "Tenant";

UPDATE "Vehiculo" v
SET "sucursalId" = s."id"
FROM "Sucursal" s
WHERE s."tenantId" = v."tenantId"
  AND s."nombre" = 'Sucursal Principal';

-- Ahora que todas las filas tienen sucursalId, la volvemos obligatoria.
ALTER TABLE "Vehiculo" ALTER COLUMN "sucursalId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Vehiculo_sucursalId_idx" ON "Vehiculo"("sucursalId");

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
