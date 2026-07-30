import "server-only";
import forge from "node-forge";

// Lê a data de vencimento embutida no próprio arquivo do certificado (.pfx/.p12),
// evitando digitação manual. Precisa da senha porque o arquivo PKCS#12 é criptografado.
export function extractCertificateExpiry(fileBuffer: Buffer, password: string): Date {
  let p12: forge.pkcs12.Pkcs12Pfx;
  try {
    const p12Der = forge.util.createBuffer(fileBuffer.toString("binary"));
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
  } catch {
    throw new Error(
      "Não foi possível abrir o certificado com a senha informada. Confira a senha ou informe a data de vencimento manualmente.",
    );
  }

  for (const safeContents of p12.safeContents) {
    for (const safeBag of safeContents.safeBags) {
      if (safeBag.type === forge.pki.oids.certBag && safeBag.cert) {
        return safeBag.cert.validity.notAfter;
      }
    }
  }

  throw new Error(
    "Não foi possível encontrar a data de vencimento dentro do arquivo. Informe manualmente.",
  );
}
