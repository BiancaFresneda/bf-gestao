import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ClientTable } from "./client-table";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ uf?: string }>;
}) {
  await verifySession();
  const { uf } = await searchParams;

  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-[#24252A]">Clientes</h1>
        <p className="mt-1 text-sm text-[#7D7874]">
          Base de clientes importada. Cadastro manual e edição chegam com o restante da Fase 1.
        </p>
      </div>

      <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
        <ClientTable clients={clients} initialUf={uf} />
      </section>
    </div>
  );
}
