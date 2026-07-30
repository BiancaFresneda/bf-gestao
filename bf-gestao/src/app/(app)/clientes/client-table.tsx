"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDocument } from "@/lib/format";

type ClientRow = {
  id: string;
  name: string;
  personType: string;
  cnpj: string | null;
  cpf: string | null;
  tipoAtividade: string | null;
  taxRegime: string | null;
  municipio: string | null;
  uf: string | null;
  status: string;
};

export function ClientTable({ clients }: { clients: ClientRow[] }) {
  const [search, setSearch] = useState("");
  const [ufFilter, setUfFilter] = useState("");
  const [personTypeFilter, setPersonTypeFilter] = useState<"all" | "PJ" | "PF">("all");

  const ufs = useMemo(
    () => Array.from(new Set(clients.map((c) => c.uf).filter(Boolean))).sort() as string[],
    [clients],
  );

  const filtered = clients.filter((client) => {
    if (search && !client.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (ufFilter && client.uf !== ufFilter) return false;
    if (personTypeFilter !== "all" && client.personType !== personTypeFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome..."
          className="w-56 rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
        />
        <select
          value={ufFilter}
          onChange={(event) => setUfFilter(event.target.value)}
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
        >
          <option value="">Todos os estados</option>
          {ufs.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
        <select
          value={personTypeFilter}
          onChange={(event) => setPersonTypeFilter(event.target.value as typeof personTypeFilter)}
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
        >
          <option value="all">PJ e PF</option>
          <option value="PJ">Pessoa jurídica</option>
          <option value="PF">Pessoa física</option>
        </select>
        <span className="self-center text-xs text-[#7D7874]">
          {filtered.length} de {clients.length} clientes
        </span>
      </div>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-[#7D7874]">
            <th className="py-2">Nome</th>
            <th className="py-2">Documento</th>
            <th className="py-2">Tipo</th>
            <th className="py-2">Regime</th>
            <th className="py-2">Cidade/UF</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EFEAE0]">
          {filtered.map((client) => (
            <tr key={client.id}>
              <td className="py-2 text-[#24252A]">
                <Link href={`/clientes/${client.id}`} className="hover:underline">
                  {client.name}
                </Link>
              </td>
              <td className="py-2 text-[#7D7874]">{formatDocument(client)}</td>
              <td className="py-2 text-[#7D7874]">{client.tipoAtividade ?? "—"}</td>
              <td className="py-2 text-[#7D7874]">{client.taxRegime ?? "—"}</td>
              <td className="py-2 text-[#7D7874]">
                {client.municipio ? `${client.municipio}/${client.uf}` : "—"}
              </td>
              <td className="py-2">
                <span
                  className={
                    client.status === "ATIVO"
                      ? "rounded-full bg-[#E5EEE1] px-2 py-0.5 text-xs text-[#4C7A46]"
                      : "rounded-full bg-[#EFEAE0] px-2 py-0.5 text-xs text-[#7D7874]"
                  }
                >
                  {client.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
