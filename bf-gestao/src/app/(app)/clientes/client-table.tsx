"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDocument } from "@/lib/format";
import { ColumnFilterHeader } from "@/components/column-filter-header";

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

const COLUMNS = ["nome", "documento", "tipo", "regime", "cidade", "status"] as const;
type Column = (typeof COLUMNS)[number];

function columnValue(client: ClientRow, column: Column): string {
  switch (column) {
    case "nome":
      return client.name;
    case "documento":
      return formatDocument(client);
    case "tipo":
      return client.tipoAtividade ?? "—";
    case "regime":
      return client.taxRegime ?? "—";
    case "cidade":
      return client.municipio ? `${client.municipio}/${client.uf}` : "—";
    case "status":
      return client.status;
  }
}

export function ClientTable({ clients, initialUf }: { clients: ClientRow[]; initialUf?: string }) {
  const [search, setSearch] = useState("");
  const [personTypeFilter, setPersonTypeFilter] = useState<"all" | "PJ" | "PF">("all");
  const [ufFilter, setUfFilter] = useState(initialUf ?? "all");
  const [columnFilters, setColumnFilters] = useState<Record<Column, Set<string>>>({
    nome: new Set(),
    documento: new Set(),
    tipo: new Set(),
    regime: new Set(),
    cidade: new Set(),
    status: new Set(),
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const columnOptions = useMemo(() => {
    const options: Record<Column, string[]> = {
      nome: [],
      documento: [],
      tipo: [],
      regime: [],
      cidade: [],
      status: [],
    };
    for (const column of COLUMNS) {
      options[column] = Array.from(new Set(clients.map((c) => columnValue(c, column)))).sort();
    }
    return options;
  }, [clients]);

  const ufOptions = useMemo(() => {
    return Array.from(new Set(clients.map((c) => c.uf).filter((uf): uf is string => Boolean(uf)))).sort();
  }, [clients]);

  const filtered = clients.filter((client) => {
    if (search && !client.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (personTypeFilter !== "all" && client.personType !== personTypeFilter) return false;
    if (ufFilter !== "all" && client.uf !== ufFilter) return false;
    for (const column of COLUMNS) {
      const selected = columnFilters[column];
      if (selected.size > 0 && !selected.has(columnValue(client, column))) return false;
    }
    return true;
  });

  const allVisibleSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

  function updateColumnFilter(column: Column, next: Set<string>) {
    setColumnFilters((prev) => ({ ...prev, [column]: next }));
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const client of filtered) next.delete(client.id);
      } else {
        for (const client of filtered) next.add(client.id);
      }
      return next;
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome..."
          className="w-56 rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
        />
        <select
          value={personTypeFilter}
          onChange={(event) => setPersonTypeFilter(event.target.value as typeof personTypeFilter)}
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
        >
          <option value="all">PJ e PF</option>
          <option value="PJ">Pessoa jurídica</option>
          <option value="PF">Pessoa física</option>
        </select>
        <select
          value={ufFilter}
          onChange={(event) => setUfFilter(event.target.value)}
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
        >
          <option value="all">Todos os estados</option>
          {ufOptions.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
        <span className="self-center text-xs text-[#7D7874]">
          {selectedIds.size > 0
            ? `${selectedIds.size} selecionado(s) · ${filtered.length} de ${clients.length} clientes`
            : `${filtered.length} de ${clients.length} clientes`}
        </span>
      </div>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-[#7D7874]">
            <th className="w-8 py-2">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
            </th>
            <ColumnFilterHeader
              label="Nome"
              options={columnOptions.nome}
              selected={columnFilters.nome}
              onChange={(next) => updateColumnFilter("nome", next)}
            />
            <ColumnFilterHeader
              label="Documento"
              options={columnOptions.documento}
              selected={columnFilters.documento}
              onChange={(next) => updateColumnFilter("documento", next)}
            />
            <ColumnFilterHeader
              label="Tipo"
              options={columnOptions.tipo}
              selected={columnFilters.tipo}
              onChange={(next) => updateColumnFilter("tipo", next)}
            />
            <ColumnFilterHeader
              label="Regime"
              options={columnOptions.regime}
              selected={columnFilters.regime}
              onChange={(next) => updateColumnFilter("regime", next)}
            />
            <ColumnFilterHeader
              label="Cidade/UF"
              options={columnOptions.cidade}
              selected={columnFilters.cidade}
              onChange={(next) => updateColumnFilter("cidade", next)}
            />
            <ColumnFilterHeader
              label="Status"
              options={columnOptions.status}
              selected={columnFilters.status}
              onChange={(next) => updateColumnFilter("status", next)}
            />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EFEAE0]">
          {filtered.map((client) => (
            <tr key={client.id}>
              <td className="py-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(client.id)}
                  onChange={() => toggleRow(client.id)}
                />
              </td>
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
