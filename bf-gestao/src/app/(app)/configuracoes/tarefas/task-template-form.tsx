"use client";

import { useActionState, useState } from "react";
import type { TaskTemplateFormState } from "./actions";

type Department = { id: string; name: string };
type UserOption = { id: string; name: string };

type ExistingTemplate = {
  id: string;
  name: string;
  departmentId: string;
  periodicity: string;
  legalDeadlineRule: unknown;
  competenciaOffsetMonths: number;
  metaDeadlineOffsetDays: number;
  businessDayAdjustment: string;
  geraMulta: boolean;
  active: boolean;
  defaultResponsibleId: string | null;
};

const PERIODICITY_OPTIONS = [
  { value: "MONTHLY", label: "Mensal" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "QUARTERLY", label: "Trimestral" },
  { value: "SEMESTER", label: "Semestral" },
  { value: "YEARLY", label: "Anual" },
  { value: "PONTUAL", label: "Pontual" },
];

const POSTERGAR_TOOLTIP =
  'Ao ativar a opção "postergar", caso a tarefa caia no final de semana ou feriado nacional, será adicionado um dia a mais para a realização da mesma.';

function ruleDayOf(rule: unknown): string {
  if (rule && typeof rule === "object" && "day" in rule) {
    return String((rule as Record<string, unknown>).day);
  }
  return "";
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]";
const labelClass = "block text-xs font-medium text-[#7D7874]";

export function TaskTemplateForm({
  departments,
  users,
  template,
  action,
}: {
  departments: Department[];
  users: UserOption[];
  template?: ExistingTemplate;
  action: (state: TaskTemplateFormState, formData: FormData) => Promise<TaskTemplateFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [postergar, setPostergar] = useState(template?.businessDayAdjustment === "POSTPONE");

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelClass}>Nome da tarefa</label>
          <input name="name" defaultValue={template?.name} required className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Departamento</label>
          <select name="departmentId" defaultValue={template?.departmentId ?? ""} required className={inputClass}>
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
          <label className={labelClass}>Periodicidade</label>
          <select name="periodicity" defaultValue={template?.periodicity ?? "MONTHLY"} className={inputClass}>
            {PERIODICITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Responsável</label>
          <select name="defaultResponsibleId" defaultValue={template?.defaultResponsibleId ?? ""} className={inputClass}>
            <option value="">Sem responsável definido</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Data legal</label>
          <div className="mt-1 flex items-center gap-3">
            <input
              name="ruleDay"
              type="number"
              min={1}
              max={31}
              placeholder="Ex.: 20"
              defaultValue={ruleDayOf(template?.legalDeadlineRule)}
              className="w-24 rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
            />
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                name="postergar"
                checked={postergar}
                onChange={(event) => setPostergar(event.target.checked)}
                className="peer sr-only"
              />
              <span className="relative h-5 w-9 rounded-full bg-[#E1DBCC] transition-colors peer-checked:bg-[#B4762A]">
                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
              </span>
              <span className="text-sm text-[#24252A]">Postergar</span>
            </label>
            <span
              title={POSTERGAR_TOOLTIP}
              className="flex h-4 w-4 shrink-0 cursor-help items-center justify-center rounded-full bg-[#EFEAE0] text-[10px] font-bold text-[#7D7874]"
            >
              !
            </span>
          </div>
          <p className="mt-1 text-xs text-[#7D7874]">
            Dia do mês em que a tarefa vence. Ex.: 20 = vence todo dia 20.
          </p>
        </div>

        <div>
          <label className={labelClass}>Data meta</label>
          <input
            name="metaDeadlineOffsetDays"
            type="number"
            defaultValue={template?.metaDeadlineOffsetDays ?? -3}
            className={`${inputClass} max-w-[6rem]`}
          />
          <p className="mt-1 text-xs text-[#7D7874]">
            Dias em relação à data legal. Ex.: -10 = queremos concluir 10 dias antes do vencimento.
          </p>
        </div>
      </div>

      <fieldset className="rounded-lg border border-[#E1DBCC] p-3">
        <legend className="px-1 text-xs font-medium text-[#7D7874]">Competência</legend>
        <div className="max-w-xs">
          <label className="block text-xs text-[#7D7874]">Deslocamento em meses a partir do mês atual</label>
          <input
            name="competenciaOffsetMonths"
            type="number"
            step={1}
            defaultValue={template?.competenciaOffsetMonths ?? 0}
            required
            className={inputClass}
          />
          <p className="mt-1 text-xs text-[#7D7874]">
            Ex.: -1 = ao gerar em julho, a competência é junho. 0 = competência é o próprio mês atual.
          </p>
        </div>
      </fieldset>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-[#24252A]">
          <input type="checkbox" name="geraMulta" defaultChecked={template?.geraMulta} />
          Gera multa se atrasar
        </label>
        <label className="flex items-center gap-2 text-sm text-[#24252A]">
          <input type="checkbox" name="active" defaultChecked={template?.active ?? false} />
          Ativa
        </label>
      </div>

      {state?.error && <p className="text-sm text-[#B3453A]">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#B4762A] px-4 py-2 text-sm font-medium text-white hover:bg-[#9C6423] disabled:opacity-60"
      >
        {pending ? "Salvando..." : template ? "Salvar alterações" : "Criar tarefa"}
      </button>
    </form>
  );
}
