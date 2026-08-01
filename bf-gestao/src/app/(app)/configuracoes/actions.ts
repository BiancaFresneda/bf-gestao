"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";

async function requireAdmin() {
  const session = await verifySession();
  if (session.role !== "ADMIN") {
    throw new Error("Apenas administradores podem gerenciar departamentos e usuários.");
  }
}

const DepartmentSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe um nome com pelo menos 2 caracteres." }),
});

export async function createDepartment(_prevState: unknown, formData: FormData) {
  await requireAdmin();

  const validated = DepartmentSchema.safeParse({ name: formData.get("name") });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await prisma.department.create({ data: { name: validated.data.name } });
  } catch {
    return { error: "Já existe um departamento com esse nome." };
  }

  revalidatePath("/configuracoes/usuarios");
}

export async function updateDepartment(departmentId: string, _prevState: unknown, formData: FormData) {
  await requireAdmin();

  const validated = DepartmentSchema.safeParse({ name: formData.get("name") });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await prisma.department.update({ where: { id: departmentId }, data: { name: validated.data.name } });
  } catch {
    return { error: "Já existe um departamento com esse nome." };
  }

  revalidatePath("/configuracoes/usuarios");
  return { error: null };
}

export async function deleteDepartment(departmentId: string) {
  await requireAdmin();

  try {
    await prisma.department.delete({ where: { id: departmentId } });
  } catch {
    throw new Error(
      "Não é possível remover: existem usuários ou tarefas vinculados a este departamento.",
    );
  }

  revalidatePath("/configuracoes/usuarios");
}

// Datas de nascimento são âncoras de calendário (o aniversário é sempre no mesmo dia,
// não um instante) — parseadas em UTC meia-noite, igual às demais datas de calendário
// do sistema (ver formatDateBR em src/lib/format.ts).
function parseBirthDate(value: string | undefined): Date | null {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

const UserSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome completo." }),
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z.string().min(8, { error: "A senha deve ter pelo menos 8 caracteres." }),
  role: z.enum(["ADMIN", "COLABORADOR"]),
  departmentId: z.string().optional(),
  birthDate: z.string().optional(),
});

export async function createUser(_prevState: unknown, formData: FormData) {
  await requireAdmin();

  const validated = UserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    departmentId: formData.get("departmentId") || undefined,
    birthDate: formData.get("birthDate") || undefined,
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { name, email, password, role, departmentId, birthDate } = validated.data;
  const passwordHash = await hashPassword(password);

  try {
    await prisma.user.create({
      data: { name, email, passwordHash, role, departmentId, birthDate: parseBirthDate(birthDate) },
    });
  } catch {
    return { error: "Já existe um usuário com esse e-mail." };
  }

  revalidatePath("/configuracoes/usuarios");
}

const UserUpdateSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome completo." }),
  email: z.email({ error: "Informe um e-mail válido." }),
  role: z.enum(["ADMIN", "COLABORADOR"]),
  departmentId: z.string().optional(),
  birthDate: z.string().optional(),
  password: z.union([z.string().min(8, { error: "A senha deve ter pelo menos 8 caracteres." }), z.literal("")]).optional(),
});

export async function updateUser(userId: string, _prevState: unknown, formData: FormData) {
  await requireAdmin();

  const validated = UserUpdateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    departmentId: formData.get("departmentId") || undefined,
    birthDate: formData.get("birthDate") || undefined,
    password: formData.get("password") || undefined,
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { name, email, role, departmentId, birthDate, password } = validated.data;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role,
        departmentId: departmentId ?? null,
        birthDate: parseBirthDate(birthDate),
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
    });
  } catch {
    return { error: "Já existe um usuário com esse e-mail." };
  }

  revalidatePath("/configuracoes/usuarios");
  return { error: null };
}

export async function toggleUserActive(userId: string, active: boolean) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/configuracoes/usuarios");
}
