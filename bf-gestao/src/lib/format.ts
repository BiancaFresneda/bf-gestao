export function formatCnpj(value: string): string {
  const d = value.replace(/\D/g, "").padEnd(14, "");
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

export function formatCpf(value: string): string {
  const d = value.replace(/\D/g, "").padEnd(11, "");
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export function formatDocument(client: { personType: string; cnpj?: string | null; cpf?: string | null }): string {
  if (client.personType === "PJ" && client.cnpj) return formatCnpj(client.cnpj);
  if (client.cpf) return formatCpf(client.cpf);
  return "—";
}

export function expiryStatus(dataValidade: string | Date) {
  const days = Math.ceil((new Date(dataValidade).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) {
    return { label: `Vencido há ${Math.abs(days)}d`, className: "bg-[#F6DFDB] text-[#B3453A]" };
  }
  if (days <= 30) {
    return { label: `Vence em ${days}d`, className: "bg-[#F5E7D3] text-[#B4762A]" };
  }
  return { label: `Vence em ${days}d`, className: "bg-[#E5EEE1] text-[#4C7A46]" };
}
