-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('DUENIO', 'VENDEDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "EstadoVehiculo" AS ENUM ('DISPONIBLE', 'RESERVADO', 'VENDIDO');

-- CreateEnum
CREATE TYPE "CanalLead" AS ENUM ('WHATSAPP', 'MERCADO_LIBRE', 'INSTAGRAM', 'WEB');

-- CreateEnum
CREATE TYPE "EtapaLead" AS ENUM ('NUEVO', 'CONTACTADO', 'TEST_DRIVE', 'NEGOCIACION', 'CERRADO');

-- CreateEnum
CREATE TYPE "EstadoCobro" AS ENUM ('PENDIENTE', 'COBRADO');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'basico',
    "dominio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'VENDEDOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehiculo" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "km" INTEGER NOT NULL,
    "precioUsd" DECIMAL(65,30) NOT NULL,
    "estado" "EstadoVehiculo" NOT NULL DEFAULT 'DISPONIBLE',
    "categoria" TEXT,
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "docTitulo" BOOLEAN NOT NULL DEFAULT false,
    "docCedula" BOOLEAN NOT NULL DEFAULT false,
    "docDominio" BOOLEAN NOT NULL DEFAULT false,
    "docLibreDeuda" BOOLEAN NOT NULL DEFAULT false,
    "vtvVencimiento" TIMESTAMP(3),

    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehiculoId" TEXT,
    "nombreCliente" TEXT NOT NULL,
    "contacto" TEXT,
    "canal" "CanalLead" NOT NULL,
    "etapa" "EtapaLead" NOT NULL DEFAULT 'NUEVO',
    "vendedorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehiculoId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "precioFinal" DECIMAL(65,30) NOT NULL,
    "comision" DECIMAL(65,30) NOT NULL,
    "estadoCobro" "EstadoCobro" NOT NULL DEFAULT 'PENDIENTE',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_dominio_key" ON "Tenant"("dominio");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Vehiculo_tenantId_estado_idx" ON "Vehiculo"("tenantId", "estado");

-- CreateIndex
CREATE INDEX "Lead_tenantId_etapa_idx" ON "Lead"("tenantId", "etapa");

-- CreateIndex
CREATE UNIQUE INDEX "Venta_vehiculoId_key" ON "Venta"("vehiculoId");

-- CreateIndex
CREATE INDEX "Venta_tenantId_fecha_idx" ON "Venta"("tenantId", "fecha");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
