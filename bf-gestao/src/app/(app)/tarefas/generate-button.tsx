"use client";

import { useState, useTransition } from "react";
import { triggerTaskGeneration } from "./actions";

export function GenerateButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await triggerTaskGeneration();
      if (result.status === "SKIPPED_LOCK") {
        setMessage("Já existe uma geração em andamento — tente novamente em alguns segundos.");
      } else {
        setMessage(
          `Geração concluída: ${result.created} criada(s), ${result.skipped} já existente(s), ${result.errors} erro(s).`,
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg bg-[#B4762A] px-4 py-2 text-sm font-medium text-white hover:bg-[#9C6423] disabled:opacity-60"
      >
        {isPending ? "Gerando..." : "Gerar tarefas agora"}
      </button>
      {message && <span className="text-xs text-[#7D7874]">{message}</span>}
    </div>
  );
}
