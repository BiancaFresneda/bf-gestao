import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

// Algoritmo de Meeus/Jones/Butcher — Domingo de Páscoa (calendário gregoriano).
function easterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function nationalHolidaysFor(year: number): { date: Date; name: string }[] {
  const easter = easterDate(year);
  const holidays = [
    { date: new Date(Date.UTC(year, 0, 1)), name: "Confraternização Universal" },
    { date: addDays(easter, -48), name: "Carnaval (segunda-feira)" },
    { date: addDays(easter, -47), name: "Carnaval (terça-feira)" },
    { date: addDays(easter, -2), name: "Sexta-feira Santa" },
    { date: addDays(easter, 60), name: "Corpus Christi" },
    { date: new Date(Date.UTC(year, 3, 21)), name: "Tiradentes" },
    { date: new Date(Date.UTC(year, 4, 1)), name: "Dia do Trabalho" },
    { date: new Date(Date.UTC(year, 8, 7)), name: "Independência do Brasil" },
    { date: new Date(Date.UTC(year, 9, 12)), name: "Nossa Senhora Aparecida" },
    { date: new Date(Date.UTC(year, 10, 2)), name: "Finados" },
    { date: new Date(Date.UTC(year, 10, 15)), name: "Proclamação da República" },
    { date: new Date(Date.UTC(year, 11, 25)), name: "Natal" },
  ];

  // Dia Nacional de Zumbi e da Consciência Negra — feriado nacional desde a Lei 14.759/2023.
  if (year >= 2024) {
    holidays.push({ date: new Date(Date.UTC(year, 10, 20)), name: "Consciência Negra" });
  }

  return holidays;
}

async function main() {
  const years = [2025, 2026, 2027, 2028];
  const rows = years.flatMap((year) =>
    nationalHolidaysFor(year).map((h) => ({ date: h.date, name: h.name, scope: "NACIONAL" as const })),
  );

  const result = await prisma.holiday.createMany({ data: rows, skipDuplicates: true });
  console.log(`Feriados nacionais ${years[0]}–${years[years.length - 1]}: ${result.count} inseridos (duplicados ignorados).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
