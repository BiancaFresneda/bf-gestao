import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { TaskTemplateForm } from "../task-template-form";
import { createTaskTemplate } from "../actions";

export default async function NovaTarefaPage() {
  await verifySession();

  const [departments, users] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6 p-8">
      <div>
        <Link
          href="/configuracoes/tarefas"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Voltar para Tarefas
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900">Nova tarefa</h1>
        <p className="mt-1 text-sm text-stone-500">
          Cria um novo template no catálogo de tarefas recorrentes.
        </p>
      </div>

      <section className="max-w-3xl rounded-xl border border-stone-200 bg-white p-6">
        <TaskTemplateForm departments={departments} users={users} action={createTaskTemplate} />
      </section>
    </div>
  );
}
