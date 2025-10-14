import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { InvoiceService } from "@/services/invoice.service";

const invoiceService = new InvoiceService();

/**
 * GET /api/invoices/stats - Estatísticas das notas fiscais
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const startDateParam = searchParams.get("startDate");
    const startDate = startDateParam ? new Date(startDateParam) : undefined;

    const endDateParam = searchParams.get("endDate");
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: "Start date cannot be after end date" },
        { status: 400 }
      );
    }

    const stats = await invoiceService.getStats({
      startDate,
      endDate,
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching invoice stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
