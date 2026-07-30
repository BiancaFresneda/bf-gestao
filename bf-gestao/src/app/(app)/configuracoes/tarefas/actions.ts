"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { RuleSchema } from "./rule";

async function requireAdmin() {
  const session = await verifySession();
  if (session.role !== "ADMIN") {
    throw new Error("Apenas administradores podem gerenciar o cadastro de tarefas.");
  }
}

const PERIODICITIES = ["WEEKLY", "MONTHLY", "QUARTERLY", "SEMESTER", "YEARLY", "PONTUAL"] as const;
const ADJUSTMENTS = ["NONE", "ANTECIPATE", "POSTPONE"] as const;

const TaskTemplateSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome da tarefa." }),
  departmentId: z.string().min(1, { error: "Selecione um departamento." }),
  periodicity: z.enum(PERIODICITIES),
  competenciaOffsetMonths: z.coerce.number().int(),
  metaDeadlineOffsetDays: z.coerce.number().int(),
  businessDayAdjustment: z.enum(ADJUSTMENTS),
  geraMulta: z.coerce.boolean(),
  active: z.coerce.boolean(),
});

// A UI apresenta a regra como "dia fixo do mês" ou "dia útil" (e, dentro de dia útil,
// "enésimo" ou "último") — mas o formato salvo no banco (RuleSchema) não muda.
function parseRuleFromFormData(formData: FormData) {
  const mode = formData.get("ruleMode");
  const monthOffset = formData.get("ruleMonthOffset") || 0;

  if (mode === "fixedDay") {
    return RuleSchema.parse({ type: "dayOfMonth", day: formData.get("ruleDay"), monthOffset });
  }
  if (mode === "businessDay") {
    if (formData.get("ruleCountMode") === "last") {
      return RuleSchema.parse({ type: "lastBusinessDay", monthOffset });
    }
    return RuleSchema.parse({ type: "nthBusinessDay", n: formData.get("ruleN"), monthOffset });
  }
  return RuleSchema.parse({ type: "unset" });
}

function parseTemplateFromFormData(formData: FormData) {
  return TaskTemplateSchema.parse({
    name: formData.get("name"),
    departmentId: formData.get("departmentId"),
    periodicity: formData.get("periodicity"),
    competenciaOffsetMonths: formData.get("competenciaOffsetMonths") || 0,
    metaDeadlineOffsetDays: formData.get("metaDeadlineOffsetDays") || 0,
    businessDayAdjustment: formData.get("businessDayAdjustment") || "POSTPONE",
    geraMulta: formData.get("geraMulta") === "on",
    active: formData.get("active") === "on",
  });
}

export type TaskTemplateFormState = { error: string } | undefined;

export async function createTaskTemplate(
  _prevState: TaskTemplateFormState,
  formData: FormData,
): Promise<TaskTemplateFormState> {
  await requireAdmin();

  try {
    const data = parseTemplateFromFormData(formData);
    const legalDeadlineRule = parseRuleFromFormData(formData);

    await prisma.taskTemplate.create({
      data: {
        name: data.name,
        departmentId: data.departmentId,
        periodicity: data.periodicity,
        legalDeadlineRule,
        competenciaOffsetMonths: data.competenciaOffsetMonths,
        metaDeadlineOffsetDays: data.metaDeadlineOffsetDays,
        businessDayAdjustment: data.businessDayAdjustment,
        geraMulta: data.geraMulta,
        active: data.active,
      },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar a tarefa." };
  }

  revalidatePath("/configuracoes/tarefas");
}

export async function updateTaskTemplate(
  templateId: string,
  _prevState: TaskTemplateFormState,
  formData: FormData,
): Promise<TaskTemplateFormState> {
  await requireAdmin();

  try {
    const data = parseTemplateFromFormData(formData);
    const legalDeadlineRule = parseRuleFromFormData(formData);

    await prisma.taskTemplate.update({
      where: { id: templateId },
      data: {
        name: data.name,
        departmentId: data.departmentId,
        periodicity: data.periodicity,
        legalDeadlineRule,
        competenciaOffsetMonths: data.competenciaOffsetMonths,
        metaDeadlineOffsetDays: data.metaDeadlineOffsetDays,
        businessDayAdjustment: data.businessDayAdjustment,
        geraMulta: data.geraMulta,
        active: data.active,
      },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar a tarefa." };
  }

  revalidatePath("/configuracoes/tarefas");
}

export async function toggleTaskTemplateActive(templateId: string, active: boolean) {
  await requireAdmin();
  await prisma.taskTemplate.update({ where: { id: templateId }, data: { active } });
  revalidatePath("/configuracoes/tarefas");
}

export async function setClientTaskTemplateLink(templateId: string, clientId: string, active: boolean) {
  await requireAdmin();

  await prisma.clientTaskTemplate.upsert({
    where: { clientId_taskTemplateId: { clientId, taskTemplateId: templateId } },
    create: { clientId, taskTemplateId: templateId, active },
    update: { active },
  });

  revalidatePath(`/configuracoes/tarefas/${templateId}`);
}
