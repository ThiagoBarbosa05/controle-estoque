import { useState, useEffect, useCallback } from "react";

// Tipos para as APIs
interface Invoice {
  id: string;
  blingId: string;
  tipo: number;
  situacao: number;
  numero: string;
  dataEmissao: string;
  dataOperacao: string;
  valorTotal?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceStats {
  totalCount: number;
  totalValue: number;
  byType: Array<{
    tipo: number;
    count: number;
    valorTotal: number;
  }>;
  byStatus: Array<{
    situacao: number;
    count: number;
  }>;
}

interface WebhookLog {
  id: string;
  eventId: string;
  eventType: string;
  resourceId?: string;
  status: "success" | "error";
  statusCode: number;
  errorMessage?: string;
  processingTime: number;
  processedAt: string;
  signatureValid: boolean;
  retryAttempt: number;
  ipAddress?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Hook para listar notas fiscais
export function useInvoices(params: {
  page?: number;
  pageSize?: number;
  tipo?: number;
  situacao?: number;
  startDate?: string;
  endDate?: string;
}) {
  const [data, setData] = useState<PaginatedResponse<Invoice> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.set("page", params.page.toString());
      if (params.pageSize)
        searchParams.set("pageSize", params.pageSize.toString());
      if (params.tipo !== undefined)
        searchParams.set("tipo", params.tipo.toString());
      if (params.situacao !== undefined)
        searchParams.set("situacao", params.situacao.toString());
      if (params.startDate) searchParams.set("startDate", params.startDate);
      if (params.endDate) searchParams.set("endDate", params.endDate);

      const response = await fetch(`/api/invoices?${searchParams}`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result: PaginatedResponse<Invoice> = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [
    params.page,
    params.pageSize,
    params.tipo,
    params.situacao,
    params.startDate,
    params.endDate,
  ]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return { data, loading, error, refetch: fetchInvoices };
}

// Hook para estatísticas de notas fiscais
export function useInvoiceStats(params: {
  startDate?: string;
  endDate?: string;
}) {
  const [data, setData] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams();
        if (params.startDate) searchParams.set("startDate", params.startDate);
        if (params.endDate) searchParams.set("endDate", params.endDate);

        const response = await fetch(`/api/invoices/stats?${searchParams}`);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result: InvoiceStats = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [params.startDate, params.endDate]);

  return { data, loading, error };
}

// Hook para logs de webhooks
export function useWebhookLogs(params: {
  page?: number;
  pageSize?: number;
  status?: "success" | "error";
  eventType?: string;
  startDate?: string;
  endDate?: string;
}) {
  const [data, setData] = useState<PaginatedResponse<WebhookLog> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams();

        if (params.page) searchParams.set("page", params.page.toString());
        if (params.pageSize)
          searchParams.set("pageSize", params.pageSize.toString());
        if (params.status) searchParams.set("status", params.status);
        if (params.eventType) searchParams.set("eventType", params.eventType);
        if (params.startDate) searchParams.set("startDate", params.startDate);
        if (params.endDate) searchParams.set("endDate", params.endDate);

        const response = await fetch(`/api/webhooks/logs?${searchParams}`);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result: PaginatedResponse<WebhookLog> = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [
    params.page,
    params.pageSize,
    params.status,
    params.eventType,
    params.startDate,
    params.endDate,
  ]);

  return { data, loading, error };
}

// Hook para verificar saúde do webhook
export function useWebhookHealth() {
  const [data, setData] = useState<{
    status: string;
    service: string;
    timestamp: string;
    configured: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/webhooks/bling");

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { data, loading, error, checkHealth };
}

// Utilitários para formatação
export const invoiceUtils = {
  formatTipo: (tipo: number): string => {
    switch (tipo) {
      case 1:
        return "Entrada";
      case 2:
        return "Saída";
      default:
        return `Tipo ${tipo}`;
    }
  },

  formatSituacao: (situacao: number): string => {
    // Mapeamento básico - ajuste conforme necessário
    const situacoes: Record<number, string> = {
      1: "Ativa",
      2: "Cancelada",
      3: "Inutilizada",
      // Adicione outros status conforme sua necessidade
    };
    return situacoes[situacao] || `Situação ${situacao}`;
  },

  formatValor: (valor: string | number): string => {
    const num = typeof valor === "string" ? parseFloat(valor) : valor;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num || 0);
  },

  formatData: (data: string): string => {
    return new Date(data).toLocaleDateString("pt-BR");
  },

  formatDataHora: (data: string): string => {
    return new Date(data).toLocaleString("pt-BR");
  },
};

export const webhookUtils = {
  formatEventType: (eventType: string): string => {
    const types: Record<string, string> = {
      "invoice.created": "NF Criada",
      "invoice.updated": "NF Atualizada",
      "invoice.deleted": "NF Excluída",
      "consumer_invoice.created": "NFC Criada",
      "consumer_invoice.updated": "NFC Atualizada",
      "consumer_invoice.deleted": "NFC Excluída",
    };
    return types[eventType] || eventType;
  },

  formatStatus: (status: string): string => {
    return status === "success" ? "Sucesso" : "Erro";
  },

  formatProcessingTime: (timeMs: number): string => {
    if (timeMs < 1000) return `${timeMs}ms`;
    return `${(timeMs / 1000).toFixed(2)}s`;
  },
};
