import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ModuleHeader } from "@/components/module-header";
import { NewTaskForm } from "../new-task-form";

export default async function NovaTarefaPontualPage() {
  await verifySession();

  const [clients, users, departments] = await Promise.all([
    prisma.client.findMany({ where: { status: "ATIVO" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <ModuleHeader
        title="Nova tarefa"
        subtitle="Cria uma tarefa pontual (lembrete/ordem avulsa) — não é uma obrigação recorrente."
        backHref="/tarefas"
        backLabel="Voltar para Tarefas"
      />

      <div className="p-8">
        <section className="max-w-2xl rounded-xl border border-[#E1DBCC] bg-white p-6">
          <NewTaskForm clients={clients} users={users} departments={departments.map((d) => ({ id: d.id, name: d.name }))} />
        </section>
      </div>
    </div>
  );
}
