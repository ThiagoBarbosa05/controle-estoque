"use server";

import { db } from "@/db";
import { wines } from "@/db/schema";
import { eq, and, sql, gt, desc } from "drizzle-orm";
import * as XLSX from "xlsx";

export type ExportWineActionResult = {
  success: boolean;
  data?: {
    filename: string;
    base64: string;
    mimeType: string;
  };
  error?: string;
};

/**
 * Exportar vinhos com estoque baixo (acima de zero mas abaixo do estoque mínimo)
 */
export async function exportLowStockWines(): Promise<ExportWineActionResult> {
  try {
    // Buscar vinhos com estoque baixo (0 < inStock < minStock)
    const lowStockWines = await db
      .select({
        nome: wines.name,
        pais: wines.country,
        tipo: wines.type,
        tamanho: wines.size,
        estoqueAtual: wines.inStock,
        estoqueMinimo: wines.minStock,
        descontinuado: wines.discontinued,
        atualizadoEm: wines.updatedAt,
      })
      .from(wines)
      .where(
        and(
          gt(wines.inStock, 0),
          sql`${wines.inStock} < ${wines.minStock}`
        )
      )
      .orderBy(desc(wines.updatedAt));

    if (lowStockWines.length === 0) {
      return {
        success: false,
        error: "Nenhum vinho com estoque baixo encontrado.",
      };
    }

    // Formatar dados para exportação
    const formattedData = lowStockWines.map((wine) => ({
      Nome: wine.nome,
      País: wine.pais || "N/A",
      Tipo: wine.tipo || "N/A",
      Tamanho: wine.tamanho || "N/A",
      "Estoque Atual": wine.estoqueAtual,
      "Estoque Mínimo": wine.estoqueMinimo,
      Descontinuado: wine.descontinuado ? "Sim" : "Não",
      "Última Atualização": wine.atualizadoEm
        ? new Date(wine.atualizadoEm).toLocaleDateString("pt-BR")
        : "N/A",
    }));

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Ajustar largura das colunas
    const columnWidths = [
      { wch: 40 }, // Nome
      { wch: 15 }, // País
      { wch: 15 }, // Tipo
      { wch: 12 }, // Tamanho
      { wch: 15 }, // Estoque Atual
      { wch: 15 }, // Estoque Mínimo
      { wch: 15 }, // Descontinuado
      { wch: 20 }, // Última Atualização
    ];
    worksheet["!cols"] = columnWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vinhos Estoque Baixo");

    // Gerar buffer do arquivo Excel
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Converter para base64
    const base64 = Buffer.from(excelBuffer).toString("base64");

    // Gerar nome do arquivo com data
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const filename = `vinhos-estoque-baixo_${dateStr}.xlsx`;

    return {
      success: true,
      data: {
        filename,
        base64,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    };
  } catch (error) {
    console.error("Erro ao exportar vinhos com estoque baixo:", error);
    return {
      success: false,
      error: "Erro ao gerar planilha. Tente novamente.",
    };
  }
}

/**
 * Exportar vinhos com estoque zerado
 */
export async function exportZeroStockWines(): Promise<ExportWineActionResult> {
  try {
    // Buscar vinhos com estoque zerado
    const zeroStockWines = await db
      .select({
        nome: wines.name,
        pais: wines.country,
        tipo: wines.type,
        tamanho: wines.size,
        estoqueMinimo: wines.minStock,
        descontinuado: wines.discontinued,
        atualizadoEm: wines.updatedAt,
      })
      .from(wines)
      .where(eq(wines.inStock, 0))
      .orderBy(desc(wines.updatedAt));

    if (zeroStockWines.length === 0) {
      return {
        success: false,
        error: "Nenhum vinho com estoque zerado encontrado.",
      };
    }

    // Formatar dados para exportação
    const formattedData = zeroStockWines.map((wine) => ({
      Nome: wine.nome,
      País: wine.pais || "N/A",
      Tipo: wine.tipo || "N/A",
      Tamanho: wine.tamanho || "N/A",
      "Estoque Mínimo": wine.estoqueMinimo,
      Descontinuado: wine.descontinuado ? "Sim" : "Não",
      "Última Atualização": wine.atualizadoEm
        ? new Date(wine.atualizadoEm).toLocaleDateString("pt-BR")
        : "N/A",
    }));

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Ajustar largura das colunas
    const columnWidths = [
      { wch: 40 }, // Nome
      { wch: 15 }, // País
      { wch: 15 }, // Tipo
      { wch: 12 }, // Tamanho
      { wch: 15 }, // Estoque Mínimo
      { wch: 15 }, // Descontinuado
      { wch: 20 }, // Última Atualização
    ];
    worksheet["!cols"] = columnWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vinhos Estoque Zerado");

    // Gerar buffer do arquivo Excel
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Converter para base64
    const base64 = Buffer.from(excelBuffer).toString("base64");

    // Gerar nome do arquivo com data
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const filename = `vinhos-estoque-zerado_${dateStr}.xlsx`;

    return {
      success: true,
      data: {
        filename,
        base64,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    };
  } catch (error) {
    console.error("Erro ao exportar vinhos com estoque zerado:", error);
    return {
      success: false,
      error: "Erro ao gerar planilha. Tente novamente.",
    };
  }
}
