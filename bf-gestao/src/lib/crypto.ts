import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Criptografia simétrica (AES-256-GCM) para segredos que precisam ser recuperados
// depois (ex.: senha de certificado digital) — nunca usar para senhas de login,
// que devem ser hasheadas (ver src/lib/passwords.ts), não criptografadas.

function getKey() {
  const secret = process.env.CERTIFICATE_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("CERTIFICATE_ENCRYPTION_KEY não configurado");
  }
  const key = Buffer.from(secret, "base64");
  if (key.length !== 32) {
    throw new Error("CERTIFICATE_ENCRYPTION_KEY precisa ter 32 bytes (gerar com: openssl rand -base64 32)");
  }
  return key;
}

export function encryptSecret(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((buf) => buf.toString("base64")).join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB64, authTagB64, encryptedB64] = payload.split(".");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
