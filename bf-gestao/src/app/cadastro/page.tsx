"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signup } from "./actions";
import { formatCPF } from "@/lib/cpf";
import { BrandMark } from "@/components/brand-mark";

export default function CadastroPage() {
  const [state, action, pending] = useActionState(signup, undefined);
  const [cpf, setCpf] = useState("");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F5EF] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandMark className="mb-3 h-24 w-24 text-[#7D7874] opacity-35" />
          <h1 className="text-xl font-bold text-[#3D3E40]">BF Gestão</h1>
          <p className="text-sm text-[#7D7874]">Gestão de Tarefas</p>
        </div>

        <div className="rounded-2xl bg-[#E3DFD3] p-8">
          <h2 className="text-lg font-medium text-[#3D3E40]">Criar conta</h2>
          <p className="mt-1 text-sm text-[#7D7874]">Primeiro acesso? Cadastre seus dados.</p>

          <form action={action} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm text-[#3D3E40]">
                Nome completo
              </label>
              <input
                id="name"
                name="name"
                required
                className="mt-1 w-full rounded-lg border border-[#D2CDBD] bg-[#EDE9DD] px-3 py-2 text-sm text-[#3D3E40] outline-none focus:border-[#959D90]"
              />
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm text-[#3D3E40]">
                CPF
              </label>
              <input
                id="cpf"
                name="cpf"
                required
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(event) => setCpf(formatCPF(event.target.value))}
                className="mt-1 w-full rounded-lg border border-[#D2CDBD] bg-[#EDE9DD] px-3 py-2 text-sm text-[#3D3E40] outline-none focus:border-[#959D90]"
              />
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-sm text-[#3D3E40]">
                Data de nascimento
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                required
                className="mt-1 w-full rounded-lg border border-[#D2CDBD] bg-[#EDE9DD] px-3 py-2 text-sm text-[#3D3E40] outline-none focus:border-[#959D90]"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-[#3D3E40]">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 w-full rounded-lg border border-[#D2CDBD] bg-[#EDE9DD] px-3 py-2 text-sm text-[#3D3E40] outline-none focus:border-[#959D90]"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-[#3D3E40]">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 w-full rounded-lg border border-[#D2CDBD] bg-[#EDE9DD] px-3 py-2 text-sm text-[#3D3E40] outline-none focus:border-[#959D90]"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-red-700" role="alert">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-[#959D90] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-[#87907F] disabled:opacity-60"
            >
              {pending ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-[#7D7874]">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-[#3D3E40] hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
