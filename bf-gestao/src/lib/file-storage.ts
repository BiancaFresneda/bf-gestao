import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function uploadsRoot() {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOADS_DIR ?? "./uploads");
}

// Salva um arquivo enviado em disco, fora da pasta `public` (nunca fica acessível
// diretamente por URL) — a leitura só acontece via rota protegida por sessão.
export async function saveUploadedFile(file: File, subdir: string) {
  const dir = path.join(uploadsRoot(), subdir);
  await mkdir(dir, { recursive: true });

  const safeExt = path.extname(file.name).slice(0, 10).replace(/[^a-zA-Z0-9.]/g, "");
  const storedName = `${randomBytes(16).toString("hex")}${safeExt}`;
  const storedPath = path.join(subdir, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsRoot(), storedPath), buffer);

  return { storedPath: storedPath.replace(/\\/g, "/"), originalName: file.name };
}

export async function readStoredFile(storedPath: string) {
  return readFile(path.join(uploadsRoot(), storedPath));
}
