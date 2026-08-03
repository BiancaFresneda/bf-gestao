"use client";

import { useMemo, useState, useTransition } from "react";
import { saveTaskTemplateChecklist } from "./actions";

type ChecklistItemDraft = {
  key: string;
  text: string;
  required: boolean;
};

export type ChecklistItemInitial = { id: string; text: string; required: boolean };

let draftKeySeq = 0;
function nextDraftKey() {
  draftKeySeq += 1;
  return `draft-${draftKeySeq}`;
}

function toDrafts(items: ChecklistItemInitial[]): ChecklistItemDraft[] {
  return items.map((item) => ({ key: item.id, text: item.text, required: item.required }));
}

export function ChecklistSection({
  templateId,
  items,
}: {
  templateId: string;
  items: ChecklistItemInitial[];
}) {
  const initialDrafts = useMemo(() => toDrafts(items), [items]);
  const [drafts, setDrafts] = useState<ChecklistItemDraft[]>(initialDrafts);
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const isDirty =
    drafts.length !== initialDrafts.length ||
    drafts.some((draft, index) => {
      const original = initialDrafts[index];
      return !original || draft.text !== original.text || draft.required !== original.required;
    });

  function handleAddItem() {
    setSavedMessage(null);
    setDrafts((prev) => [...prev, { key: nextDraftKey(), text: "", required: false }]);
  }

  function handleTextChange(key: string, text: string) {
    setSavedMessage(null);
    setDrafts((prev) => prev.map((draft) => (draft.key === key ? { ...draft, text } : draft)));
  }

  function handleRequiredChange(key: string, required: boolean) {
    setSavedMessage(null);
    setDrafts((prev) => prev.map((draft) => (draft.key === key ? { ...draft, required } : draft)));
  }

  function handleRemove(key: string) {
    setSavedMessage(null);
    setDrafts((prev) => prev.filter((draft) => draft.key !== key));
  }

  function handleCancel() {
    setSavedMessage(null);
    setDrafts(initialDrafts);
  }

  function handleSave() {
    startTransition(async () => {
      await saveTaskTemplateChecklist(
        templateId,
        drafts.map((draft) => ({ text: draft.text, required: draft.required })),
      );
      setSavedMessage("Checklist salvo.");
    });
  }

  return (
    <section className="max-w-3xl rounded-xl border border-[#E1DBCC] bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#24252A]">Checklist da tarefa</h2>
        <button
          type="button"
          onClick={handleAddItem}
          className="flex items-center gap-1.5 rounded-lg border border-[#E1DBCC] px-3 py-1.5 text-sm text-[#24252A] hover:bg-[#F7F5EF]"
        >
          <span className="text-base leading-none">+</span> Adicionar item
        </button>
      </div>

      <p className="mt-2 text-xs text-[#B4762A]">
        Itens marcados como obrigatórios precisam estar concluídos antes de fechar a tarefa. Itens
        opcionais contam para a barra de progresso, mas não bloqueiam a conclusão.
      </p>

      {drafts.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-[#E1DBCC] px-4 py-6 text-center text-sm text-[#7D7874]">
          Nenhum item de checklist. Esta tarefa não exigirá checklist na execução.
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {drafts.map((draft) => (
            <li
              key={draft.key}
              className="flex items-center gap-3 rounded-lg border border-[#E1DBCC] px-3 py-2"
            >
              <input
                value={draft.text}
                onChange={(event) => handleTextChange(draft.key, event.target.value)}
                placeholder="Descreva o item do checklist"
                className="flex-1 rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
              />
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.required}
                  onChange={(event) => handleRequiredChange(draft.key, event.target.checked)}
                  className="peer sr-only"
                />
                <span className="relative h-5 w-9 rounded-full bg-[#E1DBCC] transition-colors peer-checked:bg-[#B4762A]">
                  <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
                </span>
                <span className="text-xs text-[#24252A]">Obrigatório</span>
              </label>
              <button
                type="button"
                onClick={() => handleRemove(draft.key)}
                aria-label="Remover item"
                className="shrink-0 text-[#B3453A] hover:text-[#8F332A]"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending || !isDirty}
          className="rounded-lg border border-[#E1DBCC] px-4 py-2 text-sm text-[#24252A] hover:bg-[#F7F5EF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !isDirty}
          className="rounded-lg bg-[#B4762A] px-4 py-2 text-sm font-medium text-white hover:bg-[#9C6423] disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar"}
        </button>
        {!isPending && savedMessage && <span className="text-xs text-[#7D7874]">{savedMessage}</span>}
        {!isPending && isDirty && !savedMessage && (
          <span className="text-xs text-[#7D7874]">Há alterações não salvas.</span>
        )}
      </div>
    </section>
  );
}
