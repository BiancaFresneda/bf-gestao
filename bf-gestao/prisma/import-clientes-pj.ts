import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Importa a base de clientes PJ ativos, exportada da planilha de controle atual.
// Fonte: docs/reference/Clientes.xlsx (aba "Ativos")

type ClienteRow = {
  name: string;
  tipoAtividade: string;
  cnpj: string;
  taxRegime: string;
  inscricaoMunicipal: string | null;
  inscricaoEstadual: string | null;
  municipio: string;
  uf: string;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const filePath = path.join(__dirname, "data", "clientes-pj.json");
  const rows: ClienteRow[] = JSON.parse(readFileSync(filePath, "utf-8"));

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const existing = await prisma.client.findUnique({ where: { cnpj: row.cnpj } });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.client.create({
      data: {
        name: row.name,
        personType: "PJ",
        cnpj: row.cnpj,
        tipoAtividade: row.tipoAtividade,
        taxRegime: row.taxRegime,
        inscricaoMunicipal: row.inscricaoMunicipal,
        inscricaoEstadual: row.inscricaoEstadual,
        municipio: row.municipio,
        uf: row.uf,
        country: "BR",
        status: "ATIVO",
      },
    });
    created++;
  }

  console.log(`Clientes PJ importados: ${created}`);
  if (skipped > 0) {
    console.log(`Ignorados (CNPJ já cadastrado): ${skipped}`);
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
