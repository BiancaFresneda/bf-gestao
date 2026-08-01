"use client";

import { useActionState, useEffect, useState } from "react";
import { formatDateBR } from "@/lib/format";
import { toggleUserActive, updateUser } from "./actions";

export type UserRowData = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "COLABORADOR";
  active: boolean;
  departmentId: string | null;
  departmentName: string | null;
  birthDate: string | null;
};

type Department = { id: string; name: string };

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export function UserRow({ user, departments }: { user: UserRowData; departments: Department[] }) {
  const [editing, setEditing] = useState(false);
  const updateAction = updateUser.bind(null, user.id);
  const [state, action, pending] = useActionState(updateAction, undefined);

  useEffect(() => {
    if (state && !state.error) setEditing(false);
  }, [state]);

  if (editing) {
    return (
      <tr>
        <td colSpan={7} className="py-3">
          <form action={action} className="grid grid-cols-1 gap-3 rounded-lg bg-[#F7F5EF] p-4 sm:grid-cols-2">
            <input
              name="name"
              defaultValue={user.name}
              placeholder="Nome completo"
              required
              className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
            />
            <input
              name="email"
              type="email"
              defaultValue={user.email}
              placeholder="E-mail"
              required
              className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
            />
            <select
              name="departmentId"
              defaultValue={user.departmentId ?? ""}
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
              defaultValue={user.role}
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
                defaultValue={toDateInputValue(user.birthDate)}
                className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]"
              />
            </label>
            <input
              name="password"
              type="password"
              placeholder="Nova senha (opcional)"
              className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
            />

            <div className="flex items-center gap-3 sm:col-span-2">
              {state?.error && <p className="text-xs text-[#B3453A]">{state.error}</p>}
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-[#B4762A] px-3 py-2 text-sm font-medium text-white hover:bg-[#9C6423] disabled:opacity-60"
              >
                {pending ? "Salvando..." : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg px-3 py-2 text-sm text-[#7D7874] hover:text-[#24252A]"
              >
                Cancelar
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="py-2 text-[#24252A]">{user.name}</td>
      <td className="py-2 text-[#7D7874]">{user.email}</td>
      <td className="py-2 text-[#7D7874]">{user.departmentName ?? "—"}</td>
      <td className="py-2 text-[#7D7874]">{user.role === "ADMIN" ? "Admin" : "Colaborador"}</td>
      <td className="py-2 text-[#7D7874]">{user.birthDate ? formatDateBR(user.birthDate) : "—"}</td>
      <td className="py-2">
        <span
          className={
            user.active
              ? "rounded-full bg-[#E5EEE1] px-2 py-0.5 text-xs text-[#4C7A46]"
              : "rounded-full bg-[#EFEAE0] px-2 py-0.5 text-xs text-[#7D7874]"
          }
        >
          {user.active ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td className="py-2 text-right">
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-xs text-[#7D7874] hover:text-[#24252A]">
            Editar
          </button>
          <form action={toggleUserActive.bind(null, user.id, !user.active)}>
            <button type="submit" className="text-xs text-[#7D7874] hover:text-[#24252A]">
              {user.active ? "Desativar" : "Ativar"}
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
