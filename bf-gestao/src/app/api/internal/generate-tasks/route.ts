import { NextResponse } from "next/server";
import { generateTasks } from "@/lib/task-generation/generate";

// Chamado pelo cron do docker-compose.prod.yml (container task-generation-cron) várias
// vezes ao dia — a geração é idempotente, então rodar de mais é seguro e serve de
// autorrecuperação caso uma execução anterior tenha falhado.
export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const result = await generateTasks("CRON");
  return NextResponse.json(result);
}
