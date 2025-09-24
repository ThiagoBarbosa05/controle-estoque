"use server";

import { db } from "@/db";
import { wines, customerWinesList } from "@/db/schema";
import { eq, desc, asc, ilike, count, gte, and, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schemas de validação
const wineTypeEnum = z.enum([
  "Tinto",
  "Branco",
  "Rosé",
  "Espumante",
  "Fortificado",
  "Sobremesa",
]);

const wineSizeEnum = z.enum([
  "187ml",
  "375ml",
  "750ml",
  "1L",
  "1.5L",
  "3L",
  "6L",
]);

const createWineSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim()
    .transform((val) => val.replace(/\s+/g, " ")),
  country: z
    .string()
    .min(2, "País deve ter pelo menos 2 caracteres")
    .max(50, "País deve ter no máximo 50 caracteres")
    .trim()
    .transform((val) => val.replace(/\s+/g, " ")),
  type: wineTypeEnum,
  size: wineSizeEnum,
  inStock: z
    .string()
    .regex(/^\d+$/, "Estoque deve ser um número")
    .transform((val) => val.trim())
    .refine((val) => parseInt(val) >= 0, "Estoque não pode ser negativo"),
  discontinued: z.boolean().default(false),
});

const updateWineSchema = z.object({
  id: z.string().uuid("ID inválido"),
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim()
    .transform((val) => val.replace(/\s+/g, " ")),
  country: z
    .string()
    .min(2, "País deve ter pelo menos 2 caracteres")
    .max(50, "País deve ter no máximo 50 caracteres")
    .trim()
    .transform((val) => val.replace(/\s+/g, " ")),
  type: wineTypeEnum,
  size: wineSizeEnum,
  inStock: z
    .string()
    .regex(/^\d+$/, "Estoque deve ser um número")
    .transform((val) => val.trim())
    .refine((val) => parseInt(val) >= 0, "Estoque não pode ser negativo"),
  discontinued: z.boolean().default(false),
});

const deleteWineSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

const getWinesSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  country: z.string().optional(),
  type: z
    .enum(["Tinto", "Branco", "Rosé", "Espumante", "Fortificado", "Sobremesa"])
    .optional(),
  size: z
    .enum(["187ml", "375ml", "750ml", "1L", "1.5L", "3L", "6L"])
    .optional(),
  inStock: z.enum(["all", "available", "out-of-stock"]).default("all"),
  discontinued: z.enum(["all", "active", "discontinued"]).default("active"),
  sortBy: z
    .enum(["name", "country", "type", "inStock", "createdAt", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const updateStockSchema = z.object({
  id: z.string().uuid("ID inválido"),
  inStock: z
    .string()
    .regex(/^\d+$/, "Estoque deve ser um número")
    .transform((val) => val.trim())
    .refine((val) => parseInt(val) >= 0, "Estoque não pode ser negativo"),
});

// Tipos
export type Wine = typeof wines.$inferSelect;
export type CreateWineInput = z.infer<typeof createWineSchema>;
export type UpdateWineInput = z.infer<typeof updateWineSchema>;
export type GetWinesInput = z.infer<typeof getWinesSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;

export type WineActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

export type PaginatedWines = {
  wines: Wine[];
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
};

/**
 * Criar um novo wine
 */
export async function createWine(
  input: CreateWineInput
): Promise<WineActionResult<Wine>> {
  try {
    // Validação dos dados
    const validatedData = createWineSchema.parse(input);

    // Verificar se já existe wine com o mesmo nome, país e tipo
    const existingWine = await db
      .select({ id: wines.id })
      .from(wines)
      .where(
        and(
          ilike(wines.name, validatedData.name),
          ilike(wines.country, validatedData.country),
          eq(wines.type, validatedData.type),
          eq(wines.size, validatedData.size)
        )
      )
      .limit(1);

    if (existingWine.length > 0) {
      return {
        success: false,
        error: "Já existe um vinho com este nome, país, tipo e tamanho",
      };
    }

    // Inserir novo wine
    const [newWine] = await db.insert(wines).values(validatedData).returning();

    // Revalidar cache
    revalidatePath("/wines");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: newWine,
    };
  } catch (error) {
    console.error("Erro ao criar wine:", error);

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
 * Buscar wines com paginação e filtros avançados
 */
export async function getWines(
  input: Partial<GetWinesInput> = {}
): Promise<WineActionResult<PaginatedWines>> {
  try {
    // Validação dos parâmetros
    const validatedInput = getWinesSchema.parse(input);
    const {
      page,
      limit,
      search,
      country,
      type,
      size,
      inStock,
      discontinued,
      sortBy,
      sortOrder,
    } = validatedInput;

    // Calcular offset
    const offset = (page - 1) * limit;

    // Construir condições de filtro
    const conditions = [];

    // Filtro de busca no nome
    if (search?.trim()) {
      conditions.push(ilike(wines.name, `%${search.trim()}%`));
    }

    // Filtro por país
    if (country?.trim()) {
      conditions.push(ilike(wines.country, `%${country.trim()}%`));
    }

    // Filtro por tipo
    if (type) {
      conditions.push(eq(wines.type, type));
    }

    // Filtro por tamanho
    if (size) {
      conditions.push(eq(wines.size, size));
    }

    // Filtro por estoque
    if (inStock === "available") {
      conditions.push(gte(wines.inStock, "1"));
    } else if (inStock === "out-of-stock") {
      conditions.push(eq(wines.inStock, "0"));
    }

    // Filtro por descontinuado
    if (discontinued === "active") {
      conditions.push(eq(wines.discontinued, false));
    } else if (discontinued === "discontinued") {
      conditions.push(eq(wines.discontinued, true));
    }

    // Combinar condições usando and()
    const whereCondition =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
        ? conditions[0]
        : and(...conditions);

    // Query para buscar wines
    const winesQuery = db.select().from(wines).$dynamic();

    // Query para contar total
    const countQuery = db.select({ count: count() }).from(wines).$dynamic();

    // Queries para filtros disponíveis
    const filtersQuery = {
      countries: db
        .selectDistinct({ country: wines.country })
        .from(wines)
        .where(eq(wines.discontinued, false)),
      types: db
        .selectDistinct({ type: wines.type })
        .from(wines)
        .where(eq(wines.discontinued, false)),
      sizes: db
        .selectDistinct({ size: wines.size })
        .from(wines)
        .where(eq(wines.discontinued, false)),
    };

    // Aplicar filtros se existirem
    if (whereCondition) {
      winesQuery.where(whereCondition);
      countQuery.where(whereCondition);
    }

    // Aplicar ordenação
    const orderColumn = wines[sortBy];
    const orderFn = sortOrder === "asc" ? asc : desc;
    winesQuery.orderBy(orderFn(orderColumn));

    // Aplicar paginação
    winesQuery.limit(limit).offset(offset);

    // Executar queries em paralelo
    const [
      winesResult,
      totalResult,
      countriesResult,
      typesResult,
      sizesResult,
    ] = await Promise.all([
      winesQuery,
      countQuery,
      filtersQuery.countries,
      filtersQuery.types,
      filtersQuery.sizes,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        wines: winesResult,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        filters: {
          countries: countriesResult.map((r) => r.country).sort(),
          types: typesResult.map((r) => r.type).sort(),
          sizes: sizesResult.map((r) => r.size).sort(),
        },
      },
    };
  } catch (error) {
    console.error("Erro ao buscar wines:", error);

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
 * Buscar wine por ID
 */
export async function getWineById(id: string): Promise<WineActionResult<Wine>> {
  try {
    // Validação do ID
    const validatedId = z.string().uuid("ID inválido").parse(id);

    // Buscar wine
    const [wine] = await db
      .select()
      .from(wines)
      .where(eq(wines.id, validatedId))
      .limit(1);

    if (!wine) {
      return {
        success: false,
        error: "Vinho não encontrado",
      };
    }

    return {
      success: true,
      data: wine,
    };
  } catch (error) {
    console.error("Erro ao buscar wine:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "ID inválido",
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Atualizar wine
 */
export async function updateWine(
  input: UpdateWineInput
): Promise<WineActionResult<Wine>> {
  try {
    // Validação dos dados
    const validatedData = updateWineSchema.parse(input);

    // Verificar se wine existe
    const existingWine = await db
      .select({ id: wines.id })
      .from(wines)
      .where(eq(wines.id, validatedData.id))
      .limit(1);

    if (existingWine.length === 0) {
      return {
        success: false,
        error: "Vinho não encontrado",
      };
    }

    // Verificar se já existe outro wine com os mesmos dados
    const duplicateWine = await db
      .select({ id: wines.id })
      .from(wines)
      .where(
        and(
          ilike(wines.name, validatedData.name),
          ilike(wines.country, validatedData.country),
          eq(wines.type, validatedData.type),
          eq(wines.size, validatedData.size)
        )
      )
      .limit(1);

    if (duplicateWine.length > 0 && duplicateWine[0].id !== validatedData.id) {
      return {
        success: false,
        error: "Já existe outro vinho com este nome, país, tipo e tamanho",
      };
    }

    // Atualizar wine
    const [updatedWine] = await db
      .update(wines)
      .set({
        name: validatedData.name,
        country: validatedData.country,
        type: validatedData.type,
        size: validatedData.size,
        inStock: validatedData.inStock,
        discontinued: validatedData.discontinued,
      })
      .where(eq(wines.id, validatedData.id))
      .returning();

    // Revalidar cache
    revalidatePath("/wines");
    revalidatePath("/dashboard");
    revalidatePath(`/wines/${validatedData.id}`);

    return {
      success: true,
      data: updatedWine,
    };
  } catch (error) {
    console.error("Erro ao atualizar wine:", error);

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
 * Atualizar apenas o estoque de um wine
 */
export async function updateWineStock(
  input: UpdateStockInput
): Promise<WineActionResult<Wine>> {
  try {
    // Validação dos dados
    const validatedData = updateStockSchema.parse(input);

    // Verificar se wine existe
    const existingWine = await db
      .select({ id: wines.id, inStock: wines.inStock })
      .from(wines)
      .where(eq(wines.id, validatedData.id))
      .limit(1);

    if (existingWine.length === 0) {
      return {
        success: false,
        error: "Vinho não encontrado",
      };
    }

    // Atualizar apenas o estoque
    const [updatedWine] = await db
      .update(wines)
      .set({ inStock: validatedData.inStock })
      .where(eq(wines.id, validatedData.id))
      .returning();

    // Revalidar cache
    revalidatePath("/wines");
    revalidatePath("/dashboard");
    revalidatePath(`/wines/${validatedData.id}`);

    return {
      success: true,
      data: updatedWine,
    };
  } catch (error) {
    console.error("Erro ao atualizar estoque:", error);

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
 * Marcar/desmarcar wine como descontinuado
 */
export async function toggleWineDiscontinued(
  id: string,
  discontinued: boolean
): Promise<WineActionResult<Wine>> {
  try {
    // Validação do ID
    const validatedId = z.string().uuid("ID inválido").parse(id);

    // Verificar se wine existe
    const existingWine = await db
      .select({ id: wines.id, discontinued: wines.discontinued })
      .from(wines)
      .where(eq(wines.id, validatedId))
      .limit(1);

    if (existingWine.length === 0) {
      return {
        success: false,
        error: "Vinho não encontrado",
      };
    }

    // Atualizar status de descontinuado
    const [updatedWine] = await db
      .update(wines)
      .set({ discontinued })
      .where(eq(wines.id, validatedId))
      .returning();

    // Revalidar cache
    revalidatePath("/wines");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: updatedWine,
    };
  } catch (error) {
    console.error("Erro ao atualizar status:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "ID inválido",
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Deletar wine (soft delete - marca como descontinuado)
 */
export async function deleteWine(input: {
  id: string;
}): Promise<WineActionResult<void>> {
  try {
    // Validação do ID
    const validatedData = deleteWineSchema.parse(input);

    // Verificar se wine existe
    const existingWine = await db
      .select({ id: wines.id })
      .from(wines)
      .where(eq(wines.id, validatedData.id))
      .limit(1);

    if (existingWine.length === 0) {
      return {
        success: false,
        error: "Vinho não encontrado",
      };
    }

    // Soft delete - marcar como descontinuado ao invés de deletar
    await db
      .update(wines)
      .set({ discontinued: true })
      .where(eq(wines.id, validatedData.id));

    // Revalidar cache
    revalidatePath("/wines");
    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao deletar wine:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "ID inválido",
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Deletar wine permanentemente (hard delete)
 */
export async function deleteWinePermanently(input: {
  id: string;
}): Promise<WineActionResult<void>> {
  try {
    // Validação do ID
    const validatedData = deleteWineSchema.parse(input);

    // Verificar se wine existe
    const existingWine = await db
      .select({ id: wines.id })
      .from(wines)
      .where(eq(wines.id, validatedData.id))
      .limit(1);

    if (existingWine.length === 0) {
      return {
        success: false,
        error: "Vinho não encontrado",
      };
    }

    // Verificar se há relacionamentos ativos
    const hasRelationships = await db
      .select({ id: customerWinesList.id })
      .from(customerWinesList)
      .where(eq(customerWinesList.wineId, validatedData.id))
      .limit(1);

    if (hasRelationships.length > 0) {
      return {
        success: false,
        error:
          "Não é possível excluir este vinho pois está associado a clientes. Use a opção de descontinuar.",
      };
    }

    // Hard delete
    await db.delete(wines).where(eq(wines.id, validatedData.id));

    // Revalidar cache
    revalidatePath("/wines");
    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao deletar wine permanentemente:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "ID inválido",
      };
    }

    // Verificar se é erro de constraint (relacionamentos)
    if (error instanceof Error && error.message.includes("foreign key")) {
      return {
        success: false,
        error:
          "Não é possível excluir este vinho pois está associado a clientes",
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Buscar estatísticas de wines
 */
export async function getWineStats(): Promise<
  WineActionResult<{
    total: number;
    active: number;
    discontinued: number;
    outOfStock: number;
    lowStock: number;
    recentCount: number;
    topCountries: { country: string; count: number }[];
    topTypes: { type: string; count: number }[];
  }>
> {
  try {
    // Data de 30 dias atrás
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Buscar estatísticas em paralelo
    const [
      totalResult,
      activeResult,
      discontinuedResult,
      outOfStockResult,
      lowStockResult,
      recentResult,
      topCountriesResult,
      topTypesResult,
    ] = await Promise.all([
      // Total de wines
      db.select({ count: count() }).from(wines),

      // Wines ativos
      db
        .select({ count: count() })
        .from(wines)
        .where(eq(wines.discontinued, false)),

      // Wines descontinuados
      db
        .select({ count: count() })
        .from(wines)
        .where(eq(wines.discontinued, true)),

      // Wines sem estoque
      db
        .select({ count: count() })
        .from(wines)
        .where(and(eq(wines.inStock, "0"), eq(wines.discontinued, false))),

      // Wines com estoque baixo (1-5)
      db
        .select({ count: count() })
        .from(wines)
        .where(
          and(
            or(
              eq(wines.inStock, "1"),
              eq(wines.inStock, "2"),
              eq(wines.inStock, "3"),
              eq(wines.inStock, "4"),
              eq(wines.inStock, "5")
            ),
            eq(wines.discontinued, false)
          )
        ),

      // Wines criados nos últimos 30 dias
      db
        .select({ count: count() })
        .from(wines)
        .where(gte(wines.createdAt, thirtyDaysAgo)),

      // Top 5 países
      db
        .select({
          country: wines.country,
          count: count(),
        })
        .from(wines)
        .where(eq(wines.discontinued, false))
        .groupBy(wines.country)
        .orderBy(desc(count()))
        .limit(5),

      // Top tipos
      db
        .select({
          type: wines.type,
          count: count(),
        })
        .from(wines)
        .where(eq(wines.discontinued, false))
        .groupBy(wines.type)
        .orderBy(desc(count())),
    ]);

    return {
      success: true,
      data: {
        total: totalResult[0]?.count || 0,
        active: activeResult[0]?.count || 0,
        discontinued: discontinuedResult[0]?.count || 0,
        outOfStock: outOfStockResult[0]?.count || 0,
        lowStock: lowStockResult[0]?.count || 0,
        recentCount: recentResult[0]?.count || 0,
        topCountries: topCountriesResult.map((r) => ({
          country: r.country,
          count: r.count,
        })),
        topTypes: topTypesResult.map((r) => ({ type: r.type, count: r.count })),
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
 * Buscar wines com baixo estoque
 */
export async function getLowStockWines(
  threshold: number = 5
): Promise<WineActionResult<Wine[]>> {
  try {
    // Validar threshold
    const validThreshold = z.number().min(0).max(100).parse(threshold);

    // Construir condições para estoque baixo
    const stockConditions = [];
    for (let i = 0; i <= validThreshold; i++) {
      stockConditions.push(eq(wines.inStock, i.toString()));
    }

    // Buscar wines com estoque baixo
    const lowStockWines = await db
      .select()
      .from(wines)
      .where(and(or(...stockConditions), eq(wines.discontinued, false)))
      .orderBy(asc(wines.inStock), asc(wines.name));

    return {
      success: true,
      data: lowStockWines,
    };
  } catch (error) {
    console.error("Erro ao buscar wines com estoque baixo:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Threshold inválido",
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}
