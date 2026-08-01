"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { formatCompetenciaKey, formatDateBR } from "@/lib/format";
import { ModuleHeader } from "@/components/module-header";
import { GenerateButton } from "./generate-button";
import {
  deleteTask,
  updateTaskCompletedAt,
  updateTaskMetaDate,
  updateTaskNotes,
  updateTaskResponsible,
  updateTaskStatus,
} from "./actions";

export type TaskStatusValue = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "ATRASADA" | "DESCONSIDERADA";

export type TaskRow = {
  id: string;
  clientId: string;
  clientName: string;
  clientPersonType: string;
  clientLocation: string | null;
  title: string;
  competenciaKey: string;
  // null = tarefa pontual (avulsa, sem template) — permite editar a data e excluir.
  // Presente = tarefa recorrente gerada por template — data e exclusão ficam bloqueadas.
  taskTemplateId: string | null;
  departmentId: string | null;
  departmentName: string | null;
  prazoLegal: string;
  prazoMeta: string;
  status: TaskStatusValue;
  responsibleUserId: string | null;
  responsibleUserName: string | null;
  notes: string | null;
  completedAt: string | null;
  arquivoUrl: string | null;
  arquivoNomeOriginal: string | null;
};

type Department = { id: string; name: string };
type UserOption = { id: string; name: string };
type ClientOption = { id: string; name: string };

const STATUS_LABEL: Record<TaskStatusValue, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  ATRASADA: "Atrasada",
  DESCONSIDERADA: "Desconsiderada",
};

const STATUS_CLASS: Record<TaskStatusValue, string> = {
  PENDENTE: "bg-[#EFEAE0] text-[#7D7874]",
  EM_ANDAMENTO: "bg-[#FBEFD9] text-[#B4762A]",
  CONCLUIDA: "bg-[#E5EEE1] text-[#4C7A46]",
  ATRASADA: "bg-[#F6DFDB] text-[#B3453A]",
  DESCONSIDERADA: "bg-[#EFEAE0] text-[#7D7874]",
};

const DEPARTMENT_CLASS: Record<string, string> = {
  Fiscal: "bg-[#FBEFD9] text-[#B4762A]",
  Pessoal: "bg-[#E3E7F0] text-[#3D4E8C]",
  Contábil: "bg-[#E5EEE1] text-[#4C7A46]",
  Societário: "bg-[#F1E3EE] text-[#8A4A82]",
  Financeiro: "bg-[#DDEEF2] text-[#2E7C93]",
};

const EDITABLE_STATUSES: TaskStatusValue[] = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "DESCONSIDERADA"];

function displayStatus(task: TaskRow): TaskStatusValue {
  if ((task.status === "PENDENTE" || task.status === "EM_ANDAMENTO") && new Date(task.prazoLegal).getTime() < Date.now()) {
    return "ATRASADA";
  }
  return task.status;
}

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c0-3.6 2.9-6.5 7-6.5s7 2.9 7 6.5" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5 flex-shrink-0">
      <path d="M8 12.5V7a4 4 0 0 1 8 0v8.5a2.5 2.5 0 0 1-5 0V8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
    </svg>
  );
}

