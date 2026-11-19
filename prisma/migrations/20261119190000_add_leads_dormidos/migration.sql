-- AlterEnum
ALTER TYPE "TipoActividad" ADD VALUE 'CONTACTO_LEAD';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "ultimaActividadEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "diasLeadDormido" INTEGER NOT NULL DEFAULT 7;

-- CreateIndex
CREATE INDEX "Lead_tenantId_ultimaActividadEn_idx" ON "Lead"("tenantId", "ultimaActividadEn");

-- Backfill (agregado a mano): el ADD COLUMN deja a todos los leads con la
-- fecha de hoy. Se reemplaza por su último movimiento real conocido: la
-- entrada más reciente de ActividadLog del lead, o su creación si no tiene.
UPDATE "Lead" l
SET "ultimaActividadEn" = GREATEST(
  l."createdAt",
  COALESCE((SELECT MAX(a."createdAt") FROM "ActividadLog" a WHERE a."leadId" = l."id"), l."createdAt")
);
