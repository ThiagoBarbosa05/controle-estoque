/**
 * @file customer-wines.ts
 * @description Data layer para gerenciamento de listas de vinhos dos clientes
 *
 * Este arquivo implementa funções otimizadas para busca de dados usando:
 * - Next.js unstable_cache para cache avançado com chaves dinâmicas
 * - Cache tags granulares para invalidação seletiva
 * - Padrão wrapper para flexibilidade de cache
 * - Validação com Zod schemas
 * - Queries otimizadas com Drizzle ORM
 *
 * Estrutura de cache:
 * - Funções core: implementação da lógica de negócio
 * - Funções wrapper: configuração de cache com chaves dinâmicas
 * - Tags específicas para invalidação granular
 * - Diferentes TTL baseados na natureza dos dados
 */

import { db } from "@/db";
import { customerWinesList, customers, wines } from "@/db/schema";
import { eq, desc, asc, count, and, inArray, ilike, not } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import {
  getCustomerWinesSchema,
  getWineCustomersSchema,
} from "@/lib/schemas/customer-wines";
import type {
  PaginatedCustomerWines,
  CustomerWinesStats,
  GetCustomerWinesParams,
  GetWineCustomersParams,
} from "@/types/customer-wines";
import { CACHE_TAGS } from "@/lib/cache/customer-wines";

/**
 * Buscar vinhos de um cliente com filtros e paginação
 * Cached para melhor performance com tags específicas e chaves dinâmicas
 */
const getCustomerWinesCore = async (
  params: Partial<GetCustomerWinesParams>
): Promise<PaginatedCustomerWines> => {
  // Validação dos dados
  const validatedInput = getCustomerWinesSchema.parse(params);
  const {
    customerId,
    page,
    limit,
    sortBy,
    sortOrder,
    search,
    wineType,
    country,
    discontinued,
  } = validatedInput;

  // Calcular offset
  const offset = (page - 1) * limit;

  // Verificar se cliente existe
  const [customer] = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!customer) {
    throw new Error("Cliente não encontrado");
  }

  // Construir condições de filtro
  const conditions = [eq(customerWinesList.customerId, customerId)];

  // Filtro de busca no nome do vinho
  if (search?.trim()) {
    conditions.push(ilike(wines.name, `%${search.trim()}%`));
  }

  // Filtro por tipo de vinho
  if (wineType?.trim()) {
    conditions.push(eq(wines.type, wineType.trim()));
  }

  // Filtro por país
  if (country?.trim()) {
    conditions.push(eq(wines.country, country.trim()));
  }

  // Filtro por status descontinuado
  if (discontinued === "active") {
    conditions.push(eq(wines.discontinued, false));
  } else if (discontinued === "discontinued") {
    conditions.push(eq(wines.discontinued, true));
  }

  // Query base
  let baseQuery = db
    .select({
      id: customerWinesList.id,
      customerId: customerWinesList.customerId,
      wineId: customerWinesList.wineId,
      customer: {
        id: customers.id,
        name: customers.name,
      },
      wine: {
        id: wines.id,
        name: wines.name,
        country: wines.country,
        type: wines.type,
        size: wines.size,
        inStock: wines.inStock,
        discontinued: wines.discontinued,
      },
    })
    .from(customerWinesList)
    .innerJoin(customers, eq(customerWinesList.customerId, customers.id))
    .innerJoin(wines, eq(customerWinesList.wineId, wines.id))
    .where(and(...conditions))
    .$dynamic();

  // Query para contar total
  const countQuery = db
    .select({ count: count() })
    .from(customerWinesList)
    .innerJoin(wines, eq(customerWinesList.wineId, wines.id))
    .where(and(...conditions));

  // Aplicar ordenação
  let orderBy: ReturnType<typeof asc | typeof desc>;
  switch (sortBy) {
    case "wineName":
      orderBy = sortOrder === "asc" ? asc(wines.name) : desc(wines.name);
      break;
    case "wineCountry":
      orderBy = sortOrder === "asc" ? asc(wines.country) : desc(wines.country);
      break;
    case "wineType":
      orderBy = sortOrder === "asc" ? asc(wines.type) : desc(wines.type);
      break;
    default: // addedAt
      orderBy =
        sortOrder === "asc"
          ? asc(customerWinesList.id)
          : desc(customerWinesList.id);
  }
  baseQuery = baseQuery.orderBy(orderBy);

  // Aplicar paginação
  baseQuery = baseQuery.limit(limit).offset(offset);

  // Executar queries em paralelo
  const [customerWinesResult, totalResult] = await Promise.all([
    baseQuery,
    countQuery,
  ]);

  const total = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    customerWines: customerWinesResult,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * Versão cached da função getCustomerWines usando unstable_cache
 * com chaves dinâmicas baseadas nos parâmetros
 */
