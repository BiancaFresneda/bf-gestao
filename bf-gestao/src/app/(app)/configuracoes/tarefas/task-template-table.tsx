"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { describeRule } from "./rule";
import { toggleTaskTemplateActive } from "./actions";

const PERIODICITY_LABEL: Record<string, string> = {
  MONTHLY: "Mensal",
  WEEKLY: "Semanal",
  QUARTERLY: "Trimestral",
  SEMESTER: "Semestral",
  YEARLY: "Anual",
  PONTUAL: "Pontual",
};

type TemplateRow = {
  id: string;
  name: string;
  department: { name: string };
  periodicity: string;
  legalDeadlineRule: unknown;
  metaDeadlineOffsetDays: number;
  geraMulta: boolean;
  active: boolean;
};

export function TaskTemplateTable({ templates }: { templates: TemplateRow[] }) {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const departments = useMemo(
    () => Array.from(new Set(templates.map((t) => t.department.name))).sort(),
    [templates],
  );

  const filtered = templates.filter((template) => {
    if (search && !template.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (departmentFilter && template.department.name !== departmentFilter) return false;
    if (statusFilter === "active" && !template.active) return false;
    if (statusFilter === "inactive" && template.active) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome..."
          className="w-56 rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
        />
        <select
          value={departmentFilter}
          onChange={(event) => setDepartmentFilter(event.target.value)}
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
        >
          <option value="">Todos os departamentos</option>
          {departments.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
        >
          <option value="all">Todas</option>
          <option value="active">Ativas</option>
          <option value="inactive">Inativas</option>
        </select>
        <span className="self-center text-xs text-[#7D7874]">
          {filtered.length} de {templates.length} tarefas
        </span>
      </div>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-[#7D7874]">
            <th className="py-2">Nome</th>
            <th className="py-2">Departamento</th>
            <th className="py-2">Periodicidade</th>
            <th className="py-2">Prazo legal</th>
            <th className="py-2">Meta</th>
            <th className="py-2">Multa</th>
            <th className="py-2">Status</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EFEAE0]">
          {filtered.map((template) => (
            <tr key={template.id}>
              <td className="py-2 text-[#24252A]">
                <Link href={`/configuracoes/tarefas/${template.id}`} className="hover:underline">
                  {template.name}
                </Link>
              </td>
              <td className="py-2 text-[#7D7874]">{template.department.name}</td>
              <td className="py-2 text-[#7D7874]">
                {PERIODICITY_LABEL[template.periodicity] ?? template.periodicity}
              </td>
              <td className="py-2 text-[#7D7874]">{describeRule(template.legalDeadlineRule)}</td>
              <td className="py-2 text-[#7D7874]">{template.metaDeadlineOffsetDays}d</td>
              <td className="py-2 text-[#7D7874]">{template.geraMulta ? "Sim" : "—"}</td>
              <td className="py-2">
                <span
                  className={
                    template.active
                      ? "rounded-full bg-[#E5EEE1] px-2 py-0.5 text-xs text-[#4C7A46]"
                      : "rounded-full bg-[#EFEAE0] px-2 py-0.5 text-xs text-[#7D7874]"
                  }
                >
                  {template.active ? "Ativa" : "Inativa"}
                </span>
              </td>
              <td className="py-2 text-right">
                <button
                  onClick={() => toggleTaskTemplateActive(template.id, !template.active)}
                  className="text-xs text-[#7D7874] hover:text-[#24252A]"
                >
                  {template.active ? "Desativar" : "Ativar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
