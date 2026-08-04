import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ModuleHeader } from "@/components/module-header";
import { TaskTemplateTable } from "./task-template-table";

export default async function CadastroDeTarefasPage() {
  const session = await verifySession();
  const isAdmin = session.role === "ADMIN";

  // Colaborador só enxerga o catálogo pra consulta — vê apenas as tarefas ativas, sem
  // criar/editar nada. Tarefas novas ou mudanças passam sempre pelo Admin.
  const templates = await prisma.taskTemplate.findMany({
    where: isAdmin ? {} : { active: true },
    include: { department: true },
    orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div>
      <ModuleHeader
        title="Tarefas Recorrentes"
        subtitle={
          isAdmin
            ? "Catálogo de templates de tarefas recorrentes. Templates importados do sistema anterior entram inativos até terem a regra de prazo legal revisada."
            : "Consulta às tarefas recorrentes ativas. Para criar ou alterar uma tarefa, peça a um administrador."
        }
        backHref="/configuracoes"
        backLabel="Voltar para Configurações"
        hideExtras
        actions={
          isAdmin ? (
            <Link
              href="/configuracoes/tarefas/novo"
              className="rounded-lg bg-[#B4762A] px-4 py-2 text-sm font-medium text-white hover:bg-[#9C6423]"
            >
              Nova tarefa
            </Link>
          ) : undefined
        }
      />

      <div className="p-8">
        <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
          <TaskTemplateTable templates={templates} canManage={isAdmin} />
        </section>
      </div>
    </div>
  );
}
