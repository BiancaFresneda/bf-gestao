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
        className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
      />
      <input
        name="email"
        type="email"
        placeholder="E-mail"
        required
        className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
      />
      <input
        name="password"
        type="password"
        placeholder="Senha provisória"
        required
        className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
      />
      <select
        name="departmentId"
        defaultValue=""
        className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
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
        className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
      >
        <option value="COLABORADOR">Colaborador</option>
        <option value="ADMIN">Admin</option>
      </select>

      <div className="sm:col-span-2">
        {state?.error && <p className="mb-2 text-xs text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-stone-800 px-3 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
        >
          {pending ? "Criando..." : "Criar usuário"}
        </button>
      </div>
    </form>
  );
}
