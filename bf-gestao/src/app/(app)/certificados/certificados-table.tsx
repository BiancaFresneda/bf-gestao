"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { expiryStatus, formatDateBR } from "@/lib/format";

const TIPO_LABEL: Record<string, string> = {
  E_CNPJ: "e-CNPJ",
  E_CPF: "e-CPF",
  NFE: "NF-e",
  OUTRO: "Outro",
};

type CertificadoRow = {
  id: string;
  tipo: string;
  dataValidade: string;
  arquivoUrl: string | null;
  client: { id: string; name: string } | null;
};

const SORT_OPTIONS = {
  vencimento_asc: "Vencimento — mais próximo primeiro",
  vencimento_desc: "Vencimento — mais distante primeiro",
  cliente: "Cliente (A-Z)",
} as const;
type SortKey = keyof typeof SORT_OPTIONS;

export function CertificadosTable({ certificados }: { certificados: CertificadoRow[] }) {
  const [sort, setSort] = useState<SortKey>("vencimento_asc");

  const sorted = useMemo(() => {
    const list = [...certificados];
    list.sort((a, b) => {
      if (sort === "cliente") return (a.client?.name ?? "").localeCompare(b.client?.name ?? "");
      const diff = new Date(a.dataValidade).getTime() - new Date(b.dataValidade).getTime();
      return sort === "vencimento_asc" ? diff : -diff;
    });
    return list;
  }, [certificados, sort]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
          className="rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm outline-none focus:border-[#959D90]"
        >
          {Object.entries(SORT_OPTIONS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span className="text-xs text-[#7D7874]">{certificados.length} certificado(s)</span>
      </div>

      <table className="mt-4 w-full text-left text-sm">
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
          {sorted.map((cert) => {
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
                <td className="py-2 text-[#7D7874]">{formatDateBR(cert.dataValidade)}</td>
                <td className="py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${status.className}`}>{status.label}</span>
                </td>
                <td className="py-2 text-right">
                  {cert.arquivoUrl && (
                    <a href={`/api/certificados/${cert.id}/arquivo`} className="text-xs text-[#3D3E40] hover:underline">
                      Baixar
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
