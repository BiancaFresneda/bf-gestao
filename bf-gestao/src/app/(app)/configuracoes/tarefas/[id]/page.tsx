import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { TaskTemplateForm } from "../task-template-form";
import { updateTaskTemplate } from "../actions";
import { ClientLinksSection } from "../client-links-section";

export default async function EditarTarefaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifySession();
  const { id } = await params;

  const [template, departments, clients] = await Promise.all([
    prisma.taskTemplate.findUnique({ where: { id } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.client.findMany({
      where: { status: "ATIVO" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, taskTemplateLinks: { where: { taskTemplateId: id }, select: { active: true } } },
    }),
  ]);

  if (!template) {
    notFound();
  }

  const clientOptions = clients.map((client) => ({
    id: client.id,
    name: client.name,
    linked: client.taskTemplateLinks[0]?.active ?? false,
  }));

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
        <h1 className="mt-2 text-2xl font-semibold text-stone-900">Editar tarefa</h1>
        <p className="mt-1 text-sm text-stone-500">{template.name}</p>
      </div>

      <section className="max-w-3xl rounded-xl border border-stone-200 bg-white p-6">
        <TaskTemplateForm
          departments={departments}
          template={template}
          action={updateTaskTemplate.bind(null, template.id)}
        />
      </section>

      <ClientLinksSection templateId={template.id} clients={clientOptions} />
    </div>
  );
}
