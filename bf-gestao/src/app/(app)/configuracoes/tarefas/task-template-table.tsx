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
          className="w-56 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
        />
        <select
          value={departmentFilter}
          onChange={(event) => setDepartmentFilter(event.target.value)}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
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
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
        >
          <option value="all">Ativas e inativas</option>
          <option value="active">Só ativas</option>
          <option value="inactive">Só inativas</option>
        </select>
        <span className="self-center text-xs text-stone-400">
          {filtered.length} de {templates.length} tarefas
        </span>
      </div>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-stone-400">
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
        <tbody className="divide-y divide-stone-100">
          {filtered.map((template) => (
            <tr key={template.id}>
              <td className="py-2 text-stone-800">
                <Link href={`/configuracoes/tarefas/${template.id}`} className="hover:underline">
                  {template.name}
                </Link>
              </td>
              <td className="py-2 text-stone-500">{template.department.name}</td>
              <td className="py-2 text-stone-500">
                {PERIODICITY_LABEL[template.periodicity] ?? template.periodicity}
              </td>
              <td className="py-2 text-stone-500">{describeRule(template.legalDeadlineRule)}</td>
              <td className="py-2 text-stone-500">{template.metaDeadlineOffsetDays}d</td>
              <td className="py-2 text-stone-500">{template.geraMulta ? "Sim" : "—"}</td>
              <td className="py-2">
                <span
                  className={
                    template.active
                      ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                      : "rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500"
                  }
                >
                  {template.active ? "Ativa" : "Inativa"}
                </span>
              </td>
              <td className="py-2 text-right">
                <button
                  onClick={() => toggleTaskTemplateActive(template.id, !template.active)}
                  className="text-xs text-stone-400 hover:text-stone-700"
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
