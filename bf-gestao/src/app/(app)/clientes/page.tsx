import Link from "next/link";
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

  const [clients, empresas] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.empresa.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#24252A]">Clientes</h1>
        <Link
          href="/clientes/novo"
          className="rounded-lg bg-[#3D3E40] px-4 py-2 text-sm font-medium text-white hover:bg-[#2E2F2C]"
        >
          + Novo cliente
        </Link>
      </div>

      <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
        <ClientTable clients={clients} empresas={empresas} initialUf={uf} />
      </section>
    </div>
  );
}
