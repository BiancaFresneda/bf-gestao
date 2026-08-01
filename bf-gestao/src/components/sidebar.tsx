import Link from "next/link";
import { logout } from "@/app/login/actions";
import { BrandMark } from "@/components/brand-mark";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/tarefas",
    label: "Tarefas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
      </svg>
    ),
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6" />
        <path d="M16 8.5c1.4.3 2.5 1.5 2.5 3.2 0 1.4-.7 2.4-1.7 3M17 14.4c2 .4 3.5 1.9 3.5 4.6" />
      </svg>
    ),
  },
  {
    href: "/certificados",
    label: "Certificados",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M12 3l7 3.2v5.4c0 4.6-3 7.7-7 9.2-4-1.5-7-4.6-7-9.2V6.2L12 3z" />
        <path d="M9 12l2 2 4-4.2" />
      </svg>
    ),
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M4 19V5M9 19v-7M14 19V9M19 19V4" />
      </svg>
    ),
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
] as const;

type SidebarUser = {
  name: string;
  email: string;
  role: string;
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function Sidebar({ user }: { user: SidebarUser }) {
  return (
    <aside className="flex h-screen w-60 flex-col justify-between bg-[#2E2F2C] px-3.5 py-5 text-[#F1EFE9]">
      <div>
        <div className="flex items-center gap-2.5 px-2 pb-4">
          <BrandMark className="h-9 w-9 flex-shrink-0 text-[#959D90]" />
          <div>
            <p className="text-[15px] font-bold leading-tight">BF Gestão</p>
            <p className="text-[10px] uppercase tracking-wide text-[#A6A299]">Gestão de Tarefas</p>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 border-t border-[#45463F] pt-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[#A6A299] transition hover:bg-[#3A3B37] hover:text-[#F1EFE9]"
            >
              <span className="h-4 w-4 flex-shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/tarefas/nova"
          className="relative mt-3 flex items-center justify-center rounded-lg bg-[#B4762A] py-2 text-sm font-semibold text-[#F5E7D3] transition hover:brightness-105"
        >
          <span className="absolute left-3.5 h-4 w-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          Nova Tarefa
        </Link>
      </div>

      <div className="border-t border-[#45463F] pt-3">
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#3A3B37] text-[10.5px] font-bold text-[#F1EFE9]">
            {initialsOf(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[#F1EFE9]">{user.email}</p>
            <p className="text-[10.5px] text-[#A6A299]">
              {user.role === "ADMIN" ? "Admin" : "Colaborador"}
            </p>
          </div>
        </div>
        <form action={logout} className="mt-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-1 py-1 text-xs text-[#A6A299] hover:text-[#F1EFE9]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
              <path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" />
            </svg>
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
