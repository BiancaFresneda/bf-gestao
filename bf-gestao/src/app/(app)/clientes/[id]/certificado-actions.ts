"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";
import { saveUploadedFile } from "@/lib/file-storage";

const CertificadoSchema = z.object({
  tipo: z.enum(["E_CNPJ", "E_CPF", "NFE", "OUTRO"]),
  dataValidade: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), {
    error: "Informe uma data de vencimento válida.",
  }),
  senha: z.string().optional(),
});

export type CertificadoFormState = { error: string } | undefined;

export async function saveCertificado(
  clientId: string,
  _prevState: CertificadoFormState,
  formData: FormData,
): Promise<CertificadoFormState> {
  await verifySession();

  const validated = CertificadoSchema.safeParse({
    tipo: formData.get("tipo"),
    dataValidade: formData.get("dataValidade"),
    senha: formData.get("senha") || undefined,
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const { tipo, dataValidade, senha } = validated.data;
  const file = formData.get("arquivo");

  let arquivoUrl: string | undefined;
  let arquivoNomeOriginal: string | undefined;
  if (file instanceof File && file.size > 0) {
    const saved = await saveUploadedFile(file, `certificados/${clientId}`);
    arquivoUrl = saved.storedPath;
    arquivoNomeOriginal = saved.originalName;
  }

  await prisma.certificado.create({
    data: {
      clientId,
      tipo,
      dataValidade: new Date(dataValidade),
      arquivoUrl,
      arquivoNomeOriginal,
      senhaCriptografada: senha ? encryptSecret(senha) : undefined,
    },
  });

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/certificados");
}

export async function deleteCertificado(clientId: string, certificadoId: string) {
  await verifySession();
  await prisma.certificado.delete({ where: { id: certificadoId } });
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/certificados");
}
