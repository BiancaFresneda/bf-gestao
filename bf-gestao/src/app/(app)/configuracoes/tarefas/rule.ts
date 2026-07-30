import * as z from "zod";

export const RuleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("unset") }),
  z.object({
    type: z.literal("dayOfMonth"),
    day: z.coerce.number().int().min(1).max(31),
    monthOffset: z.coerce.number().int().min(0).max(3),
  }),
  z.object({
    type: z.literal("lastBusinessDay"),
    monthOffset: z.coerce.number().int().min(0).max(3),
  }),
  z.object({
    type: z.literal("nthBusinessDay"),
    n: z.coerce.number().int().min(1).max(31),
    monthOffset: z.coerce.number().int().min(0).max(3),
  }),
]);

export type Rule = z.infer<typeof RuleSchema>;

const MONTH_OFFSET_LABEL: Record<number, string> = {
  0: "no mesmo mês",
  1: "no mês seguinte",
  2: "2 meses depois",
  3: "3 meses depois",
};

export function describeRule(rule: unknown): string {
  const parsed = RuleSchema.safeParse(rule);
  if (!parsed.success) return "Regra inválida";

  const value = parsed.data;
  switch (value.type) {
    case "unset":
      return "A definir";
    case "dayOfMonth":
      return `Dia ${value.day} ${MONTH_OFFSET_LABEL[value.monthOffset]}`;
    case "lastBusinessDay":
      return `Último dia útil ${MONTH_OFFSET_LABEL[value.monthOffset]}`;
    case "nthBusinessDay":
      return `${value.n}º dia útil ${MONTH_OFFSET_LABEL[value.monthOffset]}`;
  }
}
