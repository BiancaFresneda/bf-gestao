"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await verifySession();
  if (session.role !== "ADMIN") {
    throw new Error("Apenas administradores podem gerenciar o cadastro de empresas.");
  }
}

const TAX_ID_TYPES = ["CNPJ", "EIN"] as const;

const EmpresaSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe a razão social." }),
  tradeName: z.string().optional(),
  country: z.string().trim().min(1, { error: "Informe o país." }),
  taxIdType: z.enum(TAX_ID_TYPES),
  taxId: z.string().optional(),
  inscricaoMunicipal: z.string().optional(),
  inscricaoEstadual: z.string().optional(),
  taxRegime: z.string().optional(),
  openingDate: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  postalCode: z.string().optional(),
  active: z.coerce.boolean(),
});

function parseOpeningDate(value: string | undefined): Date | null {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

function parseEmpresaFromFormData(formData: FormData) {
  return EmpresaSchema.parse({
    name: formData.get("name"),
    tradeName: formData.get("tradeName") || undefined,
    country: formData.get("country") || "BR",
    taxIdType: formData.get("taxIdType") || "CNPJ",
    taxId: formData.get("taxId") || undefined,
    inscricaoMunicipal: formData.get("inscricaoMunicipal") || undefined,
    inscricaoEstadual: formData.get("inscricaoEstadual") || undefined,
    taxRegime: formData.get("taxRegime") || undefined,
    openingDate: formData.get("openingDate") || undefined,
    addressLine1: formData.get("addressLine1") || undefined,
    addressLine2: formData.get("addressLine2") || undefined,
    city: formData.get("city") || undefined,
    stateProvince: formData.get("stateProvince") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    active: formData.get("active") === "on",
  });
}

export async function createEmpresa(_prevState: unknown, formData: FormData) {
  await requireAdmin();

  let data: z.infer<typeof EmpresaSchema>;
  try {
    data = parseEmpresaFromFormData(formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Dados inválidos." };
  }

  try {
    await prisma.empresa.create({
      data: {
        name: data.name,
        tradeName: data.tradeName || null,
        country: data.country,
        taxIdType: data.taxIdType,
        taxId: data.taxId || null,
        inscricaoMunicipal: data.inscricaoMunicipal || null,
        inscricaoEstadual: data.inscricaoEstadual || null,
        taxRegime: data.taxRegime || null,
        openingDate: parseOpeningDate(data.openingDate),
        addressLine1: data.addressLine1 || null,
        addressLine2: data.addressLine2 || null,
        city: data.city || null,
        stateProvince: data.stateProvince || null,
        postalCode: data.postalCode || null,
        active: data.active,
      },
    });
  } catch {
    return { error: "Já existe uma empresa cadastrada com esse CNPJ/EIN." };
  }

  revalidatePath("/configuracoes/empresas");
}

export async function updateEmpresa(empresaId: string, _prevState: unknown, formData: FormData) {
  await requireAdmin();

  let data: z.infer<typeof EmpresaSchema>;
  try {
    data = parseEmpresaFromFormData(formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Dados inválidos." };
  }

  try {
    await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        name: data.name,
        tradeName: data.tradeName || null,
        country: data.country,
        taxIdType: data.taxIdType,
        taxId: data.taxId || null,
        inscricaoMunicipal: data.inscricaoMunicipal || null,
        inscricaoEstadual: data.inscricaoEstadual || null,
        taxRegime: data.taxRegime || null,
        openingDate: parseOpeningDate(data.openingDate),
        addressLine1: data.addressLine1 || null,
        addressLine2: data.addressLine2 || null,
        city: data.city || null,
        stateProvince: data.stateProvince || null,
        postalCode: data.postalCode || null,
        active: data.active,
      },
    });
  } catch {
    return { error: "Já existe uma empresa cadastrada com esse CNPJ/EIN." };
  }

  revalidatePath("/configuracoes/empresas");
  return { error: null };
}

export async function toggleEmpresaActive(empresaId: string, active: boolean) {
  await requireAdmin();
  await prisma.empresa.update({ where: { id: empresaId }, data: { active } });
  revalidatePath("/configuracoes/empresas");
}