function StatusBadge({ status }: { status: TaskStatusValue }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function TaskWorkspace({
  tasks,
  departments,
  users,
  clients,
  initialDate,
}: {
  tasks: TaskRow[];
  departments: Department[];
  users: UserOption[];
  clients: ClientOption[];
  initialDate?: string;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatusValue>("all");
  const [dateFrom, setDateFrom] = useState(initialDate ?? "");
  const [dateTo, setDateTo] = useState(initialDate ?? "");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [responsibleFilter, setResponsibleFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(tasks[0]?.id ?? null);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== "all" && displayStatus(task) !== statusFilter) return false;
      if (dateFrom && dateKey(task.prazoLegal) < dateFrom) return false;
      if (dateTo && dateKey(task.prazoLegal) > dateTo) return false;
      if (departmentFilter !== "all" && task.departmentId !== departmentFilter) return false;
      if (responsibleFilter !== "all") {
        if (responsibleFilter === "none" && task.responsibleUserId) return false;
        if (responsibleFilter !== "none" && task.responsibleUserId !== responsibleFilter) return false;
      }
      if (clientFilter !== "all" && task.clientId !== clientFilter) return false;
      if (search) {
        const term = search.toLowerCase();
        if (!task.clientName.toLowerCase().includes(term) && !task.title.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, dateFrom, dateTo, departmentFilter, responsibleFilter, clientFilter, search]);

  const selectedTask = filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? null;

  const hasActiveFilters =
    statusFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    departmentFilter !== "all" ||
    responsibleFilter !== "all" ||
    clientFilter !== "all" ||
    search !== "";

  function handleClearFilters() {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setDepartmentFilter("all");
    setResponsibleFilter("all");
    setClientFilter("all");
    setSearch("");
  }

  return (
    <div className="flex h-screen flex-col">
      <ModuleHeader
        title="Tarefas"
        subtitle="Gestão de obrigações e ordens de serviço."
        actions={<GenerateButton />}
        clientFilter={{ value: clientFilter, onChange: setClientFilter, options: clients }}
      />

      <div className="flex flex-wrap items-end gap-3 border-b border-[#E1DBCC] px-8 py-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#7D7874]">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | TaskStatusValue)}
            className="rounded-lg border border-[#E1DBCC] bg-white px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]"
          >
            <option value="all">Todas as tarefas</option>
            {(Object.keys(STATUS_LABEL) as TaskStatusValue[]).map((value) => (
              <option key={value} value={value}>
                {STATUS_LABEL[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#7D7874]">Data inicial</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-[#E1DBCC] bg-white px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#7D7874]">Data final</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-[#E1DBCC] bg-white px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#7D7874]">Departamento</label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border border-[#E1DBCC] bg-white px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]"
          >
            <option value="all">Todos os departamentos</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#7D7874]">Responsável</label>
          <select
            value={responsibleFilter}
            onChange={(e) => setResponsibleFilter(e.target.value)}
            className="rounded-lg border border-[#E1DBCC] bg-white px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]"
          >
            <option value="all">Todos os responsáveis</option>
            <option value="none">Sem responsável</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
          className="rounded-lg border border-[#E1DBCC] bg-white px-3 py-2 text-sm text-[#7D7874] hover:bg-[#F7F5EF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Limpar filtros
        </button>
      </div>

      <div className="flex items-center gap-3 px-8 py-3">
        <div className="relative w-80">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AFA2]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" />
            </svg>
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou tarefa"
            className="w-full rounded-lg border border-[#E1DBCC] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#959D90]"
          />
        </div>
        <span className="text-sm text-[#7D7874]">{filtered.length} tarefa(s)</span>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden px-8 pb-8">
        <div className="w-96 flex-shrink-0 overflow-y-auto rounded-xl border border-[#E1DBCC] bg-white">
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-[#7D7874]">Nenhuma tarefa encontrada.</p>
          ) : (
            <ul className="divide-y divide-[#EFEAE0]">
              {filtered.map((task) => {
                const status = displayStatus(task);
                const isSelected = task.id === selectedId;
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(task.id)}
                      className={`block w-full px-4 py-3 text-left transition ${
                        isSelected ? "bg-[#F1EFE9]" : "hover:bg-[#F7F5EF]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-[#24252A]">{task.title}</p>
                        <StatusBadge status={status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[#7D7874]">{task.clientName}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#7D7874]">
                        <span className="flex items-center gap-1">
                          <CalendarIcon />
                          {formatDateBR(task.prazoLegal)}
                        </span>
                        {task.departmentName && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] ${
                              DEPARTMENT_CLASS[task.departmentName] ?? "bg-[#EFEAE0] text-[#7D7874]"
                            }`}
                          >
                            {task.departmentName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <PersonIcon />
                          {task.responsibleUserName ?? "Sem responsável"}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-[#E1DBCC] bg-white p-6">
          {selectedTask ? (
            <TaskDetailPanel key={selectedTask.id} task={selectedTask} users={users} />
          ) : (
            <p className="text-sm text-[#7D7874]">Selecione uma tarefa na lista para ver os detalhes.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskDetailPanel({ task, users }: { task: TaskRow; users: UserOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(task.notes ?? "");
  const [selectedStatus, setSelectedStatus] = useState<TaskStatusValue>(task.status);
  const [statusError, setStatusError] = useState<string | null>(null);
  const status = displayStatus(task);
  const isPontual = task.taskTemplateId === null;

  useEffect(() => {
    setSelectedStatus(task.status);
  }, [task.status]);

  function handleStatusChange(value: TaskStatusValue) {
    setSelectedStatus(value);

    // Desconsiderar uma tarefa exige registrar o motivo — sem isso, consultas futuras
    // não têm como saber por que ela foi desconsiderada.
    if (value === "DESCONSIDERADA" && !notes.trim()) {
      setStatusError("Preencha as observações explicando o motivo antes de desconsiderar a tarefa.");
      return;
    }

    setStatusError(null);
    startTransition(async () => {
      try {
        if (notes !== (task.notes ?? "")) {
          await updateTaskNotes(task.id, notes);
        }
        await updateTaskStatus(task.id, value);
      } catch (error) {
        setStatusError(error instanceof Error ? error.message : "Não foi possível atualizar o status.");
        setSelectedStatus(task.status);
      }
    });
  }

  function handleResponsibleChange(value: string) {
    startTransition(() => updateTaskResponsible(task.id, value || null));
  }

  function handleCompletedAtChange(value: string) {
    startTransition(() => updateTaskCompletedAt(task.id, value || null));
  }

  function handleMetaDateChange(value: string) {
    if (!value) return;
    startTransition(() => updateTaskMetaDate(task.id, value));
  }

  function handleNotesBlur() {
    if (notes === (task.notes ?? "")) return;
    startTransition(() => updateTaskNotes(task.id, notes));
  }

  function handleDelete() {
    if (!window.confirm(`Excluir a tarefa "${task.title}" de ${task.clientName}? Essa ação não pode ser desfeita.`)) {
      return;
    }
    startTransition(() => deleteTask(task.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#24252A]">{task.title}</h2>
          <p className="mt-1 text-sm text-[#7D7874]">{task.clientName}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          {isPontual && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-[#E1DBCC] px-3 py-1.5 text-sm text-[#B3453A] hover:bg-[#F6DFDB] disabled:opacity-60"
            >
              <TrashIcon />
              Excluir
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[#E1DBCC] p-3">
          <p className="text-xs uppercase text-[#7D7874]">Competência</p>
          <p className="mt-1 text-sm text-[#24252A]">{formatCompetenciaKey(task.competenciaKey)}</p>
        </div>
        <div className="rounded-lg border border-[#E1DBCC] p-3">
          <p className="text-xs uppercase text-[#7D7874]">Departamento</p>
          <p className="mt-1 text-sm text-[#24252A]">{task.departmentName ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-[#E1DBCC] p-3">
          <p className="text-xs uppercase text-[#7D7874]">Prazo legal</p>
          <p className="mt-1 text-sm text-[#24252A]">{formatDateBR(task.prazoLegal)}</p>
        </div>
        <div className="rounded-lg border border-[#E1DBCC] p-3">
          <p className="text-xs uppercase text-[#7D7874]">Prazo meta</p>
          {isPontual ? (
            <input
              type="date"
              defaultValue={dateKey(task.prazoMeta)}
              disabled={isPending}
              onChange={(e) => handleMetaDateChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E1DBCC] bg-white px-2 py-1 text-sm text-[#24252A] outline-none focus:border-[#959D90] disabled:opacity-60"
            />
          ) : (
            <p className="mt-1 text-sm text-[#24252A]">{formatDateBR(task.prazoMeta)}</p>
          )}
        </div>
        <div className="rounded-lg border border-[#E1DBCC] p-3">
          <p className="text-xs uppercase text-[#7D7874]">Cliente</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-[#24252A]">
            <Link href={`/clientes/${task.clientId}`} className="hover:underline">
              {task.clientName}
            </Link>
            <span className="rounded-full bg-[#EFEAE0] px-1.5 py-0.5 text-[10px] text-[#7D7874]">
              {task.clientPersonType}
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-[#E1DBCC] p-3">
          <p className="text-xs uppercase text-[#7D7874]">Localidade</p>
          <p className="mt-1 text-sm text-[#24252A]">{task.clientLocation ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-[#E1DBCC] p-3">
          <p className="text-xs uppercase text-[#7D7874]">Anexo</p>
          {task.arquivoUrl ? (
            <a
              href={`/api/tarefas/${task.id}/anexo`}
              className="mt-1 flex items-center gap-1.5 text-sm text-[#B4762A] hover:underline"
            >
              <PaperclipIcon />
              {task.arquivoNomeOriginal ?? "Baixar arquivo"}
            </a>
          ) : (
            <p className="mt-1 text-sm text-[#24252A]">—</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#7D7874]">Status</label>
          <select
            value={selectedStatus}
            disabled={isPending}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatusValue)}
            className="rounded-lg border border-[#E1DBCC] bg-white px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90] disabled:opacity-60"
          >
            {EDITABLE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABEL[value]}
              </option>
            ))}
          </select>
          {statusError && <p className="text-xs text-[#B3453A]">{statusError}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#7D7874]">Responsável</label>
          <select
            defaultValue={task.responsibleUserId ?? ""}
            disabled={isPending}
            onChange={(e) => handleResponsibleChange(e.target.value)}
            className="rounded-lg border border-[#E1DBCC] bg-white px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90] disabled:opacity-60"
          >
            <option value="">Sem responsável</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-[#7D7874]">Data de conclusão</label>
        <input
          type="date"
          defaultValue={task.completedAt ? task.completedAt.slice(0, 10) : ""}
          disabled={isPending}
          onChange={(e) => handleCompletedAtChange(e.target.value)}
          className="w-56 rounded-lg border border-[#E1DBCC] bg-white px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90] disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-[#7D7874]">Observações</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          disabled={isPending}
          rows={4}
          placeholder="Anotações internas sobre essa tarefa..."
          className="rounded-lg border border-[#E1DBCC] bg-white px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90] disabled:opacity-60"
        />
      </div>
    </div>
  );
}
