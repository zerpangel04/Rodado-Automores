-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "cotizacion" DECIMAL(65,30),
ADD COLUMN     "moneda" "Moneda" NOT NULL DEFAULT 'USD';
