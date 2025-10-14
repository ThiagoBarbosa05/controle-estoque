import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { WebhookLogService } from "@/services/invoice.service";

const webhookLogService = new WebhookLogService();

/**
 * GET /api/webhooks/logs - Lista logs de webhooks com paginação e filtros
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

    const status = searchParams.get("status") as "success" | "error" | null;
    const eventType = searchParams.get("eventType");

    const startDateParam = searchParams.get("startDate");
    const startDate = startDateParam ? new Date(startDateParam) : undefined;

    const endDateParam = searchParams.get("endDate");
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    // Valida parâmetros
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    if (status && !["success", "error"].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status parameter. Must be "success" or "error"' },
        { status: 400 }
      );
    }

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: "Start date cannot be after end date" },
        { status: 400 }
      );
    }

    const result = await webhookLogService.list({
      page,
      pageSize,
      status: status || undefined,
      eventType: eventType || undefined,
      startDate,
      endDate,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching webhook logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
