import { addDays, isoDateKey } from "./dates";
import type { Rule } from "@/app/(app)/configuracoes/tarefas/rule";

export type BusinessDayAdjustment = "NONE" | "ANTECIPATE" | "POSTPONE";

export function isBusinessDay(date: Date, holidays: ReadonlySet<string>): boolean {
  const day = date.getUTCDay();
  if (day === 0 || day === 6) return false;
  return !holidays.has(isoDateKey(date));
}

function targetMonthFirstDay(competenciaInicio: Date, monthOffset: number): Date {
  return new Date(Date.UTC(competenciaInicio.getUTCFullYear(), competenciaInicio.getUTCMonth() + monthOffset, 1));
}

function lastCalendarDayOfMonth(firstDayOfMonth: Date): Date {
  return new Date(Date.UTC(firstDayOfMonth.getUTCFullYear(), firstDayOfMonth.getUTCMonth() + 1, 0));
}

function resolveRuleDate(rule: Rule, competenciaInicio: Date, holidays: ReadonlySet<string>): Date {
  switch (rule.type) {
    case "unset":
      throw new Error("Regra de prazo legal não definida para este template.");
    case "dayOfMonth": {
      const first = targetMonthFirstDay(competenciaInicio, rule.monthOffset);
      const last = lastCalendarDayOfMonth(first);
      const day = Math.min(rule.day, last.getUTCDate());
      return new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), day));
    }
    case "lastBusinessDay": {
      const first = targetMonthFirstDay(competenciaInicio, rule.monthOffset);
      let date = lastCalendarDayOfMonth(first);
      while (!isBusinessDay(date, holidays)) date = addDays(date, -1);
      return date;
    }
    case "nthBusinessDay": {
      const first = targetMonthFirstDay(competenciaInicio, rule.monthOffset);
      const lastOfMonth = lastCalendarDayOfMonth(first);
      let date = first;
      let count = 0;
      while (date.getTime() <= lastOfMonth.getTime()) {
        if (isBusinessDay(date, holidays)) {
          count++;
          if (count === rule.n) return date;
        }
        date = addDays(date, 1);
      }
      throw new Error(`O mês não tem ${rule.n} dias úteis suficientes para aplicar a regra.`);
    }
  }
}

function applyBusinessDayAdjustment(
  date: Date,
  adjustment: BusinessDayAdjustment,
  holidays: ReadonlySet<string>,
): Date {
  if (adjustment === "NONE") return date;
  const step = adjustment === "ANTECIPATE" ? -1 : 1;
  let adjusted = date;
  while (!isBusinessDay(adjusted, holidays)) adjusted = addDays(adjusted, step);
  return adjusted;
}

export function computeDeadlines({
  rule,
  competenciaInicio,
  businessDayAdjustment,
  metaOffsetDays,
  holidays,
}: {
  rule: Rule;
  competenciaInicio: Date;
  businessDayAdjustment: BusinessDayAdjustment;
  metaOffsetDays: number;
  holidays: ReadonlySet<string>;
}): { prazoLegal: Date; prazoMeta: Date } {
  const rawLegal = resolveRuleDate(rule, competenciaInicio, holidays);
  const prazoLegal = applyBusinessDayAdjustment(rawLegal, businessDayAdjustment, holidays);
  const rawMeta = addDays(prazoLegal, metaOffsetDays);
  const prazoMeta = applyBusinessDayAdjustment(rawMeta, businessDayAdjustment, holidays);
  return { prazoLegal, prazoMeta };
}
