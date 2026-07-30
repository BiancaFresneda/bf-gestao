"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";
import { saveUploadedFile } from "@/lib/file-storage";
import { extractCertificateExpiry } from "@/lib/certificate";

const CertificadoSchema = z.object({
  tipo: z.enum(["E_CNPJ", "E_CPF", "NFE", "OUTRO"]),
  dataValidade: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), {
      error: "Data de vencimento inválida.",
    }),
  senha: z.string().optional(),
});

export type CertificadoFormState = { error: string; notice?: never } | { notice: string; error?: never } | undefined;

export async function saveCertificado(
  clientId: string,
  _prevState: CertificadoFormState,
  formData: FormData,
): Promise<CertificadoFormState> {
  await verifySession();

  const validated = CertificadoSchema.safeParse({
    tipo: formData.get("tipo"),
    dataValidade: formData.get("dataValidade") || undefined,
    senha: formData.get("senha") || undefined,
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const { tipo, dataValidade, senha } = validated.data;
  const file = formData.get("arquivo");

  let arquivoUrl: string | undefined;
  let arquivoNomeOriginal: string | undefined;
  let fileBuffer: Buffer | undefined;

  if (file instanceof File && file.size > 0) {
    fileBuffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveUploadedFile(file, `certificados/${clientId}`);
    arquivoUrl = saved.storedPath;
    arquivoNomeOriginal = saved.originalName;
  }

  let finalExpiry: Date | undefined;
  let notice: string | undefined;

  if (fileBuffer && senha) {
    try {
      finalExpiry = extractCertificateExpiry(fileBuffer, senha);
      notice = `Certificado salvo. Vencimento detectado automaticamente no arquivo: ${finalExpiry.toLocaleDateString("pt-BR")}.`;
    } catch (error) {
      if (!dataValidade) {
        return {
          error: error instanceof Error ? error.message : "Não foi possível ler a data do certificado.",
        };
      }
    }
  }

  if (!finalExpiry) {
    if (!dataValidade) {
      return {
        error:
          "Informe o arquivo junto com a senha (para detectar o vencimento automaticamente) ou preencha a data de vencimento manualmente.",
      };
    }
    finalExpiry = new Date(dataValidade);
  }

  await prisma.certificado.create({
    data: {
      clientId,
      tipo,
      dataValidade: finalExpiry,
      arquivoUrl,
      arquivoNomeOriginal,
      senhaCriptografada: senha ? encryptSecret(senha) : undefined,
    },
  });

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/certificados");

  return notice ? { notice } : undefined;
}

export async function deleteCertificado(clientId: string, certificadoId: string) {
  await verifySession();
  await prisma.certificado.delete({ where: { id: certificadoId } });
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/certificados");
}
