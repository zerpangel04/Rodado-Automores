-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "colorAcento" VARCHAR(7);

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "catalogoPersonalizado" BOOLEAN NOT NULL DEFAULT false;


-- Data: la personalización del catálogo es de Profesional y Empresa.
UPDATE "Plan" SET "catalogoPersonalizado" = true WHERE "id" IN ('profesional', 'empresa');
