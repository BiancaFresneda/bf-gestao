"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";
import { saveUploadedFile } from "@/lib/file-storage";
import { extractCertificateExpiry } from "@/lib/certificate";
import { formatDateBR } from "@/lib/format";

const CertificadoSchema = z.object({
  tipo: z.enum(["E_CNPJ", "E_CPF", "NFE", "OUTRO"]),
  senha: z.string().min(1, { error: "Informe a senha do certificado." }),
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
    senha: formData.get("senha"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const { tipo, senha } = validated.data;
  const file = formData.get("arquivo");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Envie o arquivo do certificado (.pfx)." };
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  let expiry: Date;
  try {
    expiry = extractCertificateExpiry(fileBuffer, senha);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Não foi possível ler a data do certificado.",
    };
  }

  const saved = await saveUploadedFile(file, `certificados/${clientId}`);

  await prisma.certificado.create({
    data: {
      clientId,
      tipo,
      dataValidade: expiry,
      arquivoUrl: saved.storedPath,
      arquivoNomeOriginal: saved.originalName,
      senhaCriptografada: encryptSecret(senha),
    },
  });

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/certificados");

  return { notice: `Certificado salvo. Vencimento detectado automaticamente no arquivo: ${formatDateBR(expiry)}.` };
}

export async function deleteCertificado(clientId: string, certificadoId: string) {
  await verifySession();
  await prisma.certificado.delete({ where: { id: certificadoId } });
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/certificados");
}
