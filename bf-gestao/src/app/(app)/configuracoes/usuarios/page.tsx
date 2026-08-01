import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ModuleHeader } from "@/components/module-header";
import { DepartmentForm } from "../department-form";
import { DepartmentRow } from "../department-row";
import { UserForm } from "../user-form";
import { UserRow } from "../user-row";

export default async function UsuariosPage() {
  const session = await verifySession();

  if (session.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#24252A]">Usuários</h1>
        <p className="mt-2 text-sm text-[#7D7874]">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  const [departments, users] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: { department: true },
    }),
  ]);

  const departmentOptions = departments.map((d) => ({ id: d.id, name: d.name }));

  return (
    <div>
      <ModuleHeader
        title="Usuários"
        subtitle="Gerencie a equipe, departamentos e os níveis de acesso."
        backHref="/configuracoes"
        backLabel="Voltar para Configurações"
      />

      <div className="space-y-10 p-8">
        <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#24252A]">Usuários</h2>
          <div className="mt-4">
            <UserForm departments={departmentOptions} />
          </div>

          <table className="mt-6 w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-[#7D7874]">
                <th className="py-2">Nome</th>
                <th className="py-2">E-mail</th>
                <th className="py-2">Departamento</th>
                <th className="py-2">Papel</th>
                <th className="py-2">Nascimento</th>
                <th className="py-2">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEAE0]">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  departments={departmentOptions}
                  user={{
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    active: user.active,
                    departmentId: user.departmentId,
                    departmentName: user.department?.name ?? null,
                    birthDate: user.birthDate ? user.birthDate.toISOString() : null,
                  }}
                />
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#24252A]">Departamentos</h2>
          <div className="mt-4 max-w-md">
            <DepartmentForm />
          </div>

          <ul className="mt-6 divide-y divide-[#EFEAE0]">
            {departments.map((department) => (
              <DepartmentRow key={department.id} department={department} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
