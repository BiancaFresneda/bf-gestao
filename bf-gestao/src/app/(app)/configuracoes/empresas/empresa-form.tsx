"use client";

import { useActionState, useState } from "react";
import { createEmpresa } from "./actions";

const inputClass =
  "rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]";
const labelClass = "flex flex-col gap-1 text-xs text-[#7D7874]";

export function EmpresaForm() {
  const [state, action, pending] = useActionState(createEmpresa, undefined);
  const [country, setCountry] = useState("BR");

  const taxIdLabel = country === "US" ? "EIN" : "CNPJ";
  const stateLabel = country === "US" ? "Estado" : "UF";
  const postalLabel = country === "US" ? "ZIP code" : "CEP";

  return (
    <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <input name="name" placeholder="Razão social" required className={inputClass} />
      <input name="tradeName" placeholder="Nome fantasia" className={inputClass} />

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
      <input name="taxId" placeholder={taxIdLabel} className={inputClass} />

      <input name="taxRegime" placeholder="Regime tributário" className={inputClass} />
      <label className={labelClass}>
        Data de abertura
        <input name="openingDate" type="date" className={inputClass} />
      </label>

      {country === "BR" && (
        <>
          <input name="inscricaoMunicipal" placeholder="Inscrição municipal" className={inputClass} />
          <input name="inscricaoEstadual" placeholder="Inscrição estadual" className={inputClass} />
        </>
      )}

      <input name="addressLine1" placeholder="Endereço" className={`${inputClass} sm:col-span-2 lg:col-span-1`} />
      <input name="addressLine2" placeholder="Complemento" className={inputClass} />
      <input name="city" placeholder="Cidade" className={inputClass} />
      <input name="stateProvince" placeholder={stateLabel} className={inputClass} />
      <input name="postalCode" placeholder={postalLabel} className={inputClass} />

      <label className="flex items-center gap-2 text-sm text-[#24252A]">
        <input type="checkbox" name="active" defaultChecked />
        Ativa
      </label>

      <div className="sm:col-span-2 lg:col-span-3">
        {state?.error && <p className="mb-2 text-xs text-[#B3453A]">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#B4762A] px-3 py-2 text-sm font-medium text-white hover:bg-[#9C6423] disabled:opacity-60"
        >
          {pending ? "Criando..." : "Criar empresa"}
        </button>
      </div>
    </form>
  );
}
