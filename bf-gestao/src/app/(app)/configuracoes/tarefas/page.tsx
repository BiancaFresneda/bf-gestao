import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ModuleHeader } from "@/components/module-header";
import { TaskTemplateTable } from "./task-template-table";

export default async function CadastroDeTarefasPage() {
  const session = await verifySession();

  if (session.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#24252A]">Tarefas Recorrentes</h1>
        <p className="mt-2 text-sm text-[#7D7874]">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  const templates = await prisma.taskTemplate.findMany({
    include: { department: true },
    orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div>
      <ModuleHeader
        title="Tarefas Recorrentes"
        subtitle="Catálogo de templates de tarefas recorrentes. Templates importados do sistema anterior entram inativos até terem a regra de prazo legal revisada."
        backHref="/configuracoes"
        backLabel="Voltar para Configurações"
        hideExtras
        actions={
          <Link
            href="/configuracoes/tarefas/novo"
            className="rounded-lg bg-[#B4762A] px-4 py-2 text-sm font-medium text-white hover:bg-[#9C6423]"
          >
            Nova tarefa
          </Link>
        }
      />

      <div className="p-8">
        <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
          <TaskTemplateTable templates={templates} />
        </section>
      </div>
    </div>
  );
}
