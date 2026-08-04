"use client";

import { useActionState, useState } from "react";
import { createClient } from "../actions";

type EmpresaOption = { id: string; name: string };

const inputClass =
  "mt-1 w-full rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]";
const labelClass = "block text-xs font-medium text-[#7D7874]";

const DOCUMENT_SPEC: Record<string, Record<string, { label: string; placeholder: string }>> = {
  BR: {
    PJ: { label: "CNPJ", placeholder: "00.000.000/0000-00" },
    PF: { label: "CPF", placeholder: "000.000.000-00" },
  },
  US: {
    PJ: { label: "EIN", placeholder: "00-0000000" },
    PF: { label: "SSN", placeholder: "000-00-0000" },
  },
};

export function NewClientForm({ empresas }: { empresas: EmpresaOption[] }) {
  const [state, action, pending] = useActionState(createClient, undefined);
  const [country, setCountry] = useState<"BR" | "US">("BR");
  const [personType, setPersonType] = useState<"PJ" | "PF">("PJ");

  const document = DOCUMENT_SPEC[country][personType];
  const postalLabel = country === "US" ? "ZIP code" : "CEP";
  const stateLabel = country === "US" ? "Estado (sigla)" : "UF";
  const statePlaceholder = country === "US" ? "OH" : "GO";
  const cityLabel = country === "US" ? "Cidade" : "Município";

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>País</label>
          <select
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value as "BR" | "US")}
            className={inputClass}
          >
            <option value="BR">Brasil</option>
            <option value="US">Estados Unidos</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Tipo de pessoa</label>
          <select
            name="personType"
            value={personType}
            onChange={(e) => setPersonType(e.target.value as "PJ" | "PF")}
            className={inputClass}
          >
            <option value="PJ">Pessoa Jurídica</option>
            <option value="PF">Pessoa Física</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>{document.label}</label>
          <input name="document" placeholder={document.placeholder} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{personType === "PJ" ? "Razão social" : "Nome completo"}</label>
          <input name="name" required className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Unidade</label>
          <select name="empresaId" defaultValue="" className={inputClass}>
            <option value="">Sem unidade definida</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#7D7874]">Endereço</h3>
        <p className="mt-1 text-xs text-[#7D7874]">
          Usado para localizar o cliente no mapa do Dashboard.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass}>{postalLabel}</label>
            <input name="cep" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Endereço</label>
            <input name="logradouro" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Número</label>
            <input name="numero" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Complemento</label>
            <input name="complemento" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Bairro</label>
            <input name="bairro" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{cityLabel}</label>
            <input name="municipio" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{stateLabel}</label>
            <input name="uf" placeholder={statePlaceholder} maxLength={2} className={inputClass} />
          </div>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#3D3E40] px-4 py-2 text-sm font-medium text-white hover:bg-[#2E2F2C] disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar cliente"}
      </button>
    </form>
  );
}
