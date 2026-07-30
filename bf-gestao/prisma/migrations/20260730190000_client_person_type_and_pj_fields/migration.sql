-- CreateEnum
CREATE TYPE "ClientPersonType" AS ENUM ('PF', 'PJ');

-- AlterTable
ALTER TABLE "clients"
  ADD COLUMN "personType" "ClientPersonType" NOT NULL DEFAULT 'PJ',
  ADD COLUMN "cpf" TEXT,
  ADD COLUMN "tipoAtividade" TEXT,
  ADD COLUMN "inscricaoMunicipal" TEXT,
  ADD COLUMN "inscricaoEstadual" TEXT,
  ADD COLUMN "country" TEXT NOT NULL DEFAULT 'BR',
  ALTER COLUMN "cnpj" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "clients_cpf_key" ON "clients"("cpf");
