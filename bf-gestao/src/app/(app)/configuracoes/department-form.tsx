"use client";

import { useActionState } from "react";
import { createDepartment } from "./actions";

export function DepartmentForm() {
  const [state, action, pending] = useActionState(createDepartment, undefined);

  return (
    <form action={action} className="flex items-start gap-2">
      <div className="flex-1">
        <input
          name="name"
          placeholder="Nome do departamento"
          required
          className="w-full rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
        />
        {state?.error && <p className="mt-1 text-xs text-[#B3453A]">{state.error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#B4762A] px-3 py-2 text-sm font-medium text-white hover:bg-[#9C6423] disabled:opacity-60"
      >
        {pending ? "Adicionando..." : "Adicionar"}
      </button>
    </form>
  );
}
