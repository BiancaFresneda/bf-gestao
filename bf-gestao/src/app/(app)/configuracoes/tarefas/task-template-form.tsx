"use client";

import { useActionState, useState } from "react";
import type { TaskTemplateFormState } from "./actions";
import type { Rule } from "./rule";

type Department = { id: string; name: string };

type ExistingTemplate = {
  id: string;
  name: string;
  departmentId: string;
  module: string | null;
  periodicity: string;
  legalDeadlineRule: unknown;
  metaDeadlineOffsetDays: number;
  businessDayAdjustment: string;
  geraMulta: boolean;
  active: boolean;
};

const PERIODICITY_OPTIONS = [
  { value: "MONTHLY", label: "Mensal" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "QUARTERLY", label: "Trimestral" },
  { value: "SEMESTER", label: "Semestral" },
  { value: "YEARLY", label: "Anual" },
  { value: "PONTUAL", label: "Pontual" },
];

const MODULE_OPTIONS = [
  { value: "", label: "Sem módulo específico" },
  { value: "FISCAL", label: "Fiscal" },
  { value: "PESSOAL", label: "Pessoal" },
  { value: "CONTABIL", label: "Contábil" },
  { value: "SOCIETARIO", label: "Societário" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "LEGAL", label: "Legal" },
];

const ADJUSTMENT_OPTIONS = [
  { value: "POSTPONE", label: "Adiar para o próximo dia útil" },
  { value: "ANTECIPATE", label: "Antecipar para o dia útil anterior" },
  { value: "NONE", label: "Não ajustar" },
];

const RULE_TYPE_OPTIONS = [
  { value: "unset", label: "A definir depois" },
  { value: "dayOfMonth", label: "Dia fixo do mês" },
  { value: "lastBusinessDay", label: "Último dia útil do mês" },
  { value: "nthBusinessDay", label: "Enésimo dia útil do mês" },
];

function ruleTypeOf(rule: unknown): string {
  if (rule && typeof rule === "object" && "type" in rule) {
    return String((rule as Rule).type);
  }
  return "unset";
}

function ruleFieldOf(rule: unknown, field: "day" | "monthOffset" | "n"): string {
  if (rule && typeof rule === "object" && field in rule) {
    return String((rule as Record<string, unknown>)[field]);
  }
  return field === "monthOffset" ? "0" : "";
}

export function TaskTemplateForm({
  departments,
  template,
  action,
}: {
  departments: Department[];
  template?: ExistingTemplate;
  action: (state: TaskTemplateFormState, formData: FormData) => Promise<TaskTemplateFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [ruleType, setRuleType] = useState(ruleTypeOf(template?.legalDeadlineRule));

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-stone-600">Nome da tarefa</label>
          <input
            name="name"
            defaultValue={template?.name}
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600">Departamento</label>
          <select
            name="departmentId"
            defaultValue={template?.departmentId ?? ""}
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          >
            <option value="" disabled>
              Selecione
            </option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600">Módulo</label>
          <select
            name="module"
            defaultValue={template?.module ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          >
            {MODULE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600">Periodicidade</label>
          <select
            name="periodicity"
            defaultValue={template?.periodicity ?? "MONTHLY"}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          >
            {PERIODICITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="rounded-lg border border-stone-200 p-3">
        <legend className="px-1 text-xs font-medium text-stone-600">Prazo legal</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs text-stone-500">Regra</label>
            <select
              name="ruleType"
              value={ruleType}
              onChange={(event) => setRuleType(event.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
            >
              {RULE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {ruleType === "dayOfMonth" && (
            <div>
              <label className="block text-xs text-stone-500">Dia do mês</label>
              <input
                name="ruleDay"
                type="number"
                min={1}
                max={31}
                defaultValue={ruleFieldOf(template?.legalDeadlineRule, "day")}
                required
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
              />
            </div>
          )}

          {ruleType === "nthBusinessDay" && (
            <div>
              <label className="block text-xs text-stone-500">Enésimo dia útil</label>
              <input
                name="ruleN"
                type="number"
                min={1}
                max={31}
                defaultValue={ruleFieldOf(template?.legalDeadlineRule, "n")}
                required
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
              />
            </div>
          )}

          {(ruleType === "dayOfMonth" || ruleType === "lastBusinessDay" || ruleType === "nthBusinessDay") && (
            <div>
              <label className="block text-xs text-stone-500">Mês de referência</label>
              <select
                name="ruleMonthOffset"
                defaultValue={ruleFieldOf(template?.legalDeadlineRule, "monthOffset")}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
              >
                <option value="0">Mesmo mês da competência</option>
                <option value="1">Mês seguinte</option>
                <option value="2">2 meses depois</option>
                <option value="3">3 meses depois</option>
              </select>
            </div>
          )}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-stone-600">
            Prazo meta (dias em relação ao prazo legal)
          </label>
          <input
            name="metaDeadlineOffsetDays"
            type="number"
            defaultValue={template?.metaDeadlineOffsetDays ?? -3}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          />
          <p className="mt-1 text-xs text-stone-400">Ex.: -3 = 3 dias antes do prazo legal.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600">Ajuste de dia útil</label>
          <select
            name="businessDayAdjustment"
            defaultValue={template?.businessDayAdjustment ?? "POSTPONE"}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          >
            {ADJUSTMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-center gap-2 pt-4">
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" name="geraMulta" defaultChecked={template?.geraMulta} />
            Gera multa se atrasar
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" name="active" defaultChecked={template?.active ?? false} />
            Ativa
          </label>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? "Salvando..." : template ? "Salvar alterações" : "Criar tarefa"}
      </button>
    </form>
  );
}
