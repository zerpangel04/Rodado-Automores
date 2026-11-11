-- AlterTable
ALTER TABLE "Vehiculo" ADD COLUMN     "destacadoEn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "limiteDestacados" INTEGER NOT NULL DEFAULT 0;


-- Data: Básico queda en 0 por el default; Profesional 3, Empresa 4.
UPDATE "Plan" SET "limiteDestacados" = 3 WHERE "id" = 'profesional';
UPDATE "Plan" SET "limiteDestacados" = 4 WHERE "id" = 'empresa';
