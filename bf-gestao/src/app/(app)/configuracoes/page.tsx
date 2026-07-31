import Link from "next/link";
import type { ReactNode } from "react";
import { verifySession } from "@/lib/dal";
import { ModuleHeader } from "@/components/module-header";

function ChecklistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
    </svg>
  );
}

function ModulesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M4.5 7.5 12 12l7.5-4.5M12 12v9" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6" />
      <path d="M16 8.5c1.4.3 2.5 1.5 2.5 3.2 0 1.4-.7 2.4-1.7 3M17 14.4c2 .4 3.5 1.9 3.5 4.6" />
    </svg>
  );
}

const CARDS = [
  {
    href: "/configuracoes/tarefas",
    icon: <ChecklistIcon />,
    title: "Tarefas Recorrentes",
    description: "Cadastre e configure as tarefas recorrentes que serão geradas automaticamente para os clientes.",
  },
  {
    href: "/configuracoes/modulos",
    icon: <ModulesIcon />,
    title: "Módulos",
    description: "Defina os módulos/serviços oferecidos pelo escritório (Fiscal, Contábil, BPO, etc.) usados no cadastro do cliente.",
  },
  {
    href: "/configuracoes/colaboradores",
    icon: <TeamIcon />,
    title: "Colaboradores",
    description: "Gerencie a equipe e os níveis de acesso (admin, gestor, colaborador). Novos cadastros entram automaticamente.",
  },
] as const;

function ModuleCard({ href, icon, title, description }: { href: string; icon: ReactNode; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-xl border border-[#E1DBCC] bg-white p-5 transition hover:border-[#959D90] hover:shadow-sm"
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#EFEAE0] text-[#7D7874]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-[#24252A]">{title}</h2>
        <p className="mt-1 text-sm text-[#7D7874]">{description}</p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="mt-1 h-4 w-4 flex-shrink-0 text-[#B3AFA2]">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}

export default async function ConfiguracoesPage() {
  const session = await verifySession();

  if (session.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#24252A]">Configurações</h1>
        <p className="mt-2 text-sm text-[#7D7874]">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div>
      <ModuleHeader title="Configurações" subtitle="Templates, módulos, colaboradores e ajustes do sistema." />

      <div className="grid grid-cols-1 gap-4 p-8 sm:grid-cols-2">
        {CARDS.map((card) => (
          <ModuleCard key={card.href} {...card} />
        ))}
      </div>
    </div>
  );
}
