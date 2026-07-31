import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ModuleHeader } from "@/components/module-header";
import { DepartmentForm } from "../department-form";
import { UserForm } from "../user-form";
import { deleteDepartment, toggleUserActive } from "../actions";

export default async function ColaboradoresPage() {
  const session = await verifySession();

  if (session.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#24252A]">Colaboradores</h1>
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

  return (
    <div>
      <ModuleHeader
        title="Colaboradores"
        subtitle="Gerencie a equipe, departamentos e os níveis de acesso."
        backHref="/configuracoes"
        backLabel="Voltar para Configurações"
      />

      <div className="space-y-10 p-8">
        <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#24252A]">Departamentos</h2>
          <div className="mt-4 max-w-md">
            <DepartmentForm />
          </div>

          <ul className="mt-6 divide-y divide-[#EFEAE0]">
            {departments.map((department) => (
              <li key={department.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-[#24252A]">{department.name}</span>
                <form action={deleteDepartment.bind(null, department.id)}>
                  <button type="submit" className="text-xs text-[#7D7874] hover:text-[#B3453A]">
                    Remover
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#24252A]">Usuários</h2>
          <div className="mt-4">
            <UserForm departments={departments} />
          </div>

          <table className="mt-6 w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-[#7D7874]">
                <th className="py-2">Nome</th>
                <th className="py-2">E-mail</th>
                <th className="py-2">Departamento</th>
                <th className="py-2">Papel</th>
                <th className="py-2">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEAE0]">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-2 text-[#24252A]">{user.name}</td>
                  <td className="py-2 text-[#7D7874]">{user.email}</td>
                  <td className="py-2 text-[#7D7874]">{user.department?.name ?? "—"}</td>
                  <td className="py-2 text-[#7D7874]">{user.role === "ADMIN" ? "Admin" : "Colaborador"}</td>
                  <td className="py-2">
                    <span
                      className={
                        user.active
                          ? "rounded-full bg-[#E5EEE1] px-2 py-0.5 text-xs text-[#4C7A46]"
                          : "rounded-full bg-[#EFEAE0] px-2 py-0.5 text-xs text-[#7D7874]"
                      }
                    >
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <form action={toggleUserActive.bind(null, user.id, !user.active)}>
                      <button type="submit" className="text-xs text-[#7D7874] hover:text-[#24252A]">
                        {user.active ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
