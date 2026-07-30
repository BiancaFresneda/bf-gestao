"use client";

import { useActionState } from "react";
import { saveCertificado, deleteCertificado } from "./certificado-actions";
import { expiryStatus } from "@/lib/format";

const inputClass =
  "mt-1 w-full rounded-lg border border-[#E1DBCC] px-3 py-2 text-sm text-[#24252A] outline-none focus:border-[#959D90]";
const labelClass = "block text-xs font-medium text-[#7D7874]";

const TIPO_LABEL: Record<string, string> = {
  E_CNPJ: "e-CNPJ",
  E_CPF: "e-CPF",
  NFE: "NF-e",
  OUTRO: "Outro",
};

type Certificado = {
  id: string;
  tipo: string;
  dataValidade: string;
  arquivoNomeOriginal: string | null;
  arquivoUrl: string | null;
};

export function CertificadoSection({
  clientId,
  certificados,
}: {
  clientId: string;
  certificados: Certificado[];
}) {
  const [state, formAction, pending] = useActionState(saveCertificado.bind(null, clientId), undefined);

  return (
    <section className="rounded-xl border border-[#E1DBCC] bg-white p-6">
      <h2 className="text-sm font-bold text-[#24252A]">Certificado digital</h2>
      <p className="mt-1 text-xs text-[#7D7874]">
        Envie o arquivo junto com a senha e o vencimento é lido automaticamente do próprio
        certificado — só precisa digitar a data se não tiver o arquivo agora. A senha é
        armazenada criptografada. Cada envio cria um novo registro — o histórico fica preservado.
      </p>

      {certificados.length > 0 && (
        <ul className="mt-4 divide-y divide-[#EFEAE0]">
          {certificados.map((cert) => {
            const status = expiryStatus(cert.dataValidade);
            return (
              <li key={cert.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#24252A]">{TIPO_LABEL[cert.tipo] ?? cert.tipo}</span>
                  <span className="text-xs text-[#7D7874]">
                    Vence em {new Date(cert.dataValidade).toLocaleDateString("pt-BR")}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${status.className}`}>{status.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {cert.arquivoUrl && (
                    <a
                      href={`/api/certificados/${cert.id}/arquivo`}
                      className="text-xs text-[#3D3E40] hover:underline"
                    >
                      Baixar arquivo
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteCertificado(clientId, cert.id)}
                    className="text-xs text-[#7D7874] hover:text-red-600"
                  >
                    Remover
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form action={formAction} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div>
          <label className={labelClass}>Tipo</label>
          <select name="tipo" defaultValue="E_CNPJ" className={inputClass}>
            <option value="E_CNPJ">e-CNPJ</option>
            <option value="E_CPF">e-CPF</option>
            <option value="NFE">NF-e</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Arquivo</label>
          <input type="file" name="arquivo" className={`${inputClass} py-1.5`} />
        </div>
        <div>
          <label className={labelClass}>Senha</label>
          <input type="password" name="senha" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Vencimento (opcional com arquivo)</label>
          <input type="date" name="dataValidade" className={inputClass} />
        </div>

        <div className="sm:col-span-4">
          {state?.error && <p className="mb-2 text-sm text-red-700">{state.error}</p>}
          {state?.notice && <p className="mb-2 text-sm text-[#4C7A46]">{state.notice}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[#959D90] px-4 py-2 text-sm font-medium text-white hover:bg-[#87907F] disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar certificado"}
          </button>
        </div>
      </form>
    </section>
  );
}
