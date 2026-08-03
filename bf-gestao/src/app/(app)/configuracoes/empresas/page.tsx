import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ModuleHeader } from "@/components/module-header";
import { EmpresaForm } from "./empresa-form";
import { EmpresaRow } from "./empresa-row";

export default async function EmpresasPage() {
  const session = await verifySession();

  if (session.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#24252A]">Empresas</h1>
        <p className="mt-2 text-sm text-[#7D7874]">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  const empresas = await prisma.empresa.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <ModuleHeader
        title="Empresas"
        subtitle="Cadastro das empresas do grupo BF (não confundir com o cadastro de Clientes)."
        backHref="/configuracoes"
        backLabel="Voltar para Configurações"
      />

      <div className="p-8">
        <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#24252A]">Empresas cadastradas</h2>
          <div className="mt-4">
            <EmpresaForm />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-[#7D7874]">
                  <th className="py-2">Empresa</th>
                  <th className="py-2">País</th>
                  <th className="py-2">Documento</th>
                  <th className="py-2">Endereço</th>
                  <th className="py-2">Status</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE0]">
                {empresas.map((empresa) => (
                  <EmpresaRow
                    key={empresa.id}
                    empresa={{
                      id: empresa.id,
                      name: empresa.name,
                      tradeName: empresa.tradeName,
                      country: empresa.country,
                      taxIdType: empresa.taxIdType,
                      taxId: empresa.taxId,
                      inscricaoMunicipal: empresa.inscricaoMunicipal,
                      inscricaoEstadual: empresa.inscricaoEstadual,
                      taxRegime: empresa.taxRegime,
                      openingDate: empresa.openingDate ? empresa.openingDate.toISOString() : null,
                      addressLine1: empresa.addressLine1,
                      addressLine2: empresa.addressLine2,
                      city: empresa.city,
                      stateProvince: empresa.stateProvince,
                      postalCode: empresa.postalCode,
                      active: empresa.active,
                    }}
                  />
                ))}
                {empresas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-[#7D7874]">
                      Nenhuma empresa cadastrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
