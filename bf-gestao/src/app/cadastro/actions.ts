"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";
import { createSession } from "@/lib/session";
import { isValidCPF } from "@/lib/cpf";

const SignupSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome completo." }),
  cpf: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => isValidCPF(value), { error: "CPF inválido." }),
  birthDate: z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), { error: "Data de nascimento inválida." })
    .refine((value) => new Date(value).getTime() < Date.now(), {
      error: "Data de nascimento não pode ser no futuro.",
    }),
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z.string().min(8, { error: "A senha deve ter pelo menos 8 caracteres." }),
});

export type SignupState = { error: string } | undefined;

export async function signup(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  const validated = SignupSchema.safeParse({
    name: formData.get("name"),
    cpf: formData.get("cpf"),
    birthDate: formData.get("birthDate"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const { name, cpf, birthDate, email, password } = validated.data;
  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        name,
        cpf,
        birthDate: new Date(birthDate),
        email,
        passwordHash,
        role: "COLABORADOR",
        active: true,
      },
    });
  } catch {
    return { error: "Já existe um cadastro com esse e-mail ou CPF." };
  }

  await createSession({ userId: user.id, role: user.role });
  redirect("/");
}
