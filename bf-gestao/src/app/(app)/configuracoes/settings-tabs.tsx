import Link from "next/link";

const TABS = [
  { href: "/configuracoes", label: "Equipe" },
  { href: "/configuracoes/tarefas", label: "Cadastro de Tarefas" },
] as const;

export function SettingsTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-1 border-b border-stone-200">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={
            tab.href === active
              ? "border-b-2 border-stone-800 px-3 py-2 text-sm font-medium text-stone-900"
              : "border-b-2 border-transparent px-3 py-2 text-sm text-stone-500 hover:text-stone-800"
          }
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
