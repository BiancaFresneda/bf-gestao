import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { TaskTemplateForm } from "../task-template-form";
import { createTaskTemplate } from "../actions";

export default async function NovaTarefaPage() {
  await verifySession();

  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Nova tarefa</h1>
        <p className="mt-1 text-sm text-stone-500">
          Cria um novo template no catálogo de tarefas recorrentes.
        </p>
      </div>

      <section className="max-w-3xl rounded-xl border border-stone-200 bg-white p-6">
        <TaskTemplateForm departments={departments} action={createTaskTemplate} />
      </section>
    </div>
  );
}
