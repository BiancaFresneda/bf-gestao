-- CreateEnum
CREATE TYPE "EmpresaTaxIdType" AS ENUM ('CNPJ', 'EIN');

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "taxIdType" "EmpresaTaxIdType" NOT NULL DEFAULT 'CNPJ',
    "taxId" TEXT,
    "inscricaoMunicipal" TEXT,
    "inscricaoEstadual" TEXT,
    "taxRegime" TEXT,
    "openingDate" TIMESTAMP(3),
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "stateProvince" TEXT,
    "postalCode" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_taxId_key" ON "empresas"("taxId");