export const getCustomerWines = (params: Partial<GetCustomerWinesParams>) => {
  const cacheKey = [
    "get-customer-wines",
    params.customerId || "unknown",
    params.page?.toString() || "1",
    params.limit?.toString() || "20",
    params.sortBy || "addedAt",
    params.sortOrder || "desc",
    params.search || "",
    params.wineType || "",
    params.country || "",
    params.discontinued || "active",
  ];

  const tags = [
    CACHE_TAGS.CUSTOMER_WINES,
    CACHE_TAGS.CUSTOMER_WINES_LIST(params.customerId || "unknown"),
    "customer-wines-paginated",
  ];

  return unstable_cache(() => getCustomerWinesCore(params), cacheKey, {
    tags,
    revalidate: 60, // 1 minuto
  })();
};

/**
 * Buscar clientes que possuem um determinado vinho
 * Cached para melhor performance com tags específicas
 */
const getWineCustomersCore = async (
  params: Partial<GetWineCustomersParams>
): Promise<PaginatedCustomerWines> => {
  // Validação dos dados
  const validatedInput = getWineCustomersSchema.parse(params);
  const { wineId, page, limit, sortBy, sortOrder, search } = validatedInput;

  // Calcular offset
  const offset = (page - 1) * limit;

  // Verificar se vinho existe
  const [wine] = await db
    .select({ id: wines.id, name: wines.name })
    .from(wines)
    .where(eq(wines.id, wineId))
    .limit(1);

  if (!wine) {
    throw new Error("Vinho não encontrado");
  }

  // Construir condições de filtro
  const conditions = [eq(customerWinesList.wineId, wineId)];

  // Filtro de busca no nome do cliente
  if (search?.trim()) {
    conditions.push(ilike(customers.name, `%${search.trim()}%`));
  }

  // Query base
  let baseQuery = db
    .select({
      id: customerWinesList.id,
      customerId: customerWinesList.customerId,
      wineId: customerWinesList.wineId,
      customer: {
        id: customers.id,
        name: customers.name,
      },
      wine: {
        id: wines.id,
        name: wines.name,
        country: wines.country,
        type: wines.type,
        size: wines.size,
        inStock: wines.inStock,
        discontinued: wines.discontinued,
      },
    })
    .from(customerWinesList)
    .innerJoin(customers, eq(customerWinesList.customerId, customers.id))
    .innerJoin(wines, eq(customerWinesList.wineId, wines.id))
    .where(and(...conditions))
    .$dynamic();

  // Query para contar total
  const countQuery = db
    .select({ count: count() })
    .from(customerWinesList)
    .innerJoin(customers, eq(customerWinesList.customerId, customers.id))
    .where(and(...conditions));

  // Aplicar ordenação
  let orderBy: ReturnType<typeof asc | typeof desc>;
  switch (sortBy) {
    case "customerName":
      orderBy =
        sortOrder === "asc" ? asc(customers.name) : desc(customers.name);
      break;
    default: // addedAt
      orderBy =
        sortOrder === "asc"
          ? asc(customerWinesList.id)
          : desc(customerWinesList.id);
  }
  baseQuery = baseQuery.orderBy(orderBy);

  // Aplicar paginação
  baseQuery = baseQuery.limit(limit).offset(offset);

  // Executar queries em paralelo
  const [customersResult, totalResult] = await Promise.all([
    baseQuery,
    countQuery,
  ]);

  const total = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    customerWines: customersResult,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * Versão cached da função getWineCustomers
 */
export const getWineCustomers = (params: Partial<GetWineCustomersParams>) => {
  const cacheKey = [
    "get-wine-customers",
    params.wineId || "unknown",
    params.page?.toString() || "1",
    params.limit?.toString() || "20",
    params.sortBy || "addedAt",
    params.sortOrder || "desc",
    params.search || "",
  ];

  const tags = [
    CACHE_TAGS.CUSTOMER_WINES,
    CACHE_TAGS.WINE_CUSTOMERS(params.wineId || "unknown"),
    "wine-customers-paginated",
  ];

  return unstable_cache(() => getWineCustomersCore(params), cacheKey, {
    tags,
    revalidate: 60, // 1 minuto
  })();
};

/**
 * Obter estatísticas das listas de vinhos dos clientes
 * Cached para melhor performance com tags específicas
 */
const getCustomerWinesStatsCore = async (): Promise<CustomerWinesStats> => {
  // Executar queries estatísticas em paralelo
  const [
    totalResult,
    uniqueCustomersResult,
    uniqueWinesResult,
    topCustomersResult,
    topWinesResult,
  ] = await Promise.all([
    // Total de associações
    db.select({ count: count() }).from(customerWinesList),

    // Clientes únicos com vinhos
    db
      .selectDistinct({ customerId: customerWinesList.customerId })
      .from(customerWinesList),

    // Vinhos únicos em listas
    db
      .selectDistinct({ wineId: customerWinesList.wineId })
      .from(customerWinesList),

    // Top 5 clientes por quantidade de vinhos
    db
      .select({
        customerId: customerWinesList.customerId,
        customerName: customers.name,
        wineCount: count(),
      })
      .from(customerWinesList)
      .innerJoin(customers, eq(customerWinesList.customerId, customers.id))
      .groupBy(customerWinesList.customerId, customers.name)
      .orderBy(desc(count()))
      .limit(5),

    // Top 5 vinhos por quantidade de clientes
    db
      .select({
        wineId: customerWinesList.wineId,
        wineName: wines.name,
        customerCount: count(),
      })
      .from(customerWinesList)
      .innerJoin(wines, eq(customerWinesList.wineId, wines.id))
      .groupBy(customerWinesList.wineId, wines.name)
      .orderBy(desc(count()))
      .limit(5),
  ]);

  const totalAssociations = totalResult[0]?.count || 0;
  const uniqueCustomers = uniqueCustomersResult.length;
  const averageWinesPerCustomer =
    uniqueCustomers > 0 ? totalAssociations / uniqueCustomers : 0;

  return {
    totalAssociations,
    uniqueCustomersWithWines: uniqueCustomers,
    uniqueWinesInLists: uniqueWinesResult.length,
    topCustomersByWineCount: topCustomersResult.map((r) => ({
      customerId: r.customerId,
      customerName: r.customerName,
      wineCount: r.wineCount,
    })),
    topWinesByCustomerCount: topWinesResult.map((r) => ({
      wineId: r.wineId,
      wineName: r.wineName,
      customerCount: r.customerCount,
    })),
    averageWinesPerCustomer: Math.round(averageWinesPerCustomer * 100) / 100,
  };
};

/**
 * Versão cached da função getCustomerWinesStats
 */
export const getCustomerWinesStats = () => {
  return unstable_cache(
    getCustomerWinesStatsCore,
    ["get-customer-wines-stats"],
    {
      tags: [CACHE_TAGS.CUSTOMER_WINES_STATS],
      revalidate: 300, // 5 minutos
    }
  )();
};

/**
 * Verificar se um vinho está na lista de um cliente
 * Cached para melhor performance com tags específicas
 */
const isWineInCustomerListCore = async (
  customerId: string,
  wineId: string
): Promise<boolean> => {
  const [association] = await db
    .select({ id: customerWinesList.id })
    .from(customerWinesList)
    .where(
      and(
        eq(customerWinesList.customerId, customerId),
        eq(customerWinesList.wineId, wineId)
      )
    )
    .limit(1);

  return !!association;
};

/**
 * Versão cached da função isWineInCustomerList
 */
export const isWineInCustomerList = (customerId: string, wineId: string) => {
  const cacheKey = ["is-wine-in-customer-list", customerId, wineId];
  const tags = [
    CACHE_TAGS.CUSTOMER_WINES,
    CACHE_TAGS.CUSTOMER_WINES_LIST(customerId),
    "wine-in-customer-list",
  ];

  return unstable_cache(
    () => isWineInCustomerListCore(customerId, wineId),
    cacheKey,
    {
      tags,
      revalidate: 60, // 1 minuto
    }
  )();
};

/**
 * Buscar vinhos disponíveis (não descontinuados) que ainda não estão na lista do cliente
 * Cached para melhor performance com tags específicas
 */
const getAvailableWinesForCustomerCore = async (
  customerId: string,
  limit = 50
): Promise<
  {
    id: string;
    name: string;
    country: string | null;
    type: string | null;
  }[]
> => {
  // Buscar IDs dos vinhos já na lista do cliente
  const existingWineIds = await db
    .select({ wineId: customerWinesList.wineId })
    .from(customerWinesList)
    .where(eq(customerWinesList.customerId, customerId));

  const existingIds = existingWineIds.map((item) => item.wineId);

  // Buscar vinhos disponíveis não na lista
  let query = db
    .select({
      id: wines.id,
      name: wines.name,
      country: wines.country,
      type: wines.type,
    })
    .from(wines)
    .where(eq(wines.discontinued, false))
    .orderBy(asc(wines.name))
    .limit(limit)
    .$dynamic();

  if (existingIds.length > 0) {
    query = query.where(
      and(eq(wines.discontinued, false), not(inArray(wines.id, existingIds)))
    ) as typeof query;
  }

  return await query;
};

/**
 * Versão cached da função getAvailableWinesForCustomer
 */
export const getAvailableWinesForCustomer = (
  customerId: string,
  limit = 50
) => {
  const cacheKey = [
    "get-available-wines-for-customer",
    customerId,
    limit.toString(),
  ];
  const tags = [CACHE_TAGS.AVAILABLE_WINES(customerId), "available-wines"];

  return unstable_cache(
    () => getAvailableWinesForCustomerCore(customerId, limit),
    cacheKey,
    {
      tags,
      revalidate: 300, // 5 minutos
    }
  )();
};
