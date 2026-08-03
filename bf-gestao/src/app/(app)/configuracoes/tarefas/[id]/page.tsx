import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ModuleHeader } from "@/components/module-header";
import { TaskTemplateForm } from "../task-template-form";
import { updateTaskTemplate } from "../actions";
import { ClientLinksSection } from "../client-links-section";
import { ChecklistSection } from "../checklist-section";

export default async function EditarTarefaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifySession();
  const { id } = await params;

  const [template, departments, users, clients] = await Promise.all([
    prisma.taskTemplate.findUnique({
      where: { id },
      include: { checklistItems: { orderBy: { order: "asc" } } },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
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
    <div>
      <ModuleHeader
        title="Editar tarefa"
        subtitle={template.name}
        backHref="/configuracoes/tarefas"
        backLabel="Voltar para Tarefas"
        hideExtras
      />

      <div className="space-y-6 p-8">
        <section className="max-w-3xl rounded-xl border border-[#E1DBCC] bg-white p-6">
          <TaskTemplateForm
            departments={departments}
            users={users}
            template={template}
            action={updateTaskTemplate.bind(null, template.id)}
          />
        </section>

        <ChecklistSection
          templateId={template.id}
          items={template.checklistItems.map((item) => ({ id: item.id, text: item.text, required: item.required }))}
        />

        <ClientLinksSection templateId={template.id} clients={clientOptions} />
      </div>
    </div>
  );
}
