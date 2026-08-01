"use client";

import { useActionState } from "react";
import { createUser } from "./actions";

type Department = { id: string; name: string };

export function UserForm({ departments }: { departments: Department[] }) {
  const [state, action, pending] = useActionState(createUser, undefined);

  return (
    <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input
        name="name"
        placeholder="Nome completo"
        required
        className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
      />
      <input
        name="email"
        type="email"
        placeholder="E-mail"
        required
        className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
      />
      <input
        name="password"
        type="password"
        placeholder="Senha provisória"
        required
        className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
      />
      <select
        name="departmentId"
        defaultValue=""
        className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
      >
        <option value="">Sem departamento</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.name}
          </option>
        ))}
      </select>
      <select
        name="role"
        defaultValue="COLABORADOR"
        className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
      >
        <option value="COLABORADOR">Colaborador</option>
        <option value="ADMIN">Admin</option>
      </select>
      <label className="flex flex-col gap-1 text-xs text-[#7D7874]">
        Data de nascimento
        <input
          name="birthDate"
          type="date"
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]"
        />
      </label>

      <div className="sm:col-span-2">
        {state?.error && <p className="mb-2 text-xs text-[#B3453A]">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#B4762A] px-3 py-2 text-sm font-medium text-white hover:bg-[#9C6423] disabled:opacity-60"
        >
          {pending ? "Criando..." : "Criar usuário"}
        </button>
      </div>
    </form>
  );
}
