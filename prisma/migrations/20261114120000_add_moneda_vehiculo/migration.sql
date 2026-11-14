-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('USD', 'ARS');

-- CreateEnum
CREATE TYPE "TipoCotizacion" AS ENUM ('OFICIAL', 'BLUE');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "cotizacionPreferida" "TipoCotizacion" NOT NULL DEFAULT 'OFICIAL';

-- AlterTable
ALTER TABLE "Vehiculo" ADD COLUMN     "moneda" "Moneda" NOT NULL DEFAULT 'USD';

