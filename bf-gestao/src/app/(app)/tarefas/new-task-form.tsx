"use client";

import { useActionState } from "react";
import { createPontualTask } from "./actions";

type ClientOption = { id: string; name: string };
type UserOption = { id: string; name: string };
type Department = { id: string; name: string };

export function NewTaskForm({
  clients,
  users,
  departments,
}: {
  clients: ClientOption[];
  users: UserOption[];
  departments: Department[];
}) {
  const [state, action, pending] = useActionState(createPontualTask, undefined);

  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm text-[#7D7874] sm:col-span-2">
        Nome da tarefa
        <input
          name="title"
          placeholder="Ex.: Ligar para o cliente sobre pendência de documentos"
          required
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-[#7D7874]">
        Departamento
        <select
          name="departmentId"
          defaultValue=""
          required
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]"
        >
          <option value="" disabled>
            Selecione um departamento
          </option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-[#7D7874]">
        Responsável
        <select
          name="responsibleUserId"
          defaultValue=""
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]"
        >
          <option value="">Eu mesmo</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-[#7D7874]">
        Data meta
        <input
          name="metaDate"
          type="date"
          required
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-[#7D7874]">
        Competência
        <input
          name="competencia"
          type="month"
          required
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-[#7D7874]">
        Cliente
        <select
          name="clientId"
          defaultValue=""
          required
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]"
        >
          <option value="" disabled>
            Selecione um cliente
          </option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-[#7D7874] sm:col-span-2">
        Observação
        <textarea
          name="notes"
          rows={4}
          placeholder="Detalhes adicionais (opcional)"
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-[#7D7874] sm:col-span-2">
        Anexo
        <input
          name="arquivo"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.xls,.xlsx,.csv,.txt"
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm text-[#24252A] outline-none file:mr-3 file:rounded-md file:border-0 file:bg-[#EFEAE0] file:px-2 file:py-1 file:text-xs file:text-[#7D7874] focus:border-[#959D90]"
        />
        <span className="text-xs text-[#B3AFA2]">PDF, imagem, planilha (Excel/CSV) ou TXT.</span>
      </label>

      <div className="sm:col-span-2">
        {state?.error && <p className="mb-2 text-sm text-[#B3453A]">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#B4762A] px-4 py-2 text-sm font-medium text-white hover:bg-[#9C6423] disabled:opacity-60"
        >
          {pending ? "Criando..." : "Criar tarefa"}
        </button>
      </div>
    </form>
  );
}
