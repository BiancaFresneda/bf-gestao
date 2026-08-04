import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { CertificadosTable } from "./certificados-table";

export default async function CertificadosPage() {
  await verifySession();

  const certificados = await prisma.certificado.findMany({
    include: { client: { select: { id: true, name: true } } },
    orderBy: { dataValidade: "asc" },
  });

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-[#24252A]">Certificados</h1>
        <p className="mt-1 text-sm text-[#7D7874]">
          Certificados digitais dos clientes, com a data de vencimento.
        </p>
      </div>

      <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
        {certificados.length === 0 ? (
          <p className="text-sm text-[#7D7874]">
            Nenhum certificado cadastrado ainda. Adicione um pela tela de edição do cliente.
          </p>
        ) : (
          <CertificadosTable
            certificados={certificados.map((cert) => ({
              id: cert.id,
              tipo: cert.tipo,
              dataValidade: cert.dataValidade.toISOString(),
              arquivoUrl: cert.arquivoUrl,
              client: cert.client ? { id: cert.client.id, name: cert.client.name } : null,
            }))}
          />
        )}
      </section>
    </div>
  );
}
