"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { generateTasks } from "@/lib/task-generation/generate";
import type { TaskStatus } from "@/generated/prisma/enums";

export async function triggerTaskGeneration() {
  await verifySession();
  const result = await generateTasks("MANUAL");
  revalidatePath("/tarefas");
  revalidatePath("/");
  return result;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const session = await verifySession();

  await prisma.$transaction(async (tx) => {
    const current = await tx.task.findUniqueOrThrow({ where: { id: taskId }, select: { status: true } });

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
