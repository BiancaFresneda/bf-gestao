"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteDepartment, updateDepartment } from "./actions";

type Department = { id: string; name: string };

export function DepartmentRow({ department }: { department: Department }) {
  const [editing, setEditing] = useState(false);
  const updateAction = updateDepartment.bind(null, department.id);
  const [state, action, pending] = useActionState(updateAction, undefined);

  useEffect(() => {
    if (state && !state.error) setEditing(false);
  }, [state]);

  if (editing) {
    return (
      <li className="py-2">
        <form action={action} className="flex items-center gap-2">
          <input
            name="name"
            defaultValue={department.name}
            required
            className="flex-1 rounded-lg border border-[#E1DBCC] px-3 py-1.5 text-sm outline-none focus:border-[#959D90]"
          />
          <button
            type="submit"
            disabled={pending}
            className="text-xs font-medium text-[#B4762A] hover:text-[#9C6423] disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-[#7D7874] hover:text-[#24252A]">
            Cancelar
          </button>
        </form>
        {state?.error && <p className="mt-1 text-xs text-[#B3453A]">{state.error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between py-2">
      <span className="text-sm text-[#24252A]">{department.name}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-[#7D7874] hover:text-[#24252A]">
          Editar
        </button>
        <form action={deleteDepartment.bind(null, department.id)}>
          <button type="submit" className="text-xs text-[#7D7874] hover:text-[#B3453A]">
            Remover
          </button>
        </form>
      </div>
    </li>
  );
}
