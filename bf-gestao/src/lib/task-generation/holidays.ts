import "server-only";
import { prisma } from "@/lib/prisma";
import { isoDateKey } from "./dates";

export async function loadHolidaySet(): Promise<Set<string>> {
  const holidays = await prisma.holiday.findMany({ select: { date: true } });
  return new Set(holidays.map((h) => isoDateKey(h.date)));
}
