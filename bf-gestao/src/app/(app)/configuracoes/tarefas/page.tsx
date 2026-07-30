import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { SettingsTabs } from "../settings-tabs";
import { TaskTemplateTable } from "./task-template-table";

export default async function CadastroDeTarefasPage() {
  const session = await verifySession();

  if (session.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-stone-900">Cadastro de Tarefas</h1>
        <p className="mt-2 text-sm text-stone-500">
          Apenas administradores podem acessar esta página.
        </p>
      </div>
    );
  }

  const templates = await prisma.taskTemplate.findMany({
    include: { department: true },
    orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Configurações</h1>
        <p className="mt-1 text-sm text-stone-500">
          Gerencie os departamentos e usuários da equipe.
        </p>
      </div>

      <SettingsTabs active="/configuracoes/tarefas" />

      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-stone-900">Cadastro de Tarefas</h2>
            <p className="mt-1 text-sm text-stone-500">
              Catálogo de templates de tarefas recorrentes. Templates importados do sistema
              anterior entram inativos até terem a regra de prazo legal revisada.
            </p>
          </div>
          <Link
            href="/configuracoes/tarefas/novo"
            className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Nova tarefa
          </Link>
        </div>

        <div className="mt-6">
          <TaskTemplateTable templates={templates} />
        </div>
      </section>
    </div>
  );
}
