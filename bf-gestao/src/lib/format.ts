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

// Usa os componentes UTC da data, nunca o fuso local de exibição — essas datas são
// pontos de calendário (venceu tal dia, prazo é tal dia), não instantes exatos. Formatar
// pelo fuso local (ex.: America/Sao_Paulo, UTC-3) faria meia-noite UTC "voltar" um dia.
export function formatDateBR(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

// Só a chave mensal ("2026-07") tem exibição amigável definida; demais periodicidades
// (semanal "2026-W03", trimestral "2026-Q1", semestral "2026-S1", anual "2026") são
// exibidas como estão, pois já são autoexplicativas.
export function formatCompetenciaKey(key: string): string {
  const match = key.match(/^(\d{4})-(\d{2})$/);
  if (!match) return key;
  const [, year, month] = match;
  return `${month}/${year}`;
}

export function expiryStatus(dataValidade: string | Date) {
  const isExpired = new Date(dataValidade).getTime() < Date.now();
  if (isExpired) {
    return { label: "Vencido", className: "bg-[#F6DFDB] text-[#B3453A]" };
  }
  return { label: "Vigente", className: "bg-[#E5EEE1] text-[#4C7A46]" };
}
