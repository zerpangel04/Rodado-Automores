-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "limiteSucursales" INTEGER,
    "limiteVehiculos" INTEGER,
    "limiteUsuarios" INTEGER,
    "reportesAvanzados" BOOLEAN NOT NULL DEFAULT false,
    "asistenteIA" BOOLEAN NOT NULL DEFAULT false,
    "soportePrioritario" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- Seed data: los 3 planes reales de Rodado.
INSERT INTO "Plan" ("id", "nombre", "limiteSucursales", "limiteVehiculos", "limiteUsuarios", "reportesAvanzados", "asistenteIA", "soportePrioritario")
VALUES
  ('basico', 'Básico', 1, 25, 2, false, false, false),
  ('profesional', 'Profesional', 2, 75, 6, true, true, false),
  ('empresa', 'Empresa', NULL, NULL, NULL, true, true, true);

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "plan",
ADD COLUMN     "planId" TEXT NOT NULL DEFAULT 'basico';

-- CreateIndex
CREATE UNIQUE INDEX "Plan_nombre_key" ON "Plan"("nombre");

-- CreateIndex
CREATE INDEX "Tenant_planId_idx" ON "Tenant"("planId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
