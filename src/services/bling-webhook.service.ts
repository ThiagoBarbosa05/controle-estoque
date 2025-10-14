import { db } from "@/db";
import { invoices, webhookLogs } from "@/db/schema";
import type {
  BlingWebhookEvent,
  InvoiceWebhookData,
  InvoiceWebhookDeletedData,
  WebhookProcessingResult,
  WebhookEventType,
} from "@/types/bling-webhook";
import {
  validateBlingSignature,
  extractWebhookHeaders,
  parseBlingDate,
} from "@/lib/webhook-utils";
import { eq, and } from "drizzle-orm";

export class BlingWebhookService {
  private clientSecret: string;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(config: {
    clientSecret: string;
    maxRetries?: number;
    timeoutMs?: number;
  }) {
    this.clientSecret = config.clientSecret;
    this.maxRetries = config.maxRetries ?? 3;
    this.timeoutMs = config.timeoutMs ?? 5000;
  }

  /**
   * Processa um webhook do Bling
   * @param body - Body da requisição como string
   * @param headers - Headers da requisição
   * @param ipAddress - IP de origem da requisição
   * @param retryAttempt - Número da tentativa (default: 0)
   * @returns Promise com resultado do processamento
   */
  async processWebhook(
    body: string,
    headers: Record<string, string | string[] | undefined>,
    ipAddress?: string,
    retryAttempt: number = 0
  ): Promise<WebhookProcessingResult> {
    const startTime = Date.now();
    let webhookEvent: BlingWebhookEvent | undefined;
    let resourceId: string | undefined;

    try {
      // Extrai e valida headers
      const { signature, userAgent, isValidContentType } =
        extractWebhookHeaders(headers);

      if (!isValidContentType) {
        throw new Error("Invalid Content-Type. Expected application/json");
      }

      if (!signature) {
        throw new Error("Missing X-Bling-Signature-256 header");
      }

      // Valida assinatura HMAC
      const isSignatureValid = validateBlingSignature(
        body,
        signature,
        this.clientSecret
      );
      if (!isSignatureValid) {
        throw new Error("Invalid HMAC signature");
      }

      // Parseia o body JSON
      try {
        webhookEvent = JSON.parse(body) as BlingWebhookEvent;
      } catch (parseError) {
        throw new Error(`Invalid JSON payload: ${parseError}`);
      }

      // Valida estrutura básica do webhook
      if (!webhookEvent.eventId || !webhookEvent.event || !webhookEvent.data) {
        throw new Error("Invalid webhook structure: missing required fields");
      }

      // Verifica se o evento já foi processado (idempotência)
      const existingLog = await this.checkDuplicateEvent(
        webhookEvent.eventId,
        retryAttempt
      );
      if (existingLog && existingLog.status === "success") {
        const processingTime = Date.now() - startTime;
        return {
          success: true,
          statusCode: 200,
          processingTime,
          resourceId: existingLog.resourceId || undefined,
        };
      }

      // Processa o evento baseado no tipo
      resourceId = await this.processEventByType(webhookEvent);

      const processingTime = Date.now() - startTime;

      // Log de sucesso
      await this.logWebhookEvent({
        eventId: webhookEvent.eventId,
        eventType: webhookEvent.event as WebhookEventType,
        resourceId,
        status: "success",
        statusCode: 200,
        processingTime,
        requestHeaders: headers,
        requestBody: webhookEvent,
        responseBody: { success: true, resourceId },
        ipAddress,
        userAgent,
        signature,
        signatureValid: isSignatureValid,
        retryAttempt,
      });

      return {
        success: true,
        statusCode: 200,
        processingTime,
        resourceId,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Log de erro
      await this.logWebhookEvent({
        eventId: webhookEvent?.eventId || "unknown",
        eventType: (webhookEvent?.event as WebhookEventType) || "unknown",
        resourceId,
        status: "error",
        statusCode: 400,
        errorMessage,
        errorStack,
        processingTime,
        requestHeaders: headers,
        requestBody: webhookEvent || { raw: body },
        responseBody: { success: false, error: errorMessage },
        ipAddress,
        userAgent: extractWebhookHeaders(headers).userAgent,
        signature: extractWebhookHeaders(headers).signature,
        signatureValid: false,
        retryAttempt,
      });

      return {
        success: false,
        statusCode: 400,
        errorMessage,
        errorStack,
        processingTime,
        resourceId,
      };
    }
  }

  /**
   * Processa evento baseado no tipo
   */
  private async processEventByType(
    webhookEvent: BlingWebhookEvent
  ): Promise<string> {
    const eventType = webhookEvent.event;

    if (
      eventType.startsWith("invoice.") ||
      eventType.startsWith("consumer_invoice.")
    ) {
      return this.processInvoiceEvent(webhookEvent);
    }

    throw new Error(`Unsupported event type: ${eventType}`);
  }

  /**
   * Processa eventos de nota fiscal
   */
  private async processInvoiceEvent(
    webhookEvent: BlingWebhookEvent
  ): Promise<string> {
    const eventType = webhookEvent.event;
    const data = webhookEvent.data;

    if (eventType.endsWith(".deleted")) {
      return this.processInvoiceDeleted(data as InvoiceWebhookDeletedData);
    }

    if (eventType.endsWith(".created") || eventType.endsWith(".updated")) {
      return this.processInvoiceCreatedOrUpdated(
        data as InvoiceWebhookData,
        webhookEvent,
        eventType.endsWith(".updated")
      );
    }

    throw new Error(`Unsupported invoice event: ${eventType}`);
  }

  /**
   * Processa criação ou atualização de nota fiscal
   */
  private async processInvoiceCreatedOrUpdated(
    data: InvoiceWebhookData,
    webhookEvent: BlingWebhookEvent,
    isUpdate: boolean
  ): Promise<string> {
    const blingId = data.id.toString();

    // Valida e parseia datas
    const dataEmissao = parseBlingDate(data.dataEmissao);
    const dataOperacao = parseBlingDate(data.dataOperacao);

    if (!dataEmissao || !dataOperacao) {
      throw new Error("Invalid date format in invoice data");
    }

    const invoiceData = {
      blingId,
      tipo: data.tipo,
      situacao: data.situacao,
      numero: data.numero,
      dataEmissao,
      dataOperacao,
      contatoId: data.contato?.id?.toString(),
      naturezaOperacaoId: data.naturezaOperacao?.id?.toString(),
      lojaId: data.loja?.id?.toString(),
      valorTotal: data.valorTotal?.toString(),
      rawData: webhookEvent,
    };

    if (isUpdate) {
      // Tenta atualizar registro existente
      const [updated] = await db
        .update(invoices)
        .set({
          ...invoiceData,
          updatedAt: new Date(),
        })
        .where(eq(invoices.blingId, blingId))
        .returning({ id: invoices.id });

      if (updated) {
        return updated.id;
      }

      // Se não encontrou para atualizar, cria novo registro
    }

    // Cria novo registro
    const [created] = await db
      .insert(invoices)
      .values(invoiceData)
      .onConflictDoUpdate({
        target: invoices.blingId,
        set: {
          ...invoiceData,
          updatedAt: new Date(),
        },
      })
      .returning({ id: invoices.id });

    return created.id;
  }

  /**
   * Processa exclusão de nota fiscal
   */
  private async processInvoiceDeleted(
    data: InvoiceWebhookDeletedData
  ): Promise<string> {
    const blingId = data.id.toString();

    // Marca como deletado ou remove do banco (dependendo da estratégia)
    const [deleted] = await db
      .delete(invoices)
      .where(eq(invoices.blingId, blingId))
      .returning({ id: invoices.id });

    return deleted?.id || blingId;
  }

  /**
   * Verifica se o evento já foi processado
   */
  private async checkDuplicateEvent(eventId: string, retryAttempt: number) {
    const [existingLog] = await db
      .select({
        status: webhookLogs.status,
        resourceId: webhookLogs.resourceId,
      })
      .from(webhookLogs)
      .where(
        and(
          eq(webhookLogs.eventId, eventId),
          eq(webhookLogs.retryAttempt, retryAttempt)
        )
      )
      .limit(1);

    return existingLog;
  }

  /**
   * Registra log do webhook
   */
  private async logWebhookEvent(logData: {
    eventId: string;
    eventType: WebhookEventType | string;
    resourceId?: string;
    status: "success" | "error";
    statusCode: number;
    errorMessage?: string;
    errorStack?: string;
    processingTime: number;
    requestHeaders: Record<string, string | string[] | undefined>;
    requestBody: unknown;
    responseBody: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    signature?: string;
    signatureValid: boolean;
    retryAttempt: number;
  }) {
    try {
      await db.insert(webhookLogs).values({
        eventId: logData.eventId,
        eventType: logData.eventType,
        resourceId: logData.resourceId,
        status: logData.status,
        statusCode: logData.statusCode,
        errorMessage: logData.errorMessage,
        errorStack: logData.errorStack,
        processingTime: logData.processingTime,
        requestHeaders: logData.requestHeaders,
        requestBody: logData.requestBody,
        responseBody: logData.responseBody,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
        signature: logData.signature,
        signatureValid: logData.signatureValid,
        retryAttempt: logData.retryAttempt,
      });
    } catch (logError) {
      console.error("Failed to log webhook event:", logError);
      // Não propaga erro de log para não afetar o processamento principal
    }
  }
}
