"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { lookupCnpj, saveClientFull } from "../actions";
import { formatDocument } from "@/lib/format";
import { CertificadoSection } from "./certificado-section";

type Partner = { name: string; cpf: string | null; ownershipPercent: number | null };
type Activity = { code: string; description: string; isPrimary: boolean };
type EmpresaOption = { id: string; name: string };

type ClientData = {
  id: string;
  name: string;
  personType: string;
  country: string;
  cnpj: string | null;
  cpf: string | null;
  tradeName: string | null;
  tipoAtividade: string | null;
  taxRegime: string | null;
  status: string;
  empresaId: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  partners: Partner[];
  activities: Activity[];
  certificados: {
    id: string;
    tipo: string;
    dataValidade: string;
    arquivoNomeOriginal: string | null;
    arquivoUrl: string | null;
  }[];
};

const inputClass =
  "mt-1 w-full rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]";
const labelClass = "block text-xs font-medium text-[#7D7874]";

export function ClientForm({ client, empresas }: { client: ClientData; empresas: EmpresaOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [name, setName] = useState(client.name);
  const [tradeName, setTradeName] = useState(client.tradeName ?? "");
  const [tipoAtividade, setTipoAtividade] = useState(client.tipoAtividade ?? "");
  const [taxRegime, setTaxRegime] = useState(client.taxRegime ?? "");
  const [status, setStatus] = useState(client.status);
  const [empresaId, setEmpresaId] = useState(client.empresaId ?? "");

  const [cep, setCep] = useState(client.cep ?? "");
  const [logradouro, setLogradouro] = useState(client.logradouro ?? "");
  const [numero, setNumero] = useState(client.numero ?? "");
  const [complemento, setComplemento] = useState(client.complemento ?? "");
  const [bairro, setBairro] = useState(client.bairro ?? "");
  const [municipio, setMunicipio] = useState(client.municipio ?? "");
  const [uf, setUf] = useState(client.uf ?? "");

  const [partners, setPartners] = useState<Partner[]>(
    client.partners.length > 0 ? client.partners : [{ name: "", cpf: "", ownershipPercent: null }],
  );
  const [activities, setActivities] = useState<Activity[]>(client.activities);

  async function handleImport() {
    if (!client.cnpj) return;
    setIsImporting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await lookupCnpj(client.cnpj);
      setTradeName(result.nomeFantasia ?? tradeName);
      setCep(result.cep ?? "");
      setLogradouro(result.logradouro ?? "");
      setNumero(result.numero ?? "");
      setComplemento(result.complemento ?? "");
      setBairro(result.bairro ?? "");
      setMunicipio(result.municipio ?? "");
      setUf(result.uf ?? "");
      setActivities(result.activities);
      if (result.partners.length > 0) {
        setPartners(
          result.partners.map((p) => ({ name: p.name, cpf: p.cpf, ownershipPercent: null })),
        );
      }
      setNotice(
        "Endereço, atividades e sócios importados da Receita Federal. CPF completo e percentual societário precisam ser completados manualmente.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível importar os dados do CNPJ.");
    } finally {
      setIsImporting(false);
    }
  }

  function updatePartner(index: number, field: keyof Partner, value: string) {
    setPartners((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              [field]: field === "ownershipPercent" ? (value === "" ? null : Number(value)) : value,
            }
          : p,
      ),
    );
  }

  function addPartner() {
    setPartners((prev) => [...prev, { name: "", cpf: "", ownershipPercent: null }]);
  }

  function removePartner(index: number) {
    setPartners((prev) => prev.filter((_, i) => i !== index));
  }

  function removeActivity(index: number) {
    setActivities((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await saveClientFull(client.id, {
          name,
          tradeName: tradeName || null,
          tipoAtividade: tipoAtividade || null,
          taxRegime: taxRegime || null,
          status: status as "ATIVO" | "INATIVO" | "SUSPENSO",
          empresaId: empresaId || null,
          cep: cep || null,
          logradouro: logradouro || null,
          numero: numero || null,
          complemento: complemento || null,
          bairro: bairro || null,
          municipio: municipio || null,
          uf: uf || null,
          partners,
          activities,
        });
        setNotice("Cliente salvo com sucesso.");
        router.refresh();
      } catch {
        setError("Não foi possível salvar o cliente.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#24252A]">Dados básicos</h2>
          {client.cnpj && client.country !== "US" && (
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting}
              className="rounded-lg bg-[#959D90] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#87907F] disabled:opacity-60"
            >
              {isImporting ? "Importando..." : "Importar do CNPJ"}
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Documento</label>
            <input value={formatDocument(client)} disabled className={`${inputClass} bg-[#F7F5EF]`} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
              <option value="SUSPENSO">Suspenso</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Razão social</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nome fantasia</label>
            <input value={tradeName} onChange={(e) => setTradeName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Tipo de atividade</label>
            <input
              value={tipoAtividade}
              onChange={(e) => setTipoAtividade(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Regime tributário</label>
            <input value={taxRegime} onChange={(e) => setTaxRegime(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Empresa responsável</label>
            <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} className={inputClass}>
              <option value="">Sem empresa definida</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
        <h2 className="text-sm font-bold text-[#24252A]">Endereço</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass}>CEP</label>
            <input value={cep} onChange={(e) => setCep(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Logradouro</label>
            <input value={logradouro} onChange={(e) => setLogradouro(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Número</label>
            <input value={numero} onChange={(e) => setNumero(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Complemento</label>
            <input value={complemento} onChange={(e) => setComplemento(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Bairro</label>
            <input value={bairro} onChange={(e) => setBairro(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Município</label>
            <input value={municipio} onChange={(e) => setMunicipio(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>UF</label>
            <input value={uf} onChange={(e) => setUf(e.target.value)} maxLength={2} className={inputClass} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
        <h2 className="text-sm font-bold text-[#24252A]">Atividades (CNAE)</h2>
        {activities.length === 0 ? (
          <p className="mt-2 text-sm text-[#7D7874]">
            Nenhuma atividade cadastrada. Use "Importar do CNPJ" para trazer da Receita Federal.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[#EFEAE0]">
            {activities.map((activity, index) => (
              <li key={`${activity.code}-${index}`} className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm text-[#24252A]">
                    {activity.code} — {activity.description}
                  </span>
                  {activity.isPrimary && (
                    <span className="ml-2 rounded-full bg-[#E5EEE1] px-2 py-0.5 text-xs text-[#4C7A46]">
                      Principal
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeActivity(index)}
                  className="text-xs text-[#7D7874] hover:text-red-600"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
        <h2 className="text-sm font-bold text-[#24252A]">Quadro societário</h2>
        <p className="mt-1 text-xs text-[#7D7874]">
          Nome do sócio pode vir automático da Receita. CPF completo e percentual societário são
          preenchidos manualmente.
        </p>

        <div className="mt-4 space-y-3">
          {partners.map((partner, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_180px_110px_auto]">
              <input
                placeholder="Nome do sócio"
                value={partner.name}
                onChange={(e) => updatePartner(index, "name", e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="CPF"
                value={partner.cpf ?? ""}
                onChange={(e) => updatePartner(index, "cpf", e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="% societário"
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={partner.ownershipPercent ?? ""}
                onChange={(e) => updatePartner(index, "ownershipPercent", e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removePartner(index)}
                className="mt-1 self-start text-xs text-[#7D7874] hover:text-red-600"
              >
                Remover
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addPartner}
          className="mt-4 flex items-center gap-1.5 rounded-lg border border-dashed border-[#D2CDBD] px-3 py-1.5 text-sm text-[#7D7874] hover:border-[#959D90] hover:text-[#3D3E40]"
        >
          <span>+</span> Adicionar sócio
        </button>
      </section>

      <CertificadoSection clientId={client.id} certificados={client.certificados} />

      {error && <p className="text-sm text-red-700">{error}</p>}
      {notice && !error && <p className="text-sm text-[#4C7A46]">{notice}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-[#3D3E40] px-4 py-2 text-sm font-medium text-white hover:bg-[#2E2F2C] disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}
