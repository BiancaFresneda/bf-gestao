"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ColumnFilterHeader } from "@/components/column-filter-header";
import { formatDateBR } from "@/lib/format";
import { updateTaskStatus } from "./actions";

export type TaskRow = {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  competenciaKey: string;
  prazoLegal: string;
  prazoMeta: string;
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "ATRASADA" | "CANCELADA";
  responsibleUserName: string | null;
};

const STATUS_LABEL: Record<TaskRow["status"], string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  ATRASADA: "Atrasada",
  CANCELADA: "Cancelada",
};

const STATUS_CLASS: Record<TaskRow["status"], string> = {
  PENDENTE: "bg-[#EFEAE0] text-[#7D7874]",
  EM_ANDAMENTO: "bg-[#FBEFD9] text-[#B4762A]",
  CONCLUIDA: "bg-[#E5EEE1] text-[#4C7A46]",
  ATRASADA: "bg-[#F6DFDB] text-[#B3453A]",
  CANCELADA: "bg-[#EFEAE0] text-[#7D7874]",
};

const EDITABLE_STATUSES: TaskRow["status"][] = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"];

const COLUMNS = ["cliente", "tarefa", "competencia", "status", "responsavel"] as const;
type Column = (typeof COLUMNS)[number];

function displayStatus(task: TaskRow): TaskRow["status"] {
  if ((task.status === "PENDENTE" || task.status === "EM_ANDAMENTO") && new Date(task.prazoLegal).getTime() < Date.now()) {
    return "ATRASADA";
  }
  return task.status;
}

function columnValue(task: TaskRow, column: Column): string {
  switch (column) {
    case "cliente":
      return task.clientName;
    case "tarefa":
      return task.title;
    case "competencia":
      return task.competenciaKey;
    case "status":
      return STATUS_LABEL[displayStatus(task)];
    case "responsavel":
      return task.responsibleUserName ?? "Sem responsável";
  }
}

export function TaskTable({ tasks }: { tasks: TaskRow[] }) {
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<Column, Set<string>>>({
    cliente: new Set(),
    tarefa: new Set(),
    competencia: new Set(),
    status: new Set(),
    responsavel: new Set(),
  });
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const columnOptions = useMemo(() => {
    const options: Record<Column, string[]> = { cliente: [], tarefa: [], competencia: [], status: [], responsavel: [] };
    for (const column of COLUMNS) {
      options[column] = Array.from(new Set(tasks.map((t) => columnValue(t, column)))).sort();
    }
    return options;
  }, [tasks]);

  const filtered = tasks.filter((task) => {
    if (search && !task.clientName.toLowerCase().includes(search.toLowerCase()) && !task.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    for (const column of COLUMNS) {
      const selected = columnFilters[column];
      if (selected.size > 0 && !selected.has(columnValue(task, column))) return false;
    }
    return true;
  });

  function updateColumnFilter(column: Column, next: Set<string>) {
    setColumnFilters((prev) => ({ ...prev, [column]: next }));
  }

  function handleStatusChange(taskId: string, status: TaskRow["status"]) {
    setPendingId(taskId);
    startTransition(async () => {
      await updateTaskStatus(taskId, status);
      setPendingId(null);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por cliente ou tarefa..."
          className="w-64 rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
        />
        <span className="text-xs text-[#7D7874]">
          {filtered.length} de {tasks.length} tarefas
        </span>
      </div>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-[#7D7874]">
            <ColumnFilterHeader label="Cliente" options={columnOptions.cliente} selected={columnFilters.cliente} onChange={(next) => updateColumnFilter("cliente", next)} />
            <ColumnFilterHeader label="Tarefa" options={columnOptions.tarefa} selected={columnFilters.tarefa} onChange={(next) => updateColumnFilter("tarefa", next)} />
            <ColumnFilterHeader label="Competência" options={columnOptions.competencia} selected={columnFilters.competencia} onChange={(next) => updateColumnFilter("competencia", next)} />
            <th className="py-2">Prazo legal</th>
            <th className="py-2">Prazo meta</th>
            <ColumnFilterHeader label="Status" options={columnOptions.status} selected={columnFilters.status} onChange={(next) => updateColumnFilter("status", next)} />
            <ColumnFilterHeader label="Responsável" options={columnOptions.responsavel} selected={columnFilters.responsavel} onChange={(next) => updateColumnFilter("responsavel", next)} />
            <th className="py-2 pr-4 font-medium">Alterar status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EFEAE0]">
          {filtered.map((task) => {
            const status = displayStatus(task);
            return (
              <tr key={task.id}>
                <td className="py-2 text-[#24252A]">
                  <Link href={`/clientes/${task.clientId}`} className="hover:underline">
                    {task.clientName}
                  </Link>
                </td>
                <td className="py-2 text-[#7D7874]">{task.title}</td>
                <td className="py-2 text-[#7D7874]">{task.competenciaKey}</td>
                <td className="py-2 text-[#7D7874]">{formatDateBR(task.prazoLegal)}</td>
                <td className="py-2 text-[#7D7874]">{formatDateBR(task.prazoMeta)}</td>
                <td className="py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
                </td>
                <td className="py-2 text-[#7D7874]">{task.responsibleUserName ?? "—"}</td>
                <td className="py-2">
                  <select
                    value={task.status}
                    disabled={isPending && pendingId === task.id}
                    onChange={(event) => handleStatusChange(task.id, event.target.value as TaskRow["status"])}
                    className="rounded-md border border-[#E1DBCC] bg-white px-2 py-1 text-xs text-[#24252A] outline-none focus:border-[#959D90]"
                  >
                    {EDITABLE_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {STATUS_LABEL[value]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={8} className="py-6 text-center text-sm text-[#7D7874]">
                Nenhuma tarefa encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
