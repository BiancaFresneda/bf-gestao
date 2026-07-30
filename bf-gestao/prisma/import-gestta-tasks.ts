import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Importa o catálogo de tarefas recorrentes exportado do Gestta (sistema pago anteriormente),
// como referência de partida. Todas entram INATIVAS — cada uma será revisada, terá a regra de
// prazo legal definida, e só então ativada (globalmente e/ou por cliente) conforme a necessidade.
// Fonte: docs/reference/gestta-tarefas-recorrentes.xlsx

type GesttaRow = {
  name: string;
  department: string;
  metaOffsetDays: number;
  periodicity: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMESTER" | "YEARLY";
  geraMulta: boolean;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const filePath = path.join(__dirname, "data", "gestta-tarefas-recorrentes.json");
  const rows: GesttaRow[] = JSON.parse(readFileSync(filePath, "utf-8"));

  const departments = await prisma.department.findMany();
  const departmentIdByName = new Map(departments.map((d) => [d.name, d.id]));

  let created = 0;
  let skippedMissingDepartment = 0;

  for (const row of rows) {
    const departmentId = departmentIdByName.get(row.department);
    if (!departmentId) {
      console.warn(`Departamento não encontrado: "${row.department}" (tarefa "${row.name}")`);
      skippedMissingDepartment++;
      continue;
    }

    await prisma.taskTemplate.create({
      data: {
        name: row.name,
        departmentId,
        periodicity: row.periodicity,
        // Regra de prazo legal ainda não definida — o Gestta não exporta essa informação,
        // só o deslocamento do prazo meta. Preencher manualmente antes de ativar o template.
        legalDeadlineRule: { type: "unset", note: "Definir regra de prazo legal antes de ativar." },
        metaDeadlineOffsetDays: row.metaOffsetDays,
        geraMulta: row.geraMulta,
        active: false,
      },
    });
    created++;
  }

  console.log(`Templates de tarefa importados (inativos): ${created}`);
  if (skippedMissingDepartment > 0) {
    console.log(`Ignorados por departamento não encontrado: ${skippedMissingDepartment}`);
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
