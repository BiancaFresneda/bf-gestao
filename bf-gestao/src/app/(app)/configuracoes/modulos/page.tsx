import { ModuleHeader } from "@/components/module-header";

export default function ModulosPage() {
  return (
    <div>
      <ModuleHeader
        title="Módulos"
        subtitle="Defina os módulos/serviços oferecidos pelo escritório, usados no cadastro do cliente."
        backHref="/configuracoes"
        backLabel="Voltar para Configurações"
      />
      <div className="p-8">
        <div className="rounded-xl border border-dashed border-[#D2CDBD] bg-white p-10 text-center text-sm text-[#7D7874]">
          Esse módulo ainda não foi construído — chega em uma fase futura.
        </div>
      </div>
    </div>
  );
}
