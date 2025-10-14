import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { BlingWebhookService } from "@/services/bling-webhook.service";

// Configuração do webhook
const webhookService = new BlingWebhookService({
  clientSecret: process.env.BLING_CLIENT_SECRET || "",
  maxRetries: 3,
  timeoutMs: 5000,
});

/**
 * Endpoint para receber webhooks do Bling
 * POST /api/webhooks/bling
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Valida se o client secret está configurado
    if (!process.env.BLING_CLIENT_SECRET) {
      console.error("BLING_CLIENT_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook not properly configured" },
        { status: 500 }
      );
    }

    // Extrai dados da requisição
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    const ipAddress =
      headers["x-forwarded-for"] || headers["x-real-ip"] || "unknown";

    // Extrai tentativa de retry do header (se presente)
    const retryAttempt = parseInt(headers["x-retry-attempt"] || "0", 10);

    // Processa o webhook
    const result = await webhookService.processWebhook(
      body,
      headers,
      ipAddress,
      retryAttempt
    );

    const processingTime = Date.now() - startTime;

    // Log de sucesso/erro
    console.log("Webhook processed:", {
      success: result.success,
      statusCode: result.statusCode,
      processingTime,
      resourceId: result.resourceId,
      error: result.errorMessage,
    });

    // Retorna resposta baseada no resultado
    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          resourceId: result.resourceId,
          processingTime,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          error: result.errorMessage,
          processingTime,
        },
        { status: result.statusCode }
      );
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    console.error("Webhook processing failed:", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      processingTime,
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        processingTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint para verificar saúde do webhook
 * GET /api/webhooks/bling
 */
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "Bling Webhook Receiver",
    timestamp: new Date().toISOString(),
    configured: !!process.env.BLING_CLIENT_SECRET,
  });
}

// Desabilita parsing automático do body para preservar a assinatura HMAC
export const runtime = "nodejs";
