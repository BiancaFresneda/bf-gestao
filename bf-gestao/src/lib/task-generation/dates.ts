export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function isoDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// "Hoje" no fuso do escritório, nunca `new Date()` cru — a VPS roda em UTC.
export function nowInSaoPauloMidnight(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [year, month, day] = parts.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
