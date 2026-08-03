"use server";

import * as z from "zod";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { generateTasks } from "@/lib/task-generation/generate";
import { competenciaAt } from "@/lib/task-generation/competencia";
import { saveUploadedFile } from "@/lib/file-storage";
import type { TaskStatus } from "@/generated/prisma/enums";

// monthsAhead deixa a Bianca planejar meses futuros sem esperar o calendário virar —
// o teto de geração normalmente é travado no mês atual real, isso empurra esse teto pra
// frente só nessa chamada manual. Cap em 12 pra não gerar anos de tarefas por engano.
export async function triggerTaskGeneration(monthsAhead: number = 0) {
  await verifySession();
  const clamped = Math.min(Math.max(Math.trunc(monthsAhead) || 0, 0), 12);
  const result = await generateTasks("MANUAL", clamped);
  revalidatePath("/tarefas");
  revalidatePath("/");
  return result;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const session = await verifySession();

  await prisma.$transaction(async (tx) => {
    const current = await tx.task.findUniqueOrThrow({
      where: { id: taskId },
      select: { status: true, notes: true, checklistItems: { select: { required: true, checked: true } } },
    });

    // Desconsiderar exige motivo registrado nas observações — sem isso, uma consulta
    // futura não tem como saber por que a tarefa foi desconsiderada.
    if (status === "DESCONSIDERADA" && !current.notes?.trim()) {
      throw new Error("Preencha as observações explicando o motivo antes de desconsiderar a tarefa.");
    }

    // Itens obrigatórios do checklist precisam estar marcados antes de fechar a tarefa —
    // itens opcionais só contam para a barra de progresso, não bloqueiam.
    if (status === "CONCLUIDA" && current.checklistItems.some((item) => item.required && !item.checked)) {
      throw new Error("Existem itens obrigatórios do checklist ainda não concluídos.");
    }

    await tx.task.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === "CONCLUIDA" ? new Date() : null,
        completedById: status === "CONCLUIDA" ? session.userId : null,
      },
    });

    await tx.taskHistory.create({
      data: {
        taskId,
        userId: session.userId,
        action: "STATUS_CHANGE",
        oldStatus: current.status,
        newStatus: status,
      },
    });
  });

  revalidatePath("/tarefas");
  revalidatePath("/");
}

export async function updateTaskResponsible(taskId: string, responsibleUserId: string | null) {
  await verifySession();
  await prisma.task.update({ where: { id: taskId }, data: { responsibleUserId } });
  revalidatePath("/tarefas");
  revalidatePath("/");
}

export async function updateTaskNotes(taskId: string, notes: string) {
  await verifySession();
  await prisma.task.update({ where: { id: taskId }, data: { notes: notes || null } });
  revalidatePath("/tarefas");
}

// Preencher a data de conclusão é, na prática, dizer "está concluída" — então o status
// acompanha automaticamente, com o mesmo rastro de auditoria de uma troca manual de status.
export async function updateTaskCompletedAt(taskId: string, completedAt: string | null) {
  const session = await verifySession();

  if (!completedAt) {
    await prisma.task.update({ where: { id: taskId }, data: { completedAt: null } });
    revalidatePath("/tarefas");
    revalidatePath("/");
    return;
  }

  const date = new Date(`${completedAt}T00:00:00Z`);

  await prisma.$transaction(async (tx) => {
    const current = await tx.task.findUniqueOrThrow({
      where: { id: taskId },
      select: { status: true, checklistItems: { select: { required: true, checked: true } } },
    });

    if (current.checklistItems.some((item) => item.required && !item.checked)) {
      throw new Error("Existem itens obrigatórios do checklist ainda não concluídos.");
    }

    await tx.task.update({
      where: { id: taskId },
      data: { completedAt: date, status: "CONCLUIDA", completedById: session.userId },
    });

    if (current.status !== "CONCLUIDA") {
      await tx.taskHistory.create({
        data: {
          taskId,
          userId: session.userId,
          action: "STATUS_CHANGE",
          oldStatus: current.status,
          newStatus: "CONCLUIDA",
        },
      });
    }
  });

  revalidatePath("/tarefas");
  revalidatePath("/");
}

export async function deleteTask(taskId: string) {
  await verifySession();

  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId }, select: { taskTemplateId: true } });
  if (task.taskTemplateId) {
    throw new Error("Tarefas recorrentes não podem ser excluídas — apenas tarefas pontuais.");
  }

  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/tarefas");
  revalidatePath("/");
}

const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
]);

