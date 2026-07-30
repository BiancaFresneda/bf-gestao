import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { DepartmentForm } from "./department-form";
import { UserForm } from "./user-form";
import { deleteDepartment, toggleUserActive } from "./actions";

export default async function ConfiguracoesPage() {
  const session = await verifySession();

  if (session.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-stone-900">Configurações</h1>
        <p className="mt-2 text-sm text-stone-500">
          Apenas administradores podem acessar esta página.
        </p>
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
    <div className="space-y-10 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Configurações</h1>
        <p className="mt-1 text-sm text-stone-500">
          Gerencie os departamentos e usuários da equipe.
        </p>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-medium text-stone-900">Departamentos</h2>
        <div className="mt-4 max-w-md">
          <DepartmentForm />
        </div>

        <ul className="mt-6 divide-y divide-stone-100">
          {departments.map((department) => (
            <li key={department.id} className="flex items-center justify-between py-2">
              <span className="text-sm text-stone-700">{department.name}</span>
              <form action={deleteDepartment.bind(null, department.id)}>
                <button type="submit" className="text-xs text-stone-400 hover:text-red-600">
                  Remover
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-medium text-stone-900">Usuários</h2>
        <div className="mt-4">
          <UserForm departments={departments} />
        </div>

        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-stone-400">
              <th className="py-2">Nome</th>
              <th className="py-2">E-mail</th>
              <th className="py-2">Departamento</th>
              <th className="py-2">Papel</th>
              <th className="py-2">Status</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="py-2 text-stone-800">{user.name}</td>
                <td className="py-2 text-stone-500">{user.email}</td>
                <td className="py-2 text-stone-500">{user.department?.name ?? "—"}</td>
                <td className="py-2 text-stone-500">
                  {user.role === "ADMIN" ? "Admin" : "Colaborador"}
                </td>
                <td className="py-2">
                  <span
                    className={
                      user.active
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                        : "rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500"
                    }
                  >
                    {user.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <form action={toggleUserActive.bind(null, user.id, !user.active)}>
                    <button type="submit" className="text-xs text-stone-400 hover:text-stone-700">
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
  );
}
