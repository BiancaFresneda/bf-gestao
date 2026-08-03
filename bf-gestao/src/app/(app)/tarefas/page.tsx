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

  const [tasks, departments, users, clients, empresas] = await Promise.all([
    prisma.task.findMany({
      include: {
        client: { select: { id: true, name: true, personType: true, municipio: true, uf: true, empresaId: true } },
        responsibleUser: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        checklistItems: { orderBy: { order: "asc" } },
      },
      orderBy: { prazoLegal: "asc" },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.empresa.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const rows: TaskRow[] = tasks.map((task) => ({
    id: task.id,
    clientId: task.clientId,
    clientName: task.client.name,
    clientPersonType: task.client.personType,
    clientLocation: task.client.municipio && task.client.uf ? `${task.client.municipio}/${task.client.uf}` : null,
    empresaId: task.client.empresaId,
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
    checklist: task.checklistItems.map((item) => ({
      id: item.id,
      text: item.text,
      required: item.required,
      checked: item.checked,
    })),
  }));

  return (
    <TaskWorkspace
      tasks={rows}
      departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      users={users}
      clients={clients}
      empresas={empresas.map((e) => ({ id: e.id, name: e.name }))}
      initialDate={date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined}
    />
  );
}
