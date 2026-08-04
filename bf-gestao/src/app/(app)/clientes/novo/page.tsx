import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { NewClientForm } from "./new-client-form";

export default async function NovoClientePage() {
  await verifySession();

  const empresas = await prisma.empresa.findMany({ where: { active: true }, orderBy: { name: "asc" } });

  return (
    <div className="space-y-6 p-8">
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-sm text-[#7D7874] hover:text-[#3D3E40]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Voltar para Clientes
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[#24252A]">Novo cliente</h1>
      </div>

      <section className="max-w-2xl rounded-xl border border-[#E1DBCC] bg-white p-6">
        <NewClientForm empresas={empresas.map((empresa) => ({ id: empresa.id, name: empresa.name }))} />
      </section>
    </div>
  );
}
