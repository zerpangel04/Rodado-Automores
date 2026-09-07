-- AlterTable: agregar precioUsd primero nullable para poder backfillear
-- los 3 planes existentes antes de exigir NOT NULL.
ALTER TABLE "Plan" ADD COLUMN "precioUsd" DECIMAL(65,30);

UPDATE "Plan" SET "precioUsd" = 20 WHERE "id" = 'basico';
UPDATE "Plan" SET "precioUsd" = 45 WHERE "id" = 'profesional';
UPDATE "Plan" SET "precioUsd" = 100 WHERE "id" = 'empresa';

ALTER TABLE "Plan" ALTER COLUMN "precioUsd" SET NOT NULL;
