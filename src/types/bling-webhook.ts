// Tipos para os webhooks do Bling baseados na documentação oficial

export interface BlingWebhookEvent {
  eventId: string;
  date: string; // ISO 8601 format
  version: string; // ex: "v1"
  event: string; // ex: "invoice.created", "invoice.updated", "invoice.deleted"
  companyId: string;
  data: InvoiceWebhookData;
}

export interface InvoiceWebhookData {
  id: number;
  tipo: number; // 1 = Entrada, 2 = Saída
  situacao: number; // Situação da nota fiscal
  numero: string;
  dataEmissao: string; // "2024-09-27 11:24:56"
  dataOperacao: string; // "2024-09-27 11:00:00"
  contato?: {
    id: number;
  };
  naturezaOperacao?: {
    id: number;
  };
  loja?: {
    id: number;
  };
  valorTotal?: number;
}

export interface InvoiceWebhookDeletedData {
  id: number;
}

// Tipos para validação de assinatura HMAC
export interface WebhookHeaders {
  "x-bling-signature-256"?: string;
  "user-agent"?: string;
  "content-type"?: string;
}

// Tipos para logs
export type WebhookStatus = "success" | "error";
export type WebhookEventType =
  | "invoice.created"
  | "invoice.updated"
  | "invoice.deleted"
  | "consumer_invoice.created"
  | "consumer_invoice.updated"
  | "consumer_invoice.deleted";

export interface WebhookProcessingResult {
  success: boolean;
  statusCode: number;
  errorMessage?: string;
  errorStack?: string;
  processingTime: number;
  resourceId?: string;
}

// Tipos para configuração
export interface WebhookConfig {
  clientSecret: string;
  maxRetries: number;
  timeoutMs: number;
}
