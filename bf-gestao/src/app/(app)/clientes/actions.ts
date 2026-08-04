"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const NewClientSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome ou razão social." }),
  country: z.enum(["BR", "US"]),
  personType: z.enum(["PJ", "PF"]),
  document: z.string().optional(),
  empresaId: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().optional(),
});

// País decide qual documento o cliente usa — BR segue CNPJ/CPF, EUA usa EIN (pessoa
// jurídica) ou SSN (pessoa física). Isso precisa ser definido já na criação porque muda
// tanto o rótulo/máscara do campo quanto a quantidade de dígitos esperada.
function documentSpec(country: "BR" | "US", personType: "PJ" | "PF") {
  if (country === "US") {
    return personType === "PJ"
      ? { length: 9, label: "EIN" }
      : { length: 9, label: "SSN" };
  }
  return personType === "PJ" ? { length: 14, label: "CNPJ" } : { length: 11, label: "CPF" };
}

// Cadastro mínimo pra criar o registro central de Client — como Client é a entidade
// referenciada por Tarefas, Certificados, Contratos etc., o cliente criado aqui já
// aparece em todos esses módulos automaticamente. Endereço, sócios, atividades e
// certificados são completados na tela de edição logo em seguida.
export async function createClient(_prevState: unknown, formData: FormData) {
  await verifySession();

  const parsed = NewClientSchema.safeParse({
    name: formData.get("name"),
    country: formData.get("country") || "BR",
    personType: formData.get("personType") || "PJ",
    document: formData.get("document") || undefined,
    empresaId: formData.get("empresaId") || undefined,
    cep: formData.get("cep") || undefined,
    logradouro: formData.get("logradouro") || undefined,
    numero: formData.get("numero") || undefined,
    complemento: formData.get("complemento") || undefined,
    bairro: formData.get("bairro") || undefined,
    municipio: formData.get("municipio") || undefined,
    uf: formData.get("uf") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { name, country, personType, document, empresaId, cep, logradouro, numero, complemento, bairro, municipio, uf } =
    parsed.data;
  const digits = document ? document.replace(/\D/g, "") : "";
  const spec = documentSpec(country, personType);
  if (digits && digits.length !== spec.length) {
    return { error: `${spec.label} inválido — deve ter ${spec.length} dígitos.` };
  }

  let client;
  try {
    client = await prisma.client.create({
      data: {
        name,
        country,
        personType,
        cnpj: personType === "PJ" && digits ? digits : null,
        cpf: personType === "PF" && digits ? digits : null,
        empresaId: empresaId || null,
        cep: cep || null,
        logradouro: logradouro || null,
        numero: numero || null,
        complemento: complemento || null,
        bairro: bairro || null,
        municipio: municipio || null,
        uf: uf ? uf.trim().toUpperCase() : null,
      },
    });
  } catch {
    return { error: "Já existe um cliente cadastrado com esse documento." };
  }

  revalidatePath("/clientes");
  redirect(`/clientes/${client.id}`);
}

export type CnpjLookupResult = {
  razaoSocial: string;
  nomeFantasia: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  activities: { code: string; description: string; isPrimary: boolean }[];
  partners: { name: string; cpf: string | null; qualification: string | null }[];
};

// Consulta pública de dados de CNPJ via BrasilAPI — fonte é a mesma base aberta da
// Receita Federal, mas sem depender do portal interativo (que tem captcha e não é
// feito para acesso automatizado). CPF do sócio vem sempre mascarado pela Receita;
// percentual societário não é dado público, precisa ser completado manualmente.
export async function lookupCnpj(cnpj: string): Promise<CnpjLookupResult> {
  await verifySession();

  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) {
    throw new Error("CNPJ inválido.");
  }

  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
    headers: {
      "User-Agent": "BF-Gestao/1.0 (+https://bfservicoscontabeis.com)",
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("CNPJ não encontrado na base da Receita Federal.");
  }

  const data = await response.json();

  const activities: CnpjLookupResult["activities"] = [];
  if (data.cnae_fiscal) {
    activities.push({
      code: String(data.cnae_fiscal),
      description: data.cnae_fiscal_descricao ?? "",
      isPrimary: true,
    });
  }
  for (const secondary of data.cnaes_secundarios ?? []) {
    activities.push({
      code: String(secondary.codigo),
      description: secondary.descricao ?? "",
      isPrimary: false,
    });
  }

  const partners: CnpjLookupResult["partners"] = (data.qsa ?? []).map(
    (socio: { nome_socio?: string; cnpj_cpf_do_socio?: string; qualificacao_socio?: string }) => ({
      name: socio.nome_socio ?? "",
      cpf: socio.cnpj_cpf_do_socio ?? null,
      qualification: socio.qualificacao_socio ?? null,
    }),
  );

  return {
    razaoSocial: data.razao_social ?? "",
    nomeFantasia: data.nome_fantasia ?? null,
    cep: data.cep ?? null,
    logradouro: data.logradouro ?? null,
    numero: data.numero ?? null,
    complemento: data.complemento ?? null,
    bairro: data.bairro ?? null,
    municipio: data.municipio ?? null,
    uf: data.uf ?? null,
    activities,
    partners,
  };
}

export type SaveClientInput = {
  name: string;
  tradeName: string | null;
  tipoAtividade: string | null;
  taxRegime: string | null;
  status: "ATIVO" | "INATIVO" | "SUSPENSO";
  empresaId: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  partners: { name: string; cpf: string | null; ownershipPercent: number | null }[];
  activities: { code: string; description: string; isPrimary: boolean }[];
};

export async function saveClientFull(clientId: string, input: SaveClientInput) {
  await verifySession();

  await prisma.$transaction(async (tx) => {
    await tx.client.update({
      where: { id: clientId },
      data: {
        name: input.name,
        tradeName: input.tradeName,
        tipoAtividade: input.tipoAtividade,
        taxRegime: input.taxRegime,
        status: input.status,
        empresaId: input.empresaId,
        cep: input.cep,
        logradouro: input.logradouro,
        numero: input.numero,
        complemento: input.complemento,
        bairro: input.bairro,
        municipio: input.municipio,
        uf: input.uf,
      },
    });

    await tx.clientPartner.deleteMany({ where: { clientId } });
    const partners = input.partners.filter((p) => p.name.trim().length > 0);
    if (partners.length > 0) {
      await tx.clientPartner.createMany({
        data: partners.map((p) => ({
          clientId,
          name: p.name,
          cpf: p.cpf,
          ownershipPercent: p.ownershipPercent,
        })),
      });
    }

    await tx.clientActivity.deleteMany({ where: { clientId } });
    if (input.activities.length > 0) {
      await tx.clientActivity.createMany({
        data: input.activities.map((a) => ({
          clientId,
          code: a.code,
          description: a.description,
          isPrimary: a.isPrimary,
        })),
      });
    }
  });

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
}
