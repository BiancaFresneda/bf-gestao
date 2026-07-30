import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { expiryStatus } from "@/lib/format";

const TIPO_LABEL: Record<string, string> = {
  E_CNPJ: "e-CNPJ",
  E_CPF: "e-CPF",
  NFE: "NF-e",
  OUTRO: "Outro",
};

export default async function CertificadosPage() {
  await verifySession();

  const certificados = await prisma.certificado.findMany({
    include: { client: true },
    orderBy: { client: { name: "asc" } },
  });

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-[#24252A]">Certificados</h1>
        <p className="mt-1 text-sm text-[#7D7874]">
          Certificados digitais dos clientes, em ordem alfabética, com a data de vencimento.
        </p>
      </div>

      <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
        {certificados.length === 0 ? (
          <p className="text-sm text-[#7D7874]">
            Nenhum certificado cadastrado ainda. Adicione um pela tela de edição do cliente.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-[#7D7874]">
                <th className="py-2">Cliente</th>
                <th className="py-2">Tipo</th>
                <th className="py-2">Vencimento</th>
                <th className="py-2">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEAE0]">
              {certificados.map((cert) => {
                const status = expiryStatus(cert.dataValidade);
                return (
                  <tr key={cert.id}>
                    <td className="py-2 text-[#24252A]">
                      {cert.client ? (
                        <Link href={`/clientes/${cert.client.id}`} className="hover:underline">
                          {cert.client.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 text-[#7D7874]">{TIPO_LABEL[cert.tipo] ?? cert.tipo}</td>
                    <td className="py-2 text-[#7D7874]">
                      {cert.dataValidade.toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      {cert.arquivoUrl && (
                        <a
                          href={`/api/certificados/${cert.id}/arquivo`}
                          className="text-xs text-[#3D3E40] hover:underline"
                        >
                          Baixar
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
