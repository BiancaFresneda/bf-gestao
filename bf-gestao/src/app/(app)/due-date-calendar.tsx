import Link from "next/link";
import { addDays, isoDateKey } from "@/lib/task-generation/dates";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEKDAY_LABELS = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];

export type DayCount = { total: number; late: number };

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function DueDateCalendar({
  month,
  todayKey,
  counts,
}: {
  month: Date;
  todayKey: string;
  counts: Map<string, DayCount>;
}) {
  const firstOfMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getUTCDay());

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(addDays(gridStart, i));
  }

  const prevMonth = addDays(firstOfMonth, -1);
  const nextMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link
          href={`?month=${monthKey(prevMonth)}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E1DBCC] text-[#7D7874] hover:bg-[#F7F5EF]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="text-center">
          <p className="text-lg font-bold text-[#24252A]">{MONTH_NAMES[month.getUTCMonth()]}</p>
          <p className="text-sm text-[#7D7874]">{month.getUTCFullYear()}</p>
        </div>
        <Link
          href={`?month=${monthKey(nextMonth)}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E1DBCC] text-[#7D7874] hover:bg-[#F7F5EF]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="pb-1 text-xs uppercase text-[#7D7874]">
            {label}
          </div>
        ))}

        {days.map((day) => {
          const inMonth = day.getUTCMonth() === month.getUTCMonth();
          const key = isoDateKey(day);
          const isToday = key === todayKey;
          const entry = counts.get(key);

          return (
            <div key={key} className="flex justify-center py-1">
              <Link
                href={`/tarefas?date=${key}`}
                className={`flex h-11 w-11 flex-col items-center justify-center rounded-lg text-sm transition hover:bg-[#F1EFE9] ${
                  isToday ? "border-2 border-[#959D90] font-bold text-[#24252A]" : inMonth ? "text-[#24252A]" : "text-[#D2CDBD]"
                }`}
              >
                <span>{day.getUTCDate()}</span>
                {entry && entry.total > 0 && (
                  <span
                    className={`-mt-0.5 rounded-full px-1.5 text-[10px] font-semibold ${
                      entry.late > 0 ? "bg-[#F6DFDB] text-[#B3453A]" : "bg-[#EFEAE0] text-[#7D7874]"
                    }`}
                  >
                    {entry.total}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
