import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/file-storage";

export async function GET(_request: Request, context: RouteContext<"/api/tarefas/[id]/anexo">) {
  await verifySession();
  const { id } = await context.params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task?.arquivoUrl) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  const buffer = await readStoredFile(task.arquivoUrl);
  const filename = task.arquivoNomeOriginal ?? "anexo";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
