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

const TaskTemplateSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome da tarefa." }),
  departmentId: z.string().min(1, { error: "Selecione um departamento." }),
  periodicity: z.enum(PERIODICITIES),
  competenciaOffsetMonths: z.coerce.number().int(),
  metaDeadlineOffsetDays: z.coerce.number().int(),
  geraMulta: z.coerce.boolean(),
  active: z.coerce.boolean(),
});

// O dia do "Data legal" sempre cai no mês oposto ao deslocamento da competência: se a
// tarefa é gerada em julho apontando pra competência de junho (offset -1), o vencimento
// cai em julho (+1 em relação à competência) — por isso o monthOffset nunca é digitado
// à parte, é sempre o inverso do deslocamento de competência.
function parseRuleFromFormData(formData: FormData, competenciaOffsetMonths: number) {
  const day = formData.get("ruleDay");
  if (!day) {
    return RuleSchema.parse({ type: "unset" });
  }
  return RuleSchema.parse({ type: "dayOfMonth", day, monthOffset: -competenciaOffsetMonths });
}

function parseTemplateFromFormData(formData: FormData) {
  return TaskTemplateSchema.parse({
    name: formData.get("name"),
    departmentId: formData.get("departmentId"),
    periodicity: formData.get("periodicity"),
    competenciaOffsetMonths: formData.get("competenciaOffsetMonths") || 0,
    metaDeadlineOffsetDays: formData.get("metaDeadlineOffsetDays") || 0,
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
    const legalDeadlineRule = parseRuleFromFormData(formData, data.competenciaOffsetMonths);
    const businessDayAdjustment = formData.get("postergar") === "on" ? "POSTPONE" : "NONE";

    await prisma.taskTemplate.create({
      data: {
        name: data.name,
        departmentId: data.departmentId,
        periodicity: data.periodicity,
        legalDeadlineRule,
        competenciaOffsetMonths: data.competenciaOffsetMonths,
        metaDeadlineOffsetDays: data.metaDeadlineOffsetDays,
        businessDayAdjustment,
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
    const legalDeadlineRule = parseRuleFromFormData(formData, data.competenciaOffsetMonths);
    const businessDayAdjustment = formData.get("postergar") === "on" ? "POSTPONE" : "NONE";

    await prisma.taskTemplate.update({
      where: { id: templateId },
      data: {
        name: data.name,
        departmentId: data.departmentId,
        periodicity: data.periodicity,
        legalDeadlineRule,
        competenciaOffsetMonths: data.competenciaOffsetMonths,
        metaDeadlineOffsetDays: data.metaDeadlineOffsetDays,
        businessDayAdjustment,
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

export async function saveClientTaskTemplateLinks(templateId: string, clientIds: string[]) {
  await requireAdmin();

  const selected = new Set(clientIds);
  const existing = await prisma.clientTaskTemplate.findMany({ where: { taskTemplateId: templateId } });
  const existingByClient = new Map(existing.map((link) => [link.clientId, link]));

  await prisma.$transaction([
    ...Array.from(selected)
      .filter((clientId) => !existingByClient.get(clientId)?.active)
      .map((clientId) =>
        prisma.clientTaskTemplate.upsert({
          where: { clientId_taskTemplateId: { clientId, taskTemplateId: templateId } },
          create: { clientId, taskTemplateId: templateId, active: true },
          update: { active: true },
        }),
      ),
    ...existing
      .filter((link) => link.active && !selected.has(link.clientId))
      .map((link) => prisma.clientTaskTemplate.update({ where: { id: link.id }, data: { active: false } })),
  ]);

  revalidatePath(`/configuracoes/tarefas/${templateId}`);
}
