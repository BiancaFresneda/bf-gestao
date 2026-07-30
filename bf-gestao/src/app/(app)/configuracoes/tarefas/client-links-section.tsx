"use client";

import { useMemo, useState, useTransition } from "react";
import { setClientTaskTemplateLink } from "./actions";

type ClientOption = { id: string; name: string; linked: boolean };

export function ClientLinksSection({
  templateId,
  clients,
}: {
  templateId: string;
  clients: ClientOption[];
}) {
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [clients, search],
  );

  const linkedCount = clients.filter((c) => c.linked).length;

  function toggle(clientId: string, next: boolean) {
    setPendingId(clientId);
    startTransition(async () => {
      await setClientTaskTemplateLink(templateId, clientId, next);
      setPendingId(null);
    });
  }

  return (
    <section className="mt-6 max-w-3xl rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-900">Clientes vinculados</h2>
        <span className="text-xs text-stone-500">{linkedCount} de {clients.length} clientes</span>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        Marque os clientes para os quais esta tarefa deve ser gerada automaticamente.
      </p>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar cliente..."
        className="mt-3 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
      />

      <ul className="mt-3 max-h-80 divide-y divide-stone-100 overflow-y-auto">
        {filtered.map((client) => (
          <li key={client.id} className="flex items-center justify-between py-2">
            <span className="text-sm text-stone-800">{client.name}</span>
            <input
              type="checkbox"
              checked={client.linked}
              disabled={isPending && pendingId === client.id}
              onChange={(event) => toggle(client.id, event.target.checked)}
            />
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-4 text-center text-sm text-stone-400">Nenhum cliente encontrado.</li>
        )}
      </ul>
    </section>
  );
}
