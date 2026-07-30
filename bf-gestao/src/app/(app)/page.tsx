import Link from "next/link";
import { prisma } from "@/lib/prisma";

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
  tone?: "neutral" | "good" | "warn";
}) {
  const toneClasses = {
    neutral: "bg-[#EFEAE0] text-[#3D3E40]",
    good: "bg-[#E5EEE1] text-[#4C7A46]",
    warn: "bg-[#F5E7D3] text-[#B4762A]",
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

export default async function DashboardPage() {
  const [templateTotal, templateActive, clientTotal, userActive, taskTotal] = await Promise.all([
    prisma.taskTemplate.count(),
    prisma.taskTemplate.count({ where: { active: true } }),
    prisma.client.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.task.count(),
  ]);

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-[#24252A]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#7D7874]">
          Visão geral das obrigações do mês e alertas importantes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Templates de tarefa"
          value={String(templateTotal)}
          sub={`${templateActive} ativos`}
          tone={templateActive > 0 ? "good" : "neutral"}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 6h11M9 12h11M9 18h11" />
              <path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
            </svg>
          }
        />
        <StatCard
          label="Clientes cadastrados"
          value={String(clientTotal)}
          sub={clientTotal > 0 ? "Cadastro completo chega na Fase 1" : "Nenhum cliente importado ainda"}
          tone={clientTotal > 0 ? "good" : "neutral"}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="9" cy="8" r="3.2" />
              <path d="M3.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6" />
            </svg>
          }
        />
        <StatCard
          label="Usuários ativos"
          value={String(userActive)}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="8" r="3.2" />
              <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
            </svg>
          }
        />
        <StatCard
          label="Tarefas geradas este mês"
          value={String(taskTotal)}
          sub="Motor de geração ainda não implementado"
          tone="warn"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v6l4 2" />
            </svg>
          }
        />
      </div>

      <div className="rounded-xl border border-[#E1DBCC] bg-white p-6">
        <h2 className="text-sm font-bold text-[#24252A]">Próximo passo: revisar o catálogo de tarefas</h2>
        <p className="mt-1 text-sm text-[#7D7874]">
          {templateTotal - templateActive} de {templateTotal} templates importados do sistema
          anterior ainda estão inativos, esperando a definição da regra de prazo legal antes de
          serem ativados.
        </p>
        <Link
          href="/configuracoes/tarefas"
          className="mt-4 inline-flex rounded-lg bg-[#959D90] px-4 py-2 text-sm font-medium text-white hover:bg-[#87907F]"
        >
          Abrir Cadastro de Tarefas
        </Link>
      </div>
    </div>
  );
}
