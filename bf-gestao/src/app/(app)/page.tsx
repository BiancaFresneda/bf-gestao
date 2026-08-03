import { prisma } from "@/lib/prisma";
import { nowInSaoPauloMidnight, isoDateKey } from "@/lib/task-generation/dates";
import { DueDateCalendar, type DayCount } from "./due-date-calendar";
import { BrazilClientsMap } from "./brazil-clients-map";
import { DashboardHeader } from "./dashboard-header";

function CakeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 20h16v-5a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v5Z" />
      <path d="M4 17c1.2 0 1.2-1 2.4-1s1.2 1 2.4 1 1.2-1 2.4-1 1.2 1 2.4 1 1.2-1 2.4-1 1.2 1 2.4 1" />
      <path d="M9 11V8M12 11V8M15 11V8" />
      <path d="M9 5.5c0-.9.5-1.2.5-2S9 2 9 2M12 5.5c0-.9.5-1.2.5-2S12 2 12 2M15 5.5c0-.9.5-1.2.5-2S15 2 15 2" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneClasses = {
    neutral: "bg-[#EFEAE0] text-[#3D3E40]",
    good: "bg-[#E5EEE1] text-[#4C7A46]",
    warn: "bg-[#F5E7D3] text-[#B4762A]",
    bad: "bg-[#F6DFDB] text-[#B3453A]",
  }[tone];

  return (
    <div className="rounded-xl border border-[#E1DBCC] bg-white p-4 shadow-sm">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses}`}>
        <span className="h-[18px] w-[18px]">{icon}</span>
      </div>
      <p className="mt-3 text-xs font-semibold text-[#7D7874]">{label}</p>
      <p className="text-[26px] font-extrabold tracking-tight text-[#24252A]">{value}</p>
      {sub && <p className="text-xs text-[#7D7874]">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; empresa?: string }>;
}) {
  const { month: monthParam, empresa: empresaParam } = await searchParams;
  const today = nowInSaoPauloMidnight();
  const now = new Date();
  const todayKey = isoDateKey(today);

  const displayMonth = monthParam && /^\d{4}-\d{2}$/.test(monthParam)
    ? new Date(Date.UTC(Number(monthParam.slice(0, 4)), Number(monthParam.slice(5, 7)) - 1, 1))
    : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  const currentMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const currentMonthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
  const calendarMonthStart = displayMonth;
  const calendarMonthEnd = new Date(Date.UTC(displayMonth.getUTCFullYear(), displayMonth.getUTCMonth() + 1, 1));

  // Filtro de empresa recorta tudo que é ligado a Cliente (tarefas, mapa por estado) —
  // aniversários de usuários não têm empresa, ficam de fora desse recorte.
  const empresaId = empresaParam && empresaParam !== "all" ? empresaParam : undefined;
  const clientEmpresaWhere = empresaId ? { empresaId } : {};

  const [tasksThisMonth, overdueCount, overdueMultaCount, calendarTasks, clientStats, usersWithBirthDate, empresas] = await Promise.all([
    prisma.task.findMany({
      where: { prazoLegal: { gte: currentMonthStart, lt: currentMonthEnd }, client: clientEmpresaWhere },
      select: { status: true },
    }),
    prisma.task.count({
      where: { status: { in: ["PENDENTE", "EM_ANDAMENTO"] }, prazoLegal: { lt: now }, client: clientEmpresaWhere },
    }),
    prisma.task.count({
      where: {
        status: { in: ["PENDENTE", "EM_ANDAMENTO"] },
        prazoLegal: { lt: now },
        taskTemplate: { geraMulta: true },
        client: clientEmpresaWhere,
      },
    }),
    prisma.task.findMany({
      where: { prazoLegal: { gte: calendarMonthStart, lt: calendarMonthEnd }, client: clientEmpresaWhere },
      select: { prazoLegal: true, status: true },
    }),
    prisma.client.groupBy({ by: ["uf"], where: { status: "ATIVO", ...clientEmpresaWhere }, _count: { _all: true } }),
    prisma.user.findMany({
      where: { active: true, birthDate: { not: null } },
      select: { id: true, name: true, birthDate: true },
    }),
    prisma.empresa.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const birthdayUsers = usersWithBirthDate.filter(
    (user) =>
      user.birthDate!.getUTCMonth() === today.getUTCMonth() && user.birthDate!.getUTCDate() === today.getUTCDate(),
  );

  const tarefasDoMes = tasksThisMonth.length;
  const emAndamento = tasksThisMonth.filter((t) => t.status === "EM_ANDAMENTO").length;
  const concluidas = tasksThisMonth.filter((t) => t.status === "CONCLUIDA").length;
  const percentualConcluidas = tarefasDoMes > 0 ? Math.round((concluidas / tarefasDoMes) * 100) : 0;

  const calendarCounts = new Map<string, DayCount>();
  for (const task of calendarTasks) {
    const key = isoDateKey(task.prazoLegal);
    const entry = calendarCounts.get(key) ?? { total: 0, late: 0 };
    entry.total += 1;
    if ((task.status === "PENDENTE" || task.status === "EM_ANDAMENTO") && task.prazoLegal.getTime() < now.getTime()) {
      entry.late += 1;
    }
    calendarCounts.set(key, entry);
  }

  const countsByUf: Record<string, number> = {};
  let totalClientesAtivos = 0;
  for (const row of clientStats) {
    if (row.uf) countsByUf[row.uf] = row._count._all;
    totalClientesAtivos += row._count._all;
  }

  return (
    <div>
      <DashboardHeader
        empresas={empresas.map((e) => ({ id: e.id, name: e.name }))}
        currentEmpresaId={empresaId ?? "all"}
      />

      <div className="space-y-6 p-8">
        {birthdayUsers.length > 0 && (
          <div className="flex items-center gap-4 rounded-xl border border-[#F0DDB8] bg-[#FBEFD9] p-4">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#B4762A]">
              <span className="h-5 w-5">
                <CakeIcon />
              </span>
            </span>
            <p className="text-sm font-medium text-[#8A5A24]">
              Hoje é aniversário de {birthdayUsers.map((user) => user.name).join(" e ")}! Não esqueça de parabenizar.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Tarefas do mês"
            value={String(tarefasDoMes)}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 6h11M9 12h11M9 18h11" />
                <path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
              </svg>
            }
          />
          <StatCard
            label="Em andamento"
            value={String(emAndamento)}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 3a9 9 0 1 0 9 9" />
                <path d="M12 3v4" />
              </svg>
            }
          />
          <StatCard
            label="Em atraso"
            value={String(overdueCount)}
            tone={overdueCount > 0 ? "warn" : "neutral"}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v6l4 2" />
              </svg>
            }
          />
          <StatCard
            label="Risco de multa"
            value={String(overdueMultaCount)}
            tone={overdueMultaCount > 0 ? "bad" : "neutral"}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2 3 6.5v5.7C3 17.1 6.9 21 12 22c5.1-1 9-4.9 9-9.8V6.5L12 2Z" />
                <path d="M12 8v5M12 16.5v.01" />
              </svg>
            }
          />
          <StatCard
            label="Concluídas"
            value={`${concluidas} (${percentualConcluidas}%)`}
            tone="good"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <path d="m8 12 3 3 5-6" />
              </svg>
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
            <h2 className="text-lg font-bold text-[#24252A]">Calendário de Vencimentos</h2>
            <div className="mt-4">
              <DueDateCalendar month={displayMonth} todayKey={todayKey} counts={calendarCounts} />
            </div>
          </section>

          <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
            <h2 className="text-lg font-bold text-[#24252A]">Clientes por estado (Brasil)</h2>
            <p className="mt-1 text-sm text-[#7D7874]">
              {totalClientesAtivos} cliente(s) ativo(s) no Brasil
            </p>
            <div className="mt-4">
              <BrazilClientsMap countsByUf={countsByUf} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
