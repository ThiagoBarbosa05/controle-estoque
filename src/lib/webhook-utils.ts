import crypto from "crypto";

/**
 * Valida a assinatura HMAC do webhook do Bling
 * @param payload - Body da requisição como string
 * @param signature - Assinatura do header X-Bling-Signature-256
 * @param clientSecret - Client secret do aplicativo Bling
 * @returns boolean indicando se a assinatura é válida
 */
export function validateBlingSignature(
  payload: string,
  signature: string,
  clientSecret: string
): boolean {
  try {
    // Remove o prefixo 'sha256=' se presente
    const cleanSignature = signature.startsWith("sha256=")
      ? signature.substring(7)
      : signature;

    // Gera o hash HMAC usando o payload e o client secret
    const expectedSignature = crypto
      .createHmac("sha256", clientSecret)
      .update(payload, "utf8")
      .digest("hex");

    // Compara as assinaturas de forma segura (timing-safe)
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch (error) {
    console.error("Error validating Bling signature:", error);
    return false;
  }
}

/**
 * Extrai e valida headers do webhook
 * @param headers - Headers da requisição
 * @returns Objeto com headers validados
 */
export function extractWebhookHeaders(
  headers: Record<string, string | string[] | undefined>
): {
  signature?: string;
  userAgent?: string;
  contentType?: string;
  isValidContentType: boolean;
} {
  const signature =
    headers["x-bling-signature-256"] || headers["X-Bling-Signature-256"];
  const userAgent = headers["user-agent"] || headers["User-Agent"];
  const contentType = headers["content-type"] || headers["Content-Type"];

  // Valida se o content-type é JSON
  const isValidContentType =
    (typeof contentType === "string" &&
      contentType.includes("application/json")) ||
    false;

  return {
    signature: typeof signature === "string" ? signature : undefined,
    userAgent: typeof userAgent === "string" ? userAgent : undefined,
    contentType: typeof contentType === "string" ? contentType : undefined,
    isValidContentType,
  };
}

/**
 * Parseia data do formato Bling para Date object
 * @param dateString - Data no formato "2024-09-27 11:24:56"
 * @returns Date object ou null se inválida
 */
export function parseBlingDate(dateString: string): Date | null {
  try {
    // Formato esperado: "2024-09-27 11:24:56"
    const date = new Date(dateString.replace(" ", "T") + "Z");
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Gera um hash único para identificar tentativas duplicadas
 * @param eventId - ID único do evento
 * @param resourceId - ID do recurso
 * @returns String hash para identificação
 */
export function generateEventHash(eventId: string, resourceId: string): string {
  return crypto
    .createHash("sha256")
    .update(`${eventId}-${resourceId}`)
    .digest("hex");
}
