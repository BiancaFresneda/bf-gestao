"use client";

import { useState, useTransition } from "react";
import { triggerTaskGeneration } from "./actions";

export function GenerateButton() {
  const [monthsAhead, setMonthsAhead] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await triggerTaskGeneration(monthsAhead);
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
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-[#7D7874]" title="0 = gera só até o mês atual. Ex.: 1 = também gera a próxima competência, antes do mês virar.">
          Antecipar (meses)
          <input
            type="number"
            min={0}
            max={12}
            value={monthsAhead}
            disabled={isPending}
            onChange={(event) => setMonthsAhead(Math.min(12, Math.max(0, Number(event.target.value) || 0)))}
            className="w-16 rounded-lg border border-[#E1DBCC] bg-white px-2 py-1 text-sm text-[#24252A] outline-none focus:border-[#959D90] disabled:opacity-60"
          />
        </label>
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className="rounded-lg bg-[#B4762A] px-4 py-2 text-sm font-medium text-white hover:bg-[#9C6423] disabled:opacity-60"
        >
          {isPending ? "Gerando..." : "Gerar tarefas agora"}
        </button>
      </div>
      {message && <span className="text-xs text-[#7D7874]">{message}</span>}
    </div>
  );
}
