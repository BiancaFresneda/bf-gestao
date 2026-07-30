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
        <h1 className="text-2xl font-semibold text-stone-900">Editar tarefa</h1>
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
