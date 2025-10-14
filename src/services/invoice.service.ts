import { db } from "@/db";
import { invoices, webhookLogs } from "@/db/schema";
import { eq, desc, and, between, sql, count } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

/**
 * Serviço para consultas e operações relacionadas às notas fiscais
 */
export class InvoiceService {
  /**
   * Busca nota fiscal por ID do Bling
   */
  async findByBlingId(blingId: string) {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.blingId, blingId))
      .limit(1);

    return invoice;
  }

  /**
   * Lista notas fiscais com paginação e filtros
   */
  async list(
    params: {
      page?: number;
      pageSize?: number;
      tipo?: number;
      situacao?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const {
      page = 1,
      pageSize = 20,
      tipo,
      situacao,
      startDate,
      endDate,
    } = params;

    const offset = (page - 1) * pageSize;
    const conditions: SQL[] = [];

    // Aplica filtros
    if (tipo !== undefined) {
      conditions.push(eq(invoices.tipo, tipo));
    }

    if (situacao !== undefined) {
      conditions.push(eq(invoices.situacao, situacao));
    }

    if (startDate && endDate) {
      conditions.push(between(invoices.dataEmissao, startDate, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Busca registros
    const results = await db
      .select({
        id: invoices.id,
        blingId: invoices.blingId,
        tipo: invoices.tipo,
        situacao: invoices.situacao,
        numero: invoices.numero,
        dataEmissao: invoices.dataEmissao,
        dataOperacao: invoices.dataOperacao,
        valorTotal: invoices.valorTotal,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
      })
      .from(invoices)
      .where(whereClause)
      .orderBy(desc(invoices.dataEmissao))
      .limit(pageSize)
      .offset(offset);

    // Conta total de registros
    const [totalResult] = await db
      .select({ total: count() })
      .from(invoices)
      .where(whereClause);

    return {
      data: results,
      pagination: {
        page,
        pageSize,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / pageSize),
      },
    };
  }

  /**
   * Busca detalhes completos de uma nota fiscal
   */
  async findById(id: string) {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    return invoice;
  }

  /**
   * Estatísticas de notas fiscais
   */
  async getStats(
    params: {
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const { startDate, endDate } = params;

    const whereClause =
      startDate && endDate
        ? between(invoices.dataEmissao, startDate, endDate)
        : undefined;

    // Total de notas fiscais
    const [totalCount] = await db
      .select({ count: count() })
      .from(invoices)
      .where(whereClause);

    // Notas por tipo
    const typeStats = await db
      .select({
        tipo: invoices.tipo,
        count: count(),
        valorTotal: sql<string>`COALESCE(SUM(CAST(${invoices.valorTotal} AS DECIMAL)), 0)`,
      })
      .from(invoices)
      .where(whereClause)
      .groupBy(invoices.tipo);

    // Notas por situação
    const statusStats = await db
      .select({
        situacao: invoices.situacao,
        count: count(),
      })
      .from(invoices)
      .where(whereClause)
      .groupBy(invoices.situacao);

    // Valor total
    const [totalValue] = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${invoices.valorTotal} AS DECIMAL)), 0)`,
      })
      .from(invoices)
      .where(whereClause);

    return {
      totalCount: totalCount.count,
      totalValue: parseFloat(totalValue.total || "0"),
      byType: typeStats.map((stat) => ({
        tipo: stat.tipo,
        count: stat.count,
        valorTotal: parseFloat(stat.valorTotal || "0"),
      })),
      byStatus: statusStats,
    };
  }

  /**
   * Últimas notas fiscais recebidas
   */
  async getRecent(limit: number = 10) {
    return await db
      .select({
        id: invoices.id,
        blingId: invoices.blingId,
        tipo: invoices.tipo,
        numero: invoices.numero,
        dataEmissao: invoices.dataEmissao,
        valorTotal: invoices.valorTotal,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .orderBy(desc(invoices.createdAt))
      .limit(limit);
  }
}

/**
 * Serviço para consultas e operações relacionadas aos logs de webhook
 */
export class WebhookLogService {
  /**
   * Lista logs de webhook com paginação e filtros
   */
  async list(
    params: {
      page?: number;
      pageSize?: number;
      status?: "success" | "error";
      eventType?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const {
      page = 1,
      pageSize = 50,
      status,
      eventType,
      startDate,
      endDate,
    } = params;

    const offset = (page - 1) * pageSize;
    const conditions: SQL[] = [];

    // Aplica filtros
    if (status) {
      conditions.push(eq(webhookLogs.status, status));
    }

    if (eventType) {
      conditions.push(eq(webhookLogs.eventType, eventType));
    }

    if (startDate && endDate) {
      conditions.push(between(webhookLogs.processedAt, startDate, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Busca registros
    const results = await db
      .select({
        id: webhookLogs.id,
        eventId: webhookLogs.eventId,
        eventType: webhookLogs.eventType,
        resourceId: webhookLogs.resourceId,
        status: webhookLogs.status,
        statusCode: webhookLogs.statusCode,
        errorMessage: webhookLogs.errorMessage,
        processingTime: webhookLogs.processingTime,
        processedAt: webhookLogs.processedAt,
        signatureValid: webhookLogs.signatureValid,
        retryAttempt: webhookLogs.retryAttempt,
        ipAddress: webhookLogs.ipAddress,
      })
      .from(webhookLogs)
      .where(whereClause)
      .orderBy(desc(webhookLogs.processedAt))
      .limit(pageSize)
      .offset(offset);

    // Conta total de registros
    const [totalResult] = await db
      .select({ total: count() })
      .from(webhookLogs)
      .where(whereClause);

    return {
      data: results,
      pagination: {
        page,
        pageSize,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / pageSize),
      },
    };
  }

  /**
   * Estatísticas de webhooks
   */
  async getStats(
    params: {
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const { startDate, endDate } = params;

    const whereClause =
      startDate && endDate
        ? between(webhookLogs.processedAt, startDate, endDate)
        : undefined;

    // Total de webhooks processados
    const [totalCount] = await db
      .select({ count: count() })
      .from(webhookLogs)
      .where(whereClause);

    // Status dos webhooks
    const statusStats = await db
      .select({
        status: webhookLogs.status,
        count: count(),
      })
      .from(webhookLogs)
      .where(whereClause)
      .groupBy(webhookLogs.status);

    // Webhooks por tipo de evento
    const eventStats = await db
      .select({
        eventType: webhookLogs.eventType,
        count: count(),
        successCount: sql<number>`SUM(CASE WHEN ${webhookLogs.status} = 'success' THEN 1 ELSE 0 END)`,
        errorCount: sql<number>`SUM(CASE WHEN ${webhookLogs.status} = 'error' THEN 1 ELSE 0 END)`,
      })
      .from(webhookLogs)
      .where(whereClause)
      .groupBy(webhookLogs.eventType);

    // Tempo médio de processamento
    const [avgProcessingTime] = await db
      .select({
        avg: sql<number>`COALESCE(AVG(${webhookLogs.processingTime}), 0)`,
      })
      .from(webhookLogs)
      .where(and(whereClause, eq(webhookLogs.status, "success")));

    // Últimos erros
    const recentErrors = await db
      .select({
        eventId: webhookLogs.eventId,
        eventType: webhookLogs.eventType,
        errorMessage: webhookLogs.errorMessage,
        processedAt: webhookLogs.processedAt,
        retryAttempt: webhookLogs.retryAttempt,
      })
      .from(webhookLogs)
      .where(and(whereClause, eq(webhookLogs.status, "error")))
      .orderBy(desc(webhookLogs.processedAt))
      .limit(10);

    return {
      totalCount: totalCount.count,
      byStatus: statusStats,
      byEventType: eventStats,
      averageProcessingTime: avgProcessingTime.avg,
      recentErrors,
    };
  }

  /**
   * Busca logs por evento ID
   */
  async findByEventId(eventId: string) {
    return await db
      .select()
      .from(webhookLogs)
      .where(eq(webhookLogs.eventId, eventId))
      .orderBy(desc(webhookLogs.processedAt));
  }

  /**
   * Busca detalhes completos de um log
   */
  async findById(id: string) {
    const [log] = await db
      .select()
      .from(webhookLogs)
      .where(eq(webhookLogs.id, id))
      .limit(1);

    return log;
  }
}
