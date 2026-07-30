import { addDays } from "./dates";

export type RecurringPeriodicity = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMESTER" | "YEARLY";

export type Competencia = { key: string; inicio: Date; fim: Date };

function pad(value: number, size: number): string {
  return String(value).padStart(size, "0");
}

function mondayOf(date: Date): Date {
  const day = date.getUTCDay(); // 0 = domingo .. 6 = sábado
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(date, diff);
}

function isoWeekKey(monday: Date): string {
  const thursday = addDays(monday, 3);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil((thursday.getTime() - yearStart.getTime()) / 86_400_000 / 7) + 1;
  return `${thursday.getUTCFullYear()}-W${pad(week, 2)}`;
}

function lastDayOfMonth(year: number, monthIndex0: number): Date {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0));
}

// Período (início/fim/chave canônica) que contém `date`, para cada periodicidade.
export function competenciaAt(periodicity: RecurringPeriodicity, date: Date): Competencia {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  switch (periodicity) {
    case "WEEKLY": {
      const inicio = mondayOf(date);
      return { key: isoWeekKey(inicio), inicio, fim: addDays(inicio, 6) };
    }
    case "MONTHLY": {
      const inicio = new Date(Date.UTC(year, month, 1));
      return { key: `${year}-${pad(month + 1, 2)}`, inicio, fim: lastDayOfMonth(year, month) };
    }
    case "QUARTERLY": {
      const quarter = Math.floor(month / 3);
      const startMonth = quarter * 3;
      const inicio = new Date(Date.UTC(year, startMonth, 1));
      return { key: `${year}-Q${quarter + 1}`, inicio, fim: lastDayOfMonth(year, startMonth + 2) };
    }
    case "SEMESTER": {
      const half = month < 6 ? 0 : 1;
      const startMonth = half * 6;
      const inicio = new Date(Date.UTC(year, startMonth, 1));
      return { key: `${year}-S${half + 1}`, inicio, fim: lastDayOfMonth(year, startMonth + 5) };
    }
    case "YEARLY": {
      const inicio = new Date(Date.UTC(year, 0, 1));
      return { key: `${year}`, inicio, fim: new Date(Date.UTC(year, 11, 31)) };
    }
  }
}

// Próximo período, derivado sempre do histórico (fim do período atual + 1 dia) — nunca da data de hoje.
export function nextCompetencia(periodicity: RecurringPeriodicity, currentInicio: Date): Competencia {
  const current = competenciaAt(periodicity, currentInicio);
  return competenciaAt(periodicity, addDays(current.fim, 1));
}
