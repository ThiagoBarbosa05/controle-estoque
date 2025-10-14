"use server";

import { db } from "@/db";
import { wines, customers, customerWinesList } from "@/db/schema";
import { eq, desc, asc, ilike, count, and, or } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Schemas de validação
const getCustomerWinesSchema = z.object({
  customerId: z.string().uuid("ID do cliente inválido"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  country: z.string().optional(),
  type: z.string().optional(),
  size: z.string().optional(),
  discontinued: z.enum(["all", "active", "discontinued"]).default("active"),
  sortBy: z.enum(["name", "country", "type", "inStock"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const addWineToCustomerSchema = z.object({
  customerId: z.string().uuid("ID do cliente inválido"),
  wineId: z.string().uuid("ID do vinho inválido"),
});

const removeWineFromCustomerSchema = z.object({
  customerId: z.string().uuid("ID do cliente inválido"),
  wineId: z.string().uuid("ID do vinho inválido"),
});

// Tipos
export type CustomerWine = {
  id: string;
  customerId: string;
  wineId: string;
  wine: {
    id: string;
    name: string;
    country: string | null;
    type: string | null;
    size: string | null;
    inStock: number;
    minStock: number;
    discontinued: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type GetCustomerWinesInput = z.infer<typeof getCustomerWinesSchema>;
export type AddWineToCustomerInput = z.infer<typeof addWineToCustomerSchema>;
export type RemoveWineFromCustomerInput = z.infer<
  typeof removeWineFromCustomerSchema
>;

export type CustomerWineActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

export type PaginatedCustomerWines = {
  customerWines: CustomerWine[];
  customer: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    countries: string[];
    types: string[];
    sizes: string[];
  };
  stats: {
    total: number;
    active: number;
    discontinued: number;
    outOfStock: number;
    lowStock: number;
    available: number;
  };
};

/**
 * Buscar vinhos de um cliente com filtros e paginação
 */
export async function getCustomerWines(
  input: GetCustomerWinesInput
): Promise<CustomerWineActionResult<PaginatedCustomerWines>> {
  try {
    // Validação dos parâmetros
    const validatedInput = getCustomerWinesSchema.parse(input);
    const {
      customerId,
      page,
      limit,
      search,
      country,
      type,
      size,
      discontinued,
      sortBy,
      sortOrder,
    } = validatedInput;

    // Verificar se cliente existe
    const [customerResult] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customerResult) {
      return {
        success: false,
        error: "Cliente não encontrado",
      };
    }

    // Calcular offset
    const offset = (page - 1) * limit;

    // Construir condições de filtro
    const conditions = [eq(customerWinesList.customerId, customerId)];

    // Filtro de busca no nome do vinho
    if (search?.trim()) {
      const searchTerm = search.trim().toLowerCase();
      conditions.push(ilike(wines.name, `%${searchTerm}%`));
    }

    // Filtro por país
    if (country?.trim() && country !== "all") {
      conditions.push(eq(wines.country, country.trim()));
    }

    // Filtro por tipo
    if (type?.trim() && type !== "all") {
      conditions.push(eq(wines.type, type.trim()));
    }

    // Filtro por tamanho
    if (size?.trim() && size !== "all") {
      conditions.push(eq(wines.size, size.trim()));
    }

    // Filtro por descontinuado
    if (discontinued === "active") {
      conditions.push(eq(wines.discontinued, false));
    } else if (discontinued === "discontinued") {
      conditions.push(eq(wines.discontinued, true));
    }

    // Combinar condições
    const whereCondition = and(...conditions);

    // Query principal com JOIN
    const baseQuery = db
      .select({
        id: customerWinesList.id,
        customerId: customerWinesList.customerId,
        wineId: customerWinesList.wineId,
        wine: {
          id: wines.id,
          name: wines.name,
          country: wines.country,
          type: wines.type,
          size: wines.size,
          inStock: wines.inStock,
          minStock: wines.minStock,
          discontinued: wines.discontinued,
          createdAt: wines.createdAt,
          updatedAt: wines.updatedAt,
        },
      })
      .from(customerWinesList)
      .innerJoin(wines, eq(customerWinesList.wineId, wines.id))
      .where(whereCondition);

    // Aplicar ordenação baseada no campo
    const orderFn = sortOrder === "asc" ? asc : desc;
    let customerWinesQuery = baseQuery.orderBy(orderFn(wines.name)); // default

    switch (sortBy) {
      case "name":
        customerWinesQuery = baseQuery.orderBy(orderFn(wines.name));
        break;
      case "country":
        customerWinesQuery = baseQuery.orderBy(orderFn(wines.country));
        break;
      case "type":
        customerWinesQuery = baseQuery.orderBy(orderFn(wines.type));
        break;
      case "inStock":
        customerWinesQuery = baseQuery.orderBy(orderFn(wines.inStock));
        break;
      default:
        customerWinesQuery = baseQuery.orderBy(orderFn(wines.name));
        break;
    }

    // Executar queries em paralelo
    const [customerWinesResult, totalResult, filtersResult] = await Promise.all(
      [
        // Buscar vinhos com paginação
        customerWinesQuery.limit(limit).offset(offset),

        // Contar total
        db
          .select({ count: count() })
          .from(customerWinesList)
          .innerJoin(wines, eq(customerWinesList.wineId, wines.id))
          .where(whereCondition),

        // Buscar filtros disponíveis
        Promise.all([
          db
            .selectDistinct({ country: wines.country })
            .from(customerWinesList)
            .innerJoin(wines, eq(customerWinesList.wineId, wines.id))
            .where(eq(customerWinesList.customerId, customerId))
            .orderBy(asc(wines.country)),
          db
            .selectDistinct({ type: wines.type })
            .from(customerWinesList)
            .innerJoin(wines, eq(customerWinesList.wineId, wines.id))
            .where(eq(customerWinesList.customerId, customerId))
            .orderBy(asc(wines.type)),
          db
            .selectDistinct({ size: wines.size })
            .from(customerWinesList)
            .innerJoin(wines, eq(customerWinesList.wineId, wines.id))
            .where(eq(customerWinesList.customerId, customerId))
            .orderBy(asc(wines.size)),
        ]),
      ]
    );

    const [countriesResult, typesResult, sizesResult] = filtersResult;
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Calcular estatísticas
    const stats = {
      total: customerWinesResult.length,
      active: customerWinesResult.filter((w) => !w.wine.discontinued).length,
      discontinued: customerWinesResult.filter((w) => w.wine.discontinued)
        .length,
      outOfStock: customerWinesResult.filter((w) => w.wine.inStock === 0)
        .length,
      lowStock: customerWinesResult.filter(
        (w) => w.wine.inStock > 0 && w.wine.inStock <= w.wine.minStock
      ).length,
      available: customerWinesResult.filter(
        (w) => w.wine.inStock > w.wine.minStock
      ).length,
    };

    return {
      success: true,
      data: {
        customerWines: customerWinesResult,
        customer: customerResult,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        filters: {
          countries: countriesResult
            .map((r) => r.country)
            .filter(Boolean) as string[],
          types: typesResult.map((r) => r.type).filter(Boolean) as string[],
          sizes: sizesResult.map((r) => r.size).filter(Boolean) as string[],
        },
        stats,
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
 * Adicionar vinho à lista de um cliente
 */
export async function addWineToCustomer(
  input: AddWineToCustomerInput
): Promise<CustomerWineActionResult<void>> {
  try {
    // Validação dos dados
    const validatedData = addWineToCustomerSchema.parse(input);
    const { customerId, wineId } = validatedData;

    // Verificar se cliente existe
    const customerExists = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customerExists.length === 0) {
      return {
        success: false,
        error: "Cliente não encontrado",
      };
    }

    // Verificar se vinho existe
    const wineExists = await db
      .select({ id: wines.id })
      .from(wines)
      .where(eq(wines.id, wineId))
      .limit(1);

    if (wineExists.length === 0) {
      return {
        success: false,
        error: "Vinho não encontrado",
      };
    }

    // Verificar se vinho já está na lista do cliente
    const existingEntry = await db
      .select({ id: customerWinesList.id })
      .from(customerWinesList)
      .where(
        and(
          eq(customerWinesList.customerId, customerId),
          eq(customerWinesList.wineId, wineId)
        )
      )
      .limit(1);

    if (existingEntry.length > 0) {
      return {
        success: false,
        error: "Este vinho já está na lista do cliente",
      };
    }

    // Adicionar vinho à lista do cliente
    await db.insert(customerWinesList).values({
      customerId,
      wineId,
    });

    // Revalidar cache
    revalidatePath(`/customers/${customerId}/wines`);
    revalidatePath("/customers");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao adicionar vinho ao cliente:", error);

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
  input: RemoveWineFromCustomerInput
): Promise<CustomerWineActionResult<void>> {
  try {
    // Validação dos dados
    const validatedData = removeWineFromCustomerSchema.parse(input);
    const { customerId, wineId } = validatedData;

    // Verificar se a entrada existe
    const existingEntry = await db
      .select({ id: customerWinesList.id })
      .from(customerWinesList)
      .where(
        and(
          eq(customerWinesList.customerId, customerId),
          eq(customerWinesList.wineId, wineId)
        )
      )
      .limit(1);

    if (existingEntry.length === 0) {
      return {
        success: false,
        error: "Vinho não encontrado na lista do cliente",
      };
    }

    // Remover vinho da lista do cliente
    await db
      .delete(customerWinesList)
      .where(
        and(
          eq(customerWinesList.customerId, customerId),
          eq(customerWinesList.wineId, wineId)
        )
      );

    // Revalidar cache
    revalidatePath(`/customers/${customerId}/wines`);
    revalidatePath("/customers");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao remover vinho do cliente:", error);

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
