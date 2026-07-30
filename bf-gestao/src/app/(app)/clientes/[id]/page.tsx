import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ClientForm } from "./client-form";

export default async function ClientEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifySession();
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: { partners: true, activities: true },
  });

  if (!client) {
    notFound();
  }

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
        <h1 className="mt-2 text-2xl font-bold text-[#24252A]">{client.name}</h1>
        <p className="mt-1 text-sm text-[#7D7874]">
          {client.cnpj ?? client.cpf} · {client.municipio ? `${client.municipio}/${client.uf}` : "Endereço não cadastrado"}
        </p>
      </div>

      <ClientForm
        client={{
          id: client.id,
          name: client.name,
          personType: client.personType,
          cnpj: client.cnpj,
          cpf: client.cpf,
          tradeName: client.tradeName,
          tipoAtividade: client.tipoAtividade,
          taxRegime: client.taxRegime,
          status: client.status,
          cep: client.cep,
          logradouro: client.logradouro,
          numero: client.numero,
          complemento: client.complemento,
          bairro: client.bairro,
          municipio: client.municipio,
          uf: client.uf,
          partners: client.partners.map((p) => ({
            name: p.name,
            cpf: p.cpf,
            ownershipPercent: p.ownershipPercent ? Number(p.ownershipPercent) : null,
          })),
          activities: client.activities.map((a) => ({
            code: a.code,
            description: a.description,
            isPrimary: a.isPrimary,
          })),
        }}
      />
    </div>
  );
}
