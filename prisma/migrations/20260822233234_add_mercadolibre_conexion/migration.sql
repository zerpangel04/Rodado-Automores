-- CreateTable
CREATE TABLE "MercadoLibreConexion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "mlUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MercadoLibreConexion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MercadoLibreConexion_tenantId_key" ON "MercadoLibreConexion"("tenantId");

-- AddForeignKey
ALTER TABLE "MercadoLibreConexion" ADD CONSTRAINT "MercadoLibreConexion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
