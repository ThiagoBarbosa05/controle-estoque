import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { InvoiceService } from "@/services/invoice.service";

const invoiceService = new InvoiceService();

/**
 * GET /api/invoices - Lista notas fiscais com paginação e filtros
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extrai parâmetros da query string
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    const tipoParam = searchParams.get("tipo");
    const tipo = tipoParam ? parseInt(tipoParam, 10) : undefined;

    const situacaoParam = searchParams.get("situacao");
    const situacao = situacaoParam ? parseInt(situacaoParam, 10) : undefined;

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

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: "Start date cannot be after end date" },
        { status: 400 }
      );
    }

    // Busca dados
    const result = await invoiceService.list({
      page,
      pageSize,
      tipo,
      situacao,
      startDate,
      endDate,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
