import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Não importa de "@/lib/passwords" aqui de propósito: esse módulo tem a diretiva
// "server-only", que lança erro fora do bundler do Next.js (como neste script tsx).
const hashPassword = (password: string) => bcrypt.hash(password, 12);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEPARTMENTS = [
  "Fiscal",
  "Pessoal",
  "Contábil",
  "Societário",
  "Financeiro",
  "Legal",
  "Diretoria",
];

async function main() {
  for (const name of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
  console.log(`Departamentos: ${DEPARTMENTS.length} garantidos.`);

  const adminEmail = process.env.ADMIN_EMAIL ?? "bianca@bfservicoscontabeis.com.br";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existingAdmin) {
    console.log(`Usuário admin "${adminEmail}" já existe — nada a fazer.`);
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD ?? randomBytes(9).toString("base64url");
  const passwordHash = await hashPassword(adminPassword);

  await prisma.user.create({
    data: {
      name: "Bianca Fresneda",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Usuário admin criado:");
  console.log(`  E-mail: ${adminEmail}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`  Senha temporária (gerada automaticamente): ${adminPassword}`);
    console.log("  Troque essa senha assim que possível.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
