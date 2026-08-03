"use client";

import { useActionState, useEffect, useState } from "react";
import { toggleEmpresaActive, updateEmpresa } from "./actions";

export type EmpresaRowData = {
  id: string;
  name: string;
  tradeName: string | null;
  country: string;
  taxIdType: "CNPJ" | "EIN";
  taxId: string | null;
  inscricaoMunicipal: string | null;
  inscricaoEstadual: string | null;
  taxRegime: string | null;
  openingDate: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateProvince: string | null;
  postalCode: string | null;
  active: boolean;
};

const inputClass =
  "rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]";
const labelClass = "flex flex-col gap-1 text-xs text-[#7D7874]";

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function formatAddress(empresa: EmpresaRowData): string {
  const parts = [empresa.addressLine1, empresa.city, empresa.stateProvince].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export function EmpresaRow({ empresa }: { empresa: EmpresaRowData }) {
  const [editing, setEditing] = useState(false);
  const [country, setCountry] = useState(empresa.country);
  const updateAction = updateEmpresa.bind(null, empresa.id);
  const [state, action, pending] = useActionState(updateAction, undefined);

  useEffect(() => {
    if (state && !state.error) setEditing(false);
  }, [state]);

  if (editing) {
    const taxIdLabel = country === "US" ? "EIN" : "CNPJ";
    const stateLabel = country === "US" ? "Estado" : "UF";
    const postalLabel = country === "US" ? "ZIP code" : "CEP";

    return (
      <tr>
        <td colSpan={6} className="py-3">
          <form action={action} className="grid grid-cols-1 gap-3 rounded-lg bg-[#F7F5EF] p-4 sm:grid-cols-2 lg:grid-cols-3">
            <input name="name" defaultValue={empresa.name} placeholder="Razão social" required className={inputClass} />
            <input name="tradeName" defaultValue={empresa.tradeName ?? ""} placeholder="Nome fantasia" className={inputClass} />

            <select
              name="country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className={inputClass}
            >
              <option value="BR">Brasil</option>
              <option value="US">Estados Unidos</option>
            </select>

            <input type="hidden" name="taxIdType" value={country === "US" ? "EIN" : "CNPJ"} />
            <input name="taxId" defaultValue={empresa.taxId ?? ""} placeholder={taxIdLabel} className={inputClass} />

            <input name="taxRegime" defaultValue={empresa.taxRegime ?? ""} placeholder="Regime tributário" className={inputClass} />
            <label className={labelClass}>
              Data de abertura
              <input name="openingDate" type="date" defaultValue={toDateInputValue(empresa.openingDate)} className={inputClass} />
            </label>

            {country === "BR" && (
              <>
                <input
                  name="inscricaoMunicipal"
                  defaultValue={empresa.inscricaoMunicipal ?? ""}
                  placeholder="Inscrição municipal"
                  className={inputClass}
                />
                <input
                  name="inscricaoEstadual"
                  defaultValue={empresa.inscricaoEstadual ?? ""}
                  placeholder="Inscrição estadual"
                  className={inputClass}
                />
              </>
            )}

            <input
              name="addressLine1"
              defaultValue={empresa.addressLine1 ?? ""}
              placeholder="Endereço"
              className={`${inputClass} sm:col-span-2 lg:col-span-1`}
            />
            <input name="addressLine2" defaultValue={empresa.addressLine2 ?? ""} placeholder="Complemento" className={inputClass} />
            <input name="city" defaultValue={empresa.city ?? ""} placeholder="Cidade" className={inputClass} />
            <input name="stateProvince" defaultValue={empresa.stateProvince ?? ""} placeholder={stateLabel} className={inputClass} />
            <input name="postalCode" defaultValue={empresa.postalCode ?? ""} placeholder={postalLabel} className={inputClass} />

            <label className="flex items-center gap-2 text-sm text-[#24252A]">
              <input type="checkbox" name="active" defaultChecked={empresa.active} />
              Ativa
            </label>

            <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
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
      <td className="py-2 text-[#24252A]">
        {empresa.name}
        {empresa.tradeName && <span className="block text-xs text-[#7D7874]">{empresa.tradeName}</span>}
      </td>
      <td className="py-2 text-[#7D7874]">{empresa.country === "US" ? "Estados Unidos" : "Brasil"}</td>
      <td className="py-2 text-[#7D7874]">
        {empresa.taxId ? `${empresa.taxIdType}: ${empresa.taxId}` : "—"}
      </td>
      <td className="py-2 text-[#7D7874]">{formatAddress(empresa)}</td>
      <td className="py-2">
        <span
          className={
            empresa.active
              ? "rounded-full bg-[#E5EEE1] px-2 py-0.5 text-xs text-[#4C7A46]"
              : "rounded-full bg-[#EFEAE0] px-2 py-0.5 text-xs text-[#7D7874]"
          }
        >
          {empresa.active ? "Ativa" : "Inativa"}
        </span>
      </td>
      <td className="py-2 text-right">
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-xs text-[#7D7874] hover:text-[#24252A]">
            Editar
          </button>
          <form action={toggleEmpresaActive.bind(null, empresa.id, !empresa.active)}>
            <button type="submit" className="text-xs text-[#7D7874] hover:text-[#24252A]">
              {empresa.active ? "Desativar" : "Ativar"}
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
