-- AlterTable
ALTER TABLE "users" ADD COLUMN "cpf" TEXT,
ADD COLUMN "birthDate" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");
