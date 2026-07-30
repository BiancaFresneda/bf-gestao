export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
      <p className="mt-1 text-sm text-stone-500">
        Visão geral das obrigações do mês e alertas importantes.
      </p>

      <div className="mt-8 rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
        Fase 0 concluída: fundação, autenticação e infraestrutura de deploy prontas.
        Os módulos de Clientes e Tarefas chegam nas próximas fases.
      </div>
    </div>
  );
}
