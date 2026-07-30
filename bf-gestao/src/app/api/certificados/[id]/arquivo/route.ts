import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/file-storage";

export async function GET(_request: Request, context: RouteContext<"/api/certificados/[id]/arquivo">) {
  await verifySession();
  const { id } = await context.params;

  const certificado = await prisma.certificado.findUnique({ where: { id } });
  if (!certificado?.arquivoUrl) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  const buffer = await readStoredFile(certificado.arquivoUrl);
  const filename = certificado.arquivoNomeOriginal ?? "certificado";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
