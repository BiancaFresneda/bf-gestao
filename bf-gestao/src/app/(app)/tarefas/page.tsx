import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { TaskWorkspace, type TaskRow } from "./task-workspace";

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await verifySession();
  const { date } = await searchParams;

  const [tasks, departments, users, clients] = await Promise.all([
    prisma.task.findMany({
      include: {
        client: { select: { id: true, name: true, personType: true, municipio: true, uf: true } },
        responsibleUser: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { prazoLegal: "asc" },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const rows: TaskRow[] = tasks.map((task) => ({
    id: task.id,
    clientId: task.clientId,
    clientName: task.client.name,
    clientPersonType: task.client.personType,
    clientLocation: task.client.municipio && task.client.uf ? `${task.client.municipio}/${task.client.uf}` : null,
    title: task.title,
    competenciaKey: task.competenciaKey,
    taskTemplateId: task.taskTemplateId,
    departmentId: task.department?.id ?? null,
    departmentName: task.department?.name ?? null,
    prazoLegal: task.prazoLegal.toISOString(),
    prazoMeta: task.prazoMeta.toISOString(),
    status: task.status,
    responsibleUserId: task.responsibleUserId,
    responsibleUserName: task.responsibleUser?.name ?? null,
    notes: task.notes,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    arquivoUrl: task.arquivoUrl,
    arquivoNomeOriginal: task.arquivoNomeOriginal,
  }));

  return (
    <TaskWorkspace
      tasks={rows}
      departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      users={users}
      clients={clients}
      initialDate={date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined}
    />
  );
}
