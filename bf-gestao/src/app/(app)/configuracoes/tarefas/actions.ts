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
  defaultResponsibleId: z.string().optional().or(z.literal("")),
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
    defaultResponsibleId: formData.get("defaultResponsibleId") || undefined,
    geraMulta: formData.get("geraMulta") === "on",
    active: formData.get("active") === "on",
  });
}

export type TaskTemplateFormState = { error: string; notice?: never } | { notice: string; error?: never } | undefined;

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
        defaultResponsibleId: data.defaultResponsibleId || null,
        geraMulta: data.geraMulta,
        active: data.active,
      },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar a tarefa." };
  }

  revalidatePath("/configuracoes/tarefas");
  return { notice: "Tarefa criada." };
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

    const defaultResponsibleId = data.defaultResponsibleId || null;

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
        defaultResponsibleId,
        geraMulta: data.geraMulta,
        active: data.active,
      },
    });

    // Aplica o responsável padrão também às tarefas já geradas por este template —
    // não só às futuras — para não deixar tarefa antiga sem responsável depois de
    // definir/trocar o responsável do cadastro.
    await prisma.task.updateMany({
      where: { taskTemplateId: templateId },
      data: { responsibleUserId: defaultResponsibleId },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar a tarefa." };
  }

  revalidatePath("/configuracoes/tarefas");
  revalidatePath("/tarefas");
  return { notice: "Alterações salvas." };
}

export async function toggleTaskTemplateActive(templateId: string, active: boolean) {
  await requireAdmin();
  await prisma.taskTemplate.update({ where: { id: templateId }, data: { active } });
  revalidatePath("/configuracoes/tarefas");
}

// Substitui a lista inteira do checklist do template a cada salvamento — mais simples
// que casar item a item, e seguro porque essa lista nunca é lida diretamente pelas
// tarefas já geradas (elas têm sua própria cópia em TaskChecklistItem).
export async function saveTaskTemplateChecklist(
  templateId: string,
  items: { text: string; required: boolean }[],
) {
  await requireAdmin();

  const cleaned = items.map((item) => ({ text: item.text.trim(), required: item.required })).filter((item) => item.text.length > 0);

  await prisma.$transaction([
    prisma.taskTemplateChecklistItem.deleteMany({ where: { taskTemplateId: templateId } }),
    ...(cleaned.length > 0
      ? [
          prisma.taskTemplateChecklistItem.createMany({
            data: cleaned.map((item, index) => ({
              taskTemplateId: templateId,
              text: item.text,
              required: item.required,
              order: index,
            })),
          }),
        ]
      : []),
  ]);

  revalidatePath(`/configuracoes/tarefas/${templateId}`);
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
