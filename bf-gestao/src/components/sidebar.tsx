import Link from "next/link";
import { logout } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/tarefas", label: "Tarefas" },
  { href: "/clientes", label: "Clientes" },
  { href: "/certificados", label: "Certificados" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/configuracoes", label: "Configurações" },
] as const;

type SidebarUser = {
  name: string;
  email: string;
  role: string;
};

export function Sidebar({ user }: { user: SidebarUser }) {
  return (
    <aside className="flex h-screen w-60 flex-col justify-between bg-stone-900 text-stone-100">
      <div>
        <div className="px-6 py-6">
          <p className="text-lg font-semibold">BF Gestão</p>
          <p className="text-xs text-stone-400">Gestão de Tarefas</p>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-stone-200 transition hover:bg-stone-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-stone-800 px-6 py-4">
        <p className="truncate text-sm text-stone-200">{user.email}</p>
        <p className="text-xs text-stone-400">{user.role === "ADMIN" ? "Admin" : "Colaborador"}</p>
        <form action={logout} className="mt-3">
          <button type="submit" className="text-xs text-stone-400 hover:text-stone-200">
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
