import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ModuleHeader } from "@/components/module-header";
import { TaskTemplateForm } from "../task-template-form";
import { createTaskTemplate } from "../actions";

export default async function NovaTarefaPage() {
  const session = await verifySession();

  if (session.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#24252A]">Nova tarefa</h1>
        <p className="mt-2 text-sm text-[#7D7874]">Apenas administradores podem criar tarefas recorrentes.</p>
      </div>
    );
  }

  const [departments, users] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <ModuleHeader
        title="Nova tarefa"
        subtitle="Cria um novo template no catálogo de tarefas recorrentes."
        backHref="/configuracoes/tarefas"
        backLabel="Voltar para Tarefas"
        hideExtras
      />

      <div className="p-8">
        <section className="max-w-3xl rounded-xl border border-[#E1DBCC] bg-white p-6">
          <TaskTemplateForm departments={departments} users={users} action={createTaskTemplate} />
        </section>
      </div>
    </div>
  );
}
