import { geoAlbersUsa } from "d3-geo";
import type { Topology } from "topojson-specification";
import { prisma } from "@/lib/prisma";
import { nowInSaoPauloMidnight, isoDateKey } from "@/lib/task-generation/dates";
import { ISO_NUMERIC_BY_COUNTRY } from "@/lib/countries";
import { DueDateCalendar, type DayCount } from "./due-date-calendar";
import { StatesBubbleMap } from "./states-bubble-map";
import { WorldClientsMap } from "./world-clients-map";
import { DashboardHeader } from "./dashboard-header";
import brazilTopology from "@/data/brazil-states-topo.json";
import usTopology from "@/data/us-states-topo.json";

const COUNTRY_LABEL: Record<string, string> = { BR: "Brasil", US: "Estados Unidos" };

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

function HourglassIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41a2 2 0 0 0-.59 1.42V22" />
      <path d="M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2" />
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
  tone?: "neutral" | "good" | "andamento" | "atraso" | "multa";
}) {
  const toneClasses = {
    neutral: "bg-[#EFEAE0] text-[#3D3E40]",
    good: "bg-[#E5EEE1] text-[#4C7A46]",
    // Mesmo tom do botão "Nova Tarefa" (sidebar), só que translúcido sobre o card branco.
    andamento: "bg-[#B4762A]/15 text-[#B4762A]",
    atraso: "bg-[#B3453A]/15 text-[#B3453A]",
    // Sem transparência e com o ícone em branco de propósito — precisa chamar mais
    // atenção que "Em atraso", já que risco de multa é o alerta mais grave do Dashboard.
    multa: "bg-[#B3453A] text-white",
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
  searchParams: Promise<{ month?: string; empresa?: string; tipo?: string }>;
}) {
  const { month: monthParam, empresa: empresaParam, tipo: tipoParam } = await searchParams;
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

  // Filtro de empresa e de tipo de pessoa recortam tudo que é ligado a Cliente (tarefas,
  // mapa por estado) — aniversários de usuários não têm empresa nem tipo, ficam de fora
  // desse recorte.
  const empresaId = empresaParam && empresaParam !== "all" ? empresaParam : undefined;
  const personType: "PJ" | "PF" | undefined = tipoParam === "PJ" ? "PJ" : tipoParam === "PF" ? "PF" : undefined;
  const clientEmpresaWhere: { empresaId?: string; personType?: "PJ" | "PF" } = {};
  if (empresaId) clientEmpresaWhere.empresaId = empresaId;
  if (personType) clientEmpresaWhere.personType = personType;

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
    prisma.client.groupBy({ by: ["country", "uf"], where: { status: "ATIVO", ...clientEmpresaWhere }, _count: { _all: true } }),
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

  // Mesma consulta serve os dois recortes: por UF (mapa de um país específico) e por
  // país (mapa mundial) — não dá pra saber de antemão qual mapa vai renderizar porque
  // isso depende da unidade escolhida no filtro do cabeçalho.
  const countsByUf: Record<string, number> = {};
  const countsByCountry: Record<string, number> = {};
  let totalClientesAtivos = 0;
  for (const row of clientStats) {
    totalClientesAtivos += row._count._all;
    countsByCountry[row.country] = (countsByCountry[row.country] ?? 0) + row._count._all;
    if (row.uf) {
      const sigla = row.uf.trim().toUpperCase();
      countsByUf[sigla] = (countsByUf[sigla] ?? 0) + row._count._all;
    }
  }

  // A unidade escolhida no filtro decide o país do mapa; sem unidade selecionada, mostra
  // o mundo inteiro com uma bolinha por país. "país" aqui só existe pros que já têm
  // clientes ativos — nada fica hardcoded em BR/EUA.
  const selectedEmpresa = empresaId ? empresas.find((e) => e.id === empresaId) : undefined;
  const mapCountry = selectedEmpresa?.country;

  const empresaIdByCountry: Record<string, string> = {};
  for (const empresa of empresas) {
    if (!empresaIdByCountry[empresa.country]) empresaIdByCountry[empresa.country] = empresa.id;
  }
  const worldRegions: Record<string, { count: number; href: string }> = {};
  for (const [country, count] of Object.entries(countsByCountry)) {
    const isoId = ISO_NUMERIC_BY_COUNTRY[country];
    const targetEmpresaId = empresaIdByCountry[country];
    if (isoId && count > 0 && targetEmpresaId) {
      worldRegions[isoId] = { count, href: `/?empresa=${targetEmpresaId}` };
    }
  }

  return (
    <div>
      <DashboardHeader
        empresas={empresas.map((e) => ({ id: e.id, name: e.name }))}
        currentEmpresaId={empresaId ?? "all"}
        currentPersonType={personType ?? "all"}
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
            tone="andamento"
            icon={<HourglassIcon />}
          />
          <StatCard
            label="Em atraso"
            value={String(overdueCount)}
            tone="atraso"
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
            tone="multa"
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
            <h2 className="text-lg font-bold text-[#24252A]">
              {mapCountry ? `Clientes por estado (${COUNTRY_LABEL[mapCountry] ?? mapCountry})` : "Clientes por país"}
            </h2>
            <p className="mt-1 text-sm text-[#7D7874]">
              {totalClientesAtivos} cliente(s) ativo(s)
              {mapCountry ? ` em ${COUNTRY_LABEL[mapCountry] ?? mapCountry}` : ""}
            </p>
            <div className="mt-4">
              {!mapCountry && <WorldClientsMap regions={worldRegions} />}
              {mapCountry === "US" && (
                <StatesBubbleMap
                  topology={usTopology as unknown as Topology}
                  countsBySigla={countsByUf}
                  hrefFor={(sigla) => `/clientes?uf=${sigla}`}
                  ariaLabel="Clientes ativos por estado nos Estados Unidos"
                  makeProjection={geoAlbersUsa}
                />
              )}
              {mapCountry !== "US" && mapCountry !== undefined && (
                <StatesBubbleMap
                  topology={brazilTopology as unknown as Topology}
                  countsBySigla={countsByUf}
                  hrefFor={(sigla) => `/clientes?uf=${sigla}`}
                  ariaLabel="Clientes ativos por estado no Brasil"
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
