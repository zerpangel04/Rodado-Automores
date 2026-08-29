-- AlterTable
ALTER TABLE "ActividadLog" ADD COLUMN     "leido" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ActividadLog_tenantId_leido_idx" ON "ActividadLog"("tenantId", "leido");
