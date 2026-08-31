-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoActividad" ADD VALUE 'ML_ACTUALIZADO';
ALTER TYPE "TipoActividad" ADD VALUE 'ML_PAUSADA';
ALTER TYPE "TipoActividad" ADD VALUE 'ML_ATENCION';

-- AlterTable
ALTER TABLE "MercadoLibreConexion" ADD COLUMN     "pausarAlVender" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "syncFotos" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "syncPrecios" BOOLEAN NOT NULL DEFAULT true;
