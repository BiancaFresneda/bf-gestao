-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "empresaId" TEXT;

-- CreateIndex
CREATE INDEX "clients_empresaId_idx" ON "clients"("empresaId");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
