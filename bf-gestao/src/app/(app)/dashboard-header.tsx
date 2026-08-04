"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ModuleHeader } from "@/components/module-header";

type EmpresaOption = { id: string; name: string };

// Não são clientes de verdade — é o slot "clientFilter" do ModuleHeader reaproveitado
// pra filtrar por tipo de pessoa (o Dashboard é uma visão agregada, não faz sentido
// filtrar por um cliente específico aqui).
const PERSON_TYPE_OPTIONS = [
  { id: "PJ", name: "Pessoa Jurídica" },
  { id: "PF", name: "Pessoa Física" },
];

// Dashboard é Server Component (sem estado próprio) — os filtros viram parâmetro de URL,
// igual ao "month" do calendário, pra manter a página inteira renderizada no servidor.
// Só esse cabeçalho precisa de JS pra disparar a navegação.
export function DashboardHeader({
  empresas,
  currentEmpresaId,
  currentPersonType,
}: {
  empresas: EmpresaOption[];
  currentEmpresaId: string;
  currentPersonType: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <ModuleHeader
      title="Dashboard"
      subtitle="Visão geral das obrigações do mês e alertas importantes."
      empresaFilter={{ value: currentEmpresaId, onChange: (v) => updateParam("empresa", v), options: empresas }}
      clientFilter={{ value: currentPersonType, onChange: (v) => updateParam("tipo", v), options: PERSON_TYPE_OPTIONS }}
    />
  );
}
