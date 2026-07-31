"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type ClientOption = { id: string; name: string };

type ClientFilter = {
  value: string;
  onChange: (value: string) => void;
  options: ClientOption[];
};

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

// Cabeçalho padrão de todos os módulos: título/subtítulo à esquerda, filtros de
// filial/cliente e sino à direita. "Filiais" ainda não existe como conceito no sistema
// (fica sempre inerte); "clientes" só é funcional quando a tela faz sentido por cliente.
export function ModuleHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Voltar",
  actions,
  clientFilter,
}: {
  title: string;
  subtitle: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  clientFilter?: ClientFilter;
}) {
  return (
    <div className="border-b border-[#E1DBCC] px-8 py-5">
      {backHref && (
        <Link
          href={backHref}
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-[#7D7874] hover:text-[#24252A]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {backLabel}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#24252A]">{title}</h1>
          <p className="mt-1 text-sm text-[#7D7874]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <select
            disabled
            title="Filiais ainda não existem como conceito neste sistema."
            className="cursor-not-allowed rounded-lg border border-[#E1DBCC] bg-white px-3 py-2 text-sm text-[#B3AFA2] opacity-70 outline-none"
          >
            <option>Todas as filiais</option>
          </select>
          {clientFilter ? (
            <select
              value={clientFilter.value}
              onChange={(e) => clientFilter.onChange(e.target.value)}
              className="rounded-lg border border-[#E1DBCC] bg-white px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]"
            >
              <option value="all">Todos os clientes</option>
              {clientFilter.options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <select
              disabled
              title="Essa tela não é organizada por cliente."
              className="cursor-not-allowed rounded-lg border border-[#E1DBCC] bg-white px-3 py-2 text-sm text-[#B3AFA2] opacity-70 outline-none"
            >
              <option>Todos os clientes</option>
            </select>
          )}
          <button
            type="button"
            title="Notificações — regras a definir."
            className="rounded-lg border border-[#E1DBCC] bg-white p-2.5 text-[#7D7874]"
          >
            <BellIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
