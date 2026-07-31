import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { TaskWorkspace, type TaskRow } from "./task-workspace";

export default async function TarefasPage() {
  await verifySession();

  const [tasks, departments, users, clients] = await Promise.all([
    prisma.task.findMany({
      include: {
        client: { select: { id: true, name: true, personType: true, municipio: true, uf: true } },
        responsibleUser: { select: { id: true, name: true } },
        taskTemplate: { include: { department: { select: { id: true, name: true } } } },
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
    departmentId: task.taskTemplate?.department.id ?? null,
    departmentName: task.taskTemplate?.department.name ?? null,
    prazoLegal: task.prazoLegal.toISOString(),
    prazoMeta: task.prazoMeta.toISOString(),
    status: task.status,
    responsibleUserId: task.responsibleUserId,
    responsibleUserName: task.responsibleUser?.name ?? null,
    notes: task.notes,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
  }));

  return (
    <TaskWorkspace
      tasks={rows}
      departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      users={users}
      clients={clients}
    />
  );
}
