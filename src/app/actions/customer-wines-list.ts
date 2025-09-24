"use server";

import { db } from "@/db";
import { customerWinesList, customers, wines } from "@/db/schema";
import { eq, desc, asc, count, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schemas de validação
const addWineToCustomerSchema = z.object({
  customerId: z.string().uuid("ID do cliente inválido"),
  wineId: z.string().uuid("ID do vinho inválido"),
});

const removeWineFromCustomerSchema = z.object({
  customerId: z.string().uuid("ID do cliente inválido"),
  wineId: z.string().uuid("ID do vinho inválido"),
});

const bulkAddWinesToCustomerSchema = z.object({
  customerId: z.string().uuid("ID do cliente inválido"),
  wineIds: z
    .array(z.string().uuid("ID do vinho inválido"))
    .min(1, "Pelo menos um vinho deve ser selecionado")
    .max(50, "Máximo 50 vinhos por operação"),
});

const bulkRemoveWinesFromCustomerSchema = z.object({
  customerId: z.string().uuid("ID do cliente inválido"),
  wineIds: z
    .array(z.string().uuid("ID do vinho inválido"))
    .min(1, "Pelo menos um vinho deve ser selecionado"),
});

const getCustomerWinesSchema = z.object({
  customerId: z.string().uuid("ID do cliente inválido"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z
    .enum(["wineName", "wineCountry", "wineType", "addedAt"])
    .default("addedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  wineType: z.string().optional(),
  country: z.string().optional(),
  discontinued: z.enum(["all", "active", "discontinued"]).default("active"),
});

const getWineCustomersSchema = z.object({
  wineId: z.string().uuid("ID do vinho inválido"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(["customerName", "addedAt"]).default("addedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});

const transferWinesSchema = z.object({
  fromCustomerId: z.string().uuid("ID do cliente origem inválido"),
  toCustomerId: z.string().uuid("ID do cliente destino inválido"),
  wineIds: z
    .array(z.string().uuid("ID do vinho inválido"))
    .min(1, "Pelo menos um vinho deve ser selecionado"),
});

// Tipos
export type CustomerWinesList = typeof customerWinesList.$inferSelect;

export type CustomerWineWithDetails = CustomerWinesList & {
  customer: {
    id: string;
    name: string;
  };
  wine: {
    id: string;
    name: string;
    country: string;
    type: string;
    size: string;
    inStock: string;
    discontinued: boolean;
  };
};

export type AddWineToCustomerInput = z.infer<typeof addWineToCustomerSchema>;
export type BulkAddWinesToCustomerInput = z.infer<
  typeof bulkAddWinesToCustomerSchema
>;
export type GetCustomerWinesInput = z.infer<typeof getCustomerWinesSchema>;
export type GetWineCustomersInput = z.infer<typeof getWineCustomersSchema>;
export type TransferWinesInput = z.infer<typeof transferWinesSchema>;

export type CustomerWinesActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

export type PaginatedCustomerWines = {
  customerWines: CustomerWineWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

/**
 * Adicionar vinho à lista de um cliente
 */
export async function addWineToCustomer(
  input: AddWineToCustomerInput
): Promise<CustomerWinesActionResult<CustomerWinesList>> {
  try {
    // Validação dos dados
    const validatedData = addWineToCustomerSchema.parse(input);

    // Verificar se cliente existe
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, validatedData.customerId))
      .limit(1);

    if (!customer) {
      return {
        success: false,
        error: "Cliente não encontrado",
      };
    }

    // Verificar se vinho existe e não está descontinuado
    const [wine] = await db
      .select({ id: wines.id, discontinued: wines.discontinued })
      .from(wines)
      .where(eq(wines.id, validatedData.wineId))
      .limit(1);

    if (!wine) {
      return {
        success: false,
        error: "Vinho não encontrado",
      };
    }

    if (wine.discontinued) {
      return {
        success: false,
        error:
          "Não é possível adicionar vinhos descontinuados à lista de clientes",
      };
    }

    // Verificar se a associação já existe
    const [existingAssociation] = await db
      .select({ id: customerWinesList.id })
      .from(customerWinesList)
      .where(
        and(
          eq(customerWinesList.customerId, validatedData.customerId),
          eq(customerWinesList.wineId, validatedData.wineId)
        )
      )
      .limit(1);

    if (existingAssociation) {
      return {
        success: false,
        error: "Este vinho já está na lista do cliente",
      };
    }

    // Criar associação
    const [newAssociation] = await db
      .insert(customerWinesList)
      .values(validatedData)
      .returning();

    // Revalidar cache
    revalidatePath("/customers");
    revalidatePath("/wines");
    revalidatePath(`/customers/${validatedData.customerId}`);
    revalidatePath(`/wines/${validatedData.wineId}`);

    return {
      success: true,
      data: newAssociation,
    };
  } catch (error) {
    console.error("Erro ao adicionar vinho à lista do cliente:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Dados inválidos",
        errors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Adicionar múltiplos vinhos à lista de um cliente
 */
export async function bulkAddWinesToCustomer(
  input: BulkAddWinesToCustomerInput
): Promise<CustomerWinesActionResult<CustomerWinesList[]>> {
  try {
    // Validação dos dados
    const validatedData = bulkAddWinesToCustomerSchema.parse(input);

    // Verificar se cliente existe
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, validatedData.customerId))
      .limit(1);

    if (!customer) {
      return {
        success: false,
        error: "Cliente não encontrado",
      };
    }

    // Verificar se todos os vinhos existem e não estão descontinuados
    const winesCheck = await db
      .select({ id: wines.id, discontinued: wines.discontinued })
      .from(wines)
      .where(inArray(wines.id, validatedData.wineIds));

    if (winesCheck.length !== validatedData.wineIds.length) {
      return {
        success: false,
        error: "Um ou mais vinhos não foram encontrados",
      };
    }

    const discontinuedWines = winesCheck.filter((wine) => wine.discontinued);
    if (discontinuedWines.length > 0) {
      return {
        success: false,
        error:
          "Não é possível adicionar vinhos descontinuados à lista de clientes",
      };
    }

    // Verificar associações existentes
    const existingAssociations = await db
      .select({ wineId: customerWinesList.wineId })
      .from(customerWinesList)
      .where(
        and(
          eq(customerWinesList.customerId, validatedData.customerId),
          inArray(customerWinesList.wineId, validatedData.wineIds)
        )
      );

    const existingWineIds = existingAssociations.map((a) => a.wineId);
    const newWineIds = validatedData.wineIds.filter(
      (id) => !existingWineIds.includes(id)
    );

    if (newWineIds.length === 0) {
      return {
        success: false,
        error: "Todos os vinhos selecionados já estão na lista do cliente",
      };
    }

    // Criar novas associações
    const newAssociations = newWineIds.map((wineId) => ({
      customerId: validatedData.customerId,
      wineId,
    }));

    const insertedAssociations = await db
      .insert(customerWinesList)
      .values(newAssociations)
      .returning();

    // Revalidar cache
    revalidatePath("/customers");
    revalidatePath("/wines");
    revalidatePath(`/customers/${validatedData.customerId}`);

    return {
      success: true,
      data: insertedAssociations,
    };
  } catch (error) {
    console.error("Erro ao adicionar vinhos à lista do cliente:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Dados inválidos",
        errors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Remover vinho da lista de um cliente
 */
export async function removeWineFromCustomer(
  input: AddWineToCustomerInput
): Promise<CustomerWinesActionResult<void>> {
  try {
    // Validação dos dados
    const validatedData = removeWineFromCustomerSchema.parse(input);

    // Verificar se a associação existe
    const [existingAssociation] = await db
      .select({ id: customerWinesList.id })
      .from(customerWinesList)
      .where(
        and(
          eq(customerWinesList.customerId, validatedData.customerId),
          eq(customerWinesList.wineId, validatedData.wineId)
        )
      )
      .limit(1);

    if (!existingAssociation) {
      return {
        success: false,
        error: "Este vinho não está na lista do cliente",
      };
    }

    // Remover associação
    await db
      .delete(customerWinesList)
      .where(eq(customerWinesList.id, existingAssociation.id));

    // Revalidar cache
    revalidatePath("/customers");
    revalidatePath("/wines");
    revalidatePath(`/customers/${validatedData.customerId}`);
    revalidatePath(`/wines/${validatedData.wineId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao remover vinho da lista do cliente:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Dados inválidos",
        errors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Remover múltiplos vinhos da lista de um cliente
 */
export async function bulkRemoveWinesFromCustomer(
  input: BulkAddWinesToCustomerInput
): Promise<CustomerWinesActionResult<void>> {
  try {
    // Validação dos dados
    const validatedData = bulkRemoveWinesFromCustomerSchema.parse(input);

    // Verificar associações existentes
    const existingAssociations = await db
      .select({ id: customerWinesList.id })
      .from(customerWinesList)
      .where(
        and(
          eq(customerWinesList.customerId, validatedData.customerId),
          inArray(customerWinesList.wineId, validatedData.wineIds)
        )
      );

    if (existingAssociations.length === 0) {
      return {
        success: false,
        error: "Nenhum dos vinhos selecionados está na lista do cliente",
      };
    }

    // Remover associações
    await db.delete(customerWinesList).where(
      inArray(
        customerWinesList.id,
        existingAssociations.map((a) => a.id)
      )
    );

    // Revalidar cache
    revalidatePath("/customers");
    revalidatePath("/wines");
    revalidatePath(`/customers/${validatedData.customerId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao remover vinhos da lista do cliente:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Dados inválidos",
        errors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Buscar vinhos de um cliente com filtros e paginação
 */
export async function getCustomerWines(
  input: Partial<GetCustomerWinesInput>
): Promise<CustomerWinesActionResult<PaginatedCustomerWines>> {
  try {
    // Validação dos dados
    const validatedInput = getCustomerWinesSchema.parse(input);
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
      return {
        success: false,
        error: "Cliente não encontrado",
      };
    }

    // Construir query base
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
      .where(eq(customerWinesList.customerId, customerId))
      .$dynamic();

    // Construir condições de filtro
    const conditions = [eq(customerWinesList.customerId, customerId)];

    // Filtro de busca no nome do vinho
    if (search?.trim()) {
      baseQuery = baseQuery.where(and(...conditions));
      // Note: Para busca no nome do vinho, usaríamos ilike, mas isso requer reconstrução da query
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

    // Aplicar condições
    if (conditions.length > 1) {
      baseQuery = baseQuery.where(and(...conditions));
    }

    // Query para contar total
    const countQuery = db
      .select({ count: count() })
      .from(customerWinesList)
      .innerJoin(wines, eq(customerWinesList.wineId, wines.id))
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .$dynamic();

    // Aplicar ordenação
    let orderBy: ReturnType<typeof asc | typeof desc>;
    switch (sortBy) {
      case "wineName":
        orderBy = sortOrder === "asc" ? asc(wines.name) : desc(wines.name);
        break;
      case "wineCountry":
        orderBy =
          sortOrder === "asc" ? asc(wines.country) : desc(wines.country);
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
      success: true,
      data: {
        customerWines: customerWinesResult,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };
  } catch (error) {
    console.error("Erro ao buscar vinhos do cliente:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Parâmetros de busca inválidos",
        errors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Buscar clientes que possuem um determinado vinho
 */
export async function getWineCustomers(
  input: Partial<GetWineCustomersInput>
): Promise<CustomerWinesActionResult<PaginatedCustomerWines>> {
  try {
    // Validação dos dados
    const validatedInput = getWineCustomersSchema.parse(input);
    const { wineId, page, limit, sortBy, sortOrder } = validatedInput;

    // Calcular offset
    const offset = (page - 1) * limit;

    // Verificar se vinho existe
    const [wine] = await db
      .select({ id: wines.id, name: wines.name })
      .from(wines)
      .where(eq(wines.id, wineId))
      .limit(1);

    if (!wine) {
      return {
        success: false,
        error: "Vinho não encontrado",
      };
    }

    // Construir condições de filtro
    const conditions = [eq(customerWinesList.wineId, wineId)];

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
      .$dynamic();

    // Aplicar condições
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }

    // Query para contar total
    const countQuery = db
      .select({ count: count() })
      .from(customerWinesList)
      .where(eq(customerWinesList.wineId, wineId));

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
      success: true,
      data: {
        customerWines: customersResult,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };
  } catch (error) {
    console.error("Erro ao buscar clientes do vinho:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Parâmetros de busca inválidos",
        errors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Transferir vinhos de um cliente para outro
 */
export async function transferWinesBetweenCustomers(
  input: TransferWinesInput
): Promise<CustomerWinesActionResult<CustomerWinesList[]>> {
  try {
    // Validação dos dados
    const validatedData = transferWinesSchema.parse(input);

    if (validatedData.fromCustomerId === validatedData.toCustomerId) {
      return {
        success: false,
        error: "Cliente origem e destino não podem ser o mesmo",
      };
    }

    // Verificar se ambos os clientes existem
    const customersCheck = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        inArray(customers.id, [
          validatedData.fromCustomerId,
          validatedData.toCustomerId,
        ])
      );

    if (customersCheck.length !== 2) {
      return {
        success: false,
        error: "Um ou ambos os clientes não foram encontrados",
      };
    }

    // Verificar se as associações existem no cliente origem
    const existingAssociations = await db
      .select({ id: customerWinesList.id, wineId: customerWinesList.wineId })
      .from(customerWinesList)
      .where(
        and(
          eq(customerWinesList.customerId, validatedData.fromCustomerId),
          inArray(customerWinesList.wineId, validatedData.wineIds)
        )
      );

    if (existingAssociations.length !== validatedData.wineIds.length) {
      return {
        success: false,
        error:
          "Nem todos os vinhos selecionados estão na lista do cliente origem",
      };
    }

    // Verificar se já existem associações no cliente destino
    const existingDestinationAssociations = await db
      .select({ wineId: customerWinesList.wineId })
      .from(customerWinesList)
      .where(
        and(
          eq(customerWinesList.customerId, validatedData.toCustomerId),
          inArray(customerWinesList.wineId, validatedData.wineIds)
        )
      );

    const conflictingWineIds = existingDestinationAssociations.map(
      (a) => a.wineId
    );
    if (conflictingWineIds.length > 0) {
      return {
        success: false,
        error: "Alguns vinhos já estão na lista do cliente destino",
      };
    }

    // Executar transferência em transação
    const result = await db.transaction(async (tx) => {
      // Remover associações do cliente origem
      await tx.delete(customerWinesList).where(
        inArray(
          customerWinesList.id,
          existingAssociations.map((a) => a.id)
        )
      );

      // Criar novas associações no cliente destino
      const newAssociations = validatedData.wineIds.map((wineId) => ({
        customerId: validatedData.toCustomerId,
        wineId,
      }));

      return await tx
        .insert(customerWinesList)
        .values(newAssociations)
        .returning();
    });

    // Revalidar cache
    revalidatePath("/customers");
    revalidatePath("/wines");
    revalidatePath(`/customers/${validatedData.fromCustomerId}`);
    revalidatePath(`/customers/${validatedData.toCustomerId}`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Erro ao transferir vinhos entre clientes:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Dados inválidos",
        errors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Obter estatísticas das listas de vinhos dos clientes
 */
export async function getCustomerWinesStats(): Promise<
  CustomerWinesActionResult<{
    totalAssociations: number;
    uniqueCustomersWithWines: number;
    uniqueWinesInLists: number;
    topCustomersByWineCount: {
      customerId: string;
      customerName: string;
      wineCount: number;
    }[];
    topWinesByCustomerCount: {
      wineId: string;
      wineName: string;
      customerCount: number;
    }[];
    averageWinesPerCustomer: number;
  }>
> {
  try {
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
      success: true,
      data: {
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
        averageWinesPerCustomer:
          Math.round(averageWinesPerCustomer * 100) / 100,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Limpar lista de vinhos de um cliente
 */
export async function clearCustomerWinesList(
  customerId: string
): Promise<CustomerWinesActionResult<void>> {
  try {
    // Validação do ID
    const validatedId = z
      .string()
      .uuid("ID do cliente inválido")
      .parse(customerId);

    // Verificar se cliente existe
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, validatedId))
      .limit(1);

    if (!customer) {
      return {
        success: false,
        error: "Cliente não encontrado",
      };
    }

    // Remover todas as associações do cliente
    await db
      .delete(customerWinesList)
      .where(eq(customerWinesList.customerId, validatedId));

    // Revalidar cache
    revalidatePath("/customers");
    revalidatePath("/wines");
    revalidatePath(`/customers/${validatedId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao limpar lista de vinhos do cliente:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "ID do cliente inválido",
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}
