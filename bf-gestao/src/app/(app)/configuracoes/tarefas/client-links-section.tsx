"use client";

import { useMemo, useState, useTransition } from "react";
import { saveClientTaskTemplateLinks } from "./actions";

type ClientOption = { id: string; name: string; linked: boolean };

export function ClientLinksSection({
  templateId,
  clients,
}: {
  templateId: string;
  clients: ClientOption[];
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(clients.filter((c) => c.linked).map((c) => c.id)),
  );
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const filtered = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [clients, search],
  );

  const initialSelected = useMemo(() => new Set(clients.filter((c) => c.linked).map((c) => c.id)), [clients]);
  const isDirty =
    selected.size !== initialSelected.size || Array.from(selected).some((id) => !initialSelected.has(id));

  function toggle(clientId: string) {
    setSavedMessage(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      await saveClientTaskTemplateLinks(templateId, Array.from(selected));
      setSavedMessage("Vínculos salvos.");
    });
  }

  return (
    <section className="mt-6 max-w-3xl rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-900">Clientes vinculados</h2>
        <span className="text-xs text-stone-500">
          {selected.size} de {clients.length} clientes
        </span>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        Marque os clientes para os quais esta tarefa deve ser gerada automaticamente e clique em
        Salvar.
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
              checked={selected.has(client.id)}
              onChange={() => toggle(client.id)}
            />
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-4 text-center text-sm text-stone-400">Nenhum cliente encontrado.</li>
        )}
      </ul>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !isDirty}
          className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar"}
        </button>
        {!isPending && savedMessage && <span className="text-xs text-stone-500">{savedMessage}</span>}
        {!isPending && isDirty && !savedMessage && (
          <span className="text-xs text-stone-400">Há alterações não salvas.</span>
        )}
      </div>
    </section>
  );
}