const PontualTaskSchema = z.object({
  clientId: z.string().min(1, { error: "Selecione um cliente." }),
  title: z.string().trim().min(2, { error: "Informe o nome da tarefa." }),
  departmentId: z.string().min(1, { error: "Selecione um departamento." }),
  metaDate: z.string().min(1, { error: "Informe a data meta." }),
  competencia: z.string().regex(/^\d{4}-\d{2}$/, { error: "Informe a competência (mês/ano)." }),
  responsibleUserId: z.string().optional(),
  notes: z.string().optional(),
});

export type PontualTaskFormState = { error: string } | undefined;

// Tarefas pontuais (lembretes/ordens avulsas, sem template) usam a mesma noção de
// competência das recorrentes — aqui escolhida diretamente pelo usuário, não derivada
// de uma regra — mas a "data meta" é a única data que a tarefa tem (não existe prazo
// legal distinto), então prazoLegal e prazoMeta ficam sempre iguais.
export async function createPontualTask(
  _prevState: PontualTaskFormState,
  formData: FormData,
): Promise<PontualTaskFormState> {
  const session = await verifySession();

  const validated = PontualTaskSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    departmentId: formData.get("departmentId"),
    metaDate: formData.get("metaDate"),
    competencia: formData.get("competencia"),
    responsibleUserId: formData.get("responsibleUserId") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { clientId, title, departmentId, metaDate, competencia, responsibleUserId, notes } = validated.data;
  const date = new Date(`${metaDate}T00:00:00.000Z`);
  const periodo = competenciaAt("MONTHLY", new Date(`${competencia}-01T00:00:00.000Z`));

  let arquivoUrl: string | null = null;
  let arquivoNomeOriginal: string | null = null;
  const file = formData.get("arquivo");
  if (file instanceof File && file.size > 0) {
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(ext)) {
      return { error: "Tipo de arquivo não suportado. Envie PDF, imagem, planilha (Excel/CSV) ou TXT." };
    }
    const saved = await saveUploadedFile(file, `tarefas/${clientId}`);
    arquivoUrl = saved.storedPath;
    arquivoNomeOriginal = saved.originalName;
  }

  await prisma.task.create({
    data: {
      clientId,
      title,
      departmentId,
      competenciaKey: periodo.key,
      competenciaInicio: periodo.inicio,
      competenciaFim: periodo.fim,
      prazoLegal: date,
      prazoMeta: date,
      responsibleUserId: responsibleUserId || session.userId,
      notes: notes || null,
      arquivoUrl,
      arquivoNomeOriginal,
    },
  });

  revalidatePath("/tarefas");
  revalidatePath("/");
  redirect("/tarefas");
}

// Marcar o primeiro item do checklist avança a tarefa pra "Em andamento" automaticamente;
// desmarcar o último item volta pra "Pendente". Só mexe no status nesses dois sentidos —
// nunca sobrescreve Concluída ou Desconsiderada, que exigem ação explícita do usuário.
export async function toggleTaskChecklistItem(taskId: string, itemId: string, checked: boolean) {
  const session = await verifySession();

  await prisma.$transaction(async (tx) => {
    await tx.taskChecklistItem.update({
      where: { id: itemId },
      data: {
        checked,
        checkedAt: checked ? new Date() : null,
        checkedById: checked ? session.userId : null,
      },
    });

    const task = await tx.task.findUniqueOrThrow({
      where: { id: taskId },
      select: { status: true, checklistItems: { select: { checked: true } } },
    });

    const anyChecked = task.checklistItems.some((item) => item.checked);

    if (task.status === "PENDENTE" && anyChecked) {
      await tx.task.update({ where: { id: taskId }, data: { status: "EM_ANDAMENTO" } });
      await tx.taskHistory.create({
        data: { taskId, userId: session.userId, action: "STATUS_CHANGE", oldStatus: "PENDENTE", newStatus: "EM_ANDAMENTO" },
      });
    } else if (task.status === "EM_ANDAMENTO" && !anyChecked) {
      await tx.task.update({ where: { id: taskId }, data: { status: "PENDENTE" } });
      await tx.taskHistory.create({
        data: { taskId, userId: session.userId, action: "STATUS_CHANGE", oldStatus: "EM_ANDAMENTO", newStatus: "PENDENTE" },
      });
    }
  });

  revalidatePath("/tarefas");
  revalidatePath("/");
}

export async function updateTaskMetaDate(taskId: string, metaDate: string) {
  await verifySession();

  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId }, select: { taskTemplateId: true } });
  if (task.taskTemplateId) {
    throw new Error("Tarefas recorrentes não podem ter a data alterada — ela é definida pela regra do template.");
  }

  const date = new Date(`${metaDate}T00:00:00.000Z`);
  await prisma.task.update({ where: { id: taskId }, data: { prazoLegal: date, prazoMeta: date } });

  revalidatePath("/tarefas");
  revalidatePath("/");
}
