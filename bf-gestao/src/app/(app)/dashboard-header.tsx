"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ModuleHeader } from "@/components/module-header";

type EmpresaOption = { id: string; name: string };

// Dashboard é Server Component (sem estado próprio) — o filtro de empresa vira parâmetro
// de URL, igual ao "month" do calendário, pra manter a página inteira renderizada no
// servidor. Só esse cabeçalho precisa de JS pra disparar a navegação.
export function DashboardHeader({ empresas, currentEmpresaId }: { empresas: EmpresaOption[]; currentEmpresaId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleEmpresaChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("empresa");
    } else {
      params.set("empresa", value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <ModuleHeader
      title="Dashboard"
      subtitle="Visão geral das obrigações do mês e alertas importantes."
      empresaFilter={{ value: currentEmpresaId, onChange: handleEmpresaChange, options: empresas }}
    />
  );
}
