-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoActividad" ADD VALUE 'COMISION_LIQUIDADA';
ALTER TYPE "TipoActividad" ADD VALUE 'COMISION_ANULADA';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "comisionPct" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "comisionPct" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "liquidacionId" TEXT;

-- CreateTable
CREATE TABLE "LiquidacionComision" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "moneda" "Moneda" NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "cantidadVentas" INTEGER NOT NULL,
    "ventaIds" TEXT[],
    "nota" VARCHAR(200),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "historica" BOOLEAN NOT NULL DEFAULT false,
    "creadaPorId" TEXT,
    "anuladaEn" TIMESTAMP(3),
    "anuladaPorId" TEXT,

    CONSTRAINT "LiquidacionComision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiquidacionComision_tenantId_fecha_idx" ON "LiquidacionComision"("tenantId", "fecha");

-- CreateIndex
CREATE INDEX "LiquidacionComision_tenantId_vendedorId_idx" ON "LiquidacionComision"("tenantId", "vendedorId");

-- CreateIndex
CREATE INDEX "Venta_tenantId_liquidacionId_idx" ON "Venta"("tenantId", "liquidacionId");

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES "LiquidacionComision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidacionComision" ADD CONSTRAINT "LiquidacionComision_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidacionComision" ADD CONSTRAINT "LiquidacionComision_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidacionComision" ADD CONSTRAINT "LiquidacionComision_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidacionComision" ADD CONSTRAINT "LiquidacionComision_anuladaPorId_fkey" FOREIGN KEY ("anuladaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfill (agregado a mano): hasta ahora "Registrar pago de comisiones"
-- marcaba Venta.estadoCobro = 'COBRADO' (era lo único que lo escribía), sin
-- guardar cuándo. Cada grupo agencia + vendedor + moneda de esas ventas pasa
-- a ser UNA liquidación histórica. La fecha real del pago no existe: queda
-- la de esta migración, marcada historica = true, y se aclara en la nota.
INSERT INTO "LiquidacionComision" ("id", "tenantId", "vendedorId", "moneda", "total", "cantidadVentas", "ventaIds", "nota", "fecha", "historica")
SELECT
  'hist_' || md5(v."tenantId" || ':' || v."vendedorId" || ':' || v."moneda"::text),
  v."tenantId",
  v."vendedorId",
  v."moneda",
  SUM(v."comision"),
  COUNT(*)::int,
  array_agg(v."id" ORDER BY v."fecha"),
  'Registrada antes de las liquidaciones: la fecha real del pago no quedó guardada.',
  CURRENT_TIMESTAMP,
  true
FROM "Venta" v
WHERE v."estadoCobro" = 'COBRADO'
GROUP BY v."tenantId", v."vendedorId", v."moneda";

UPDATE "Venta" v
SET "liquidacionId" = l."id"
FROM "LiquidacionComision" l
WHERE l."historica"
  AND v."estadoCobro" = 'COBRADO'
  AND v."tenantId" = l."tenantId"
  AND v."vendedorId" = l."vendedorId"
  AND v."moneda" = l."moneda";
