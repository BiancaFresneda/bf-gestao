import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { TaskTable, type TaskRow } from "./task-table";
import { GenerateButton } from "./generate-button";

export default async function TarefasPage() {
  await verifySession();

  const tasks = await prisma.task.findMany({
    include: { client: { select: { id: true, name: true } }, responsibleUser: { select: { name: true } } },
    orderBy: { prazoLegal: "asc" },
  });

  const rows: TaskRow[] = tasks.map((task) => ({
    id: task.id,
    clientId: task.clientId,
    clientName: task.client.name,
    title: task.title,
    competenciaKey: task.competenciaKey,
    prazoLegal: task.prazoLegal.toISOString(),
    prazoMeta: task.prazoMeta.toISOString(),
    status: task.status,
    responsibleUserName: task.responsibleUser?.name ?? null,
  }));

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#24252A]">Tarefas</h1>
          <p className="mt-1 text-sm text-[#7D7874]">
            Tarefas geradas automaticamente a partir do cadastro de tarefas vinculado a cada cliente.
          </p>
        </div>
        <GenerateButton />
      </div>

      <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
        {rows.length === 0 ? (
          <p className="text-sm text-[#7D7874]">
            Nenhuma tarefa gerada ainda. Configure a regra de prazo legal e vincule os clientes em
            Configurações → Cadastro de Tarefas, depois clique em &quot;Gerar tarefas agora&quot;.
          </p>
        ) : (
          <TaskTable tasks={rows} />
        )}
      </section>
    </div>
  );
}
