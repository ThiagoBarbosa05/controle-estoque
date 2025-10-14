"use server";

import { db } from "@/db";
import { wines } from "@/db/schema";
import { eq, desc, asc, ilike, count, and, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  revalidateWinesCache,
  revalidateWineStatsCache,
} from "../(app)/wines/actions/wines-cache";
import {
  wineCountryEnum,
  wineSizeEnum,
  wineTypeEnum,
} from "../(app)/wines/actions/schemas/schema";

const createWineSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim()
    .transform((val) => val.replace(/\s+/g, " ")),
  country: wineCountryEnum,
  type: wineTypeEnum,
  size: wineSizeEnum,
  inStock: z.coerce
    .number()
    .int("Estoque deve ser um número inteiro")
    .min(0, "Estoque não pode ser negativo"),
  minStock: z.coerce
    .number()
    .int("Estoque mínimo deve ser um número inteiro")
    .min(0, "Estoque mínimo não pode ser negativo"),
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
  country: wineCountryEnum,
  type: wineTypeEnum,
  size: wineSizeEnum,
  inStock: z.coerce
    .number()
    .int("Estoque deve ser um número inteiro")
    .min(0, "Estoque não pode ser negativo"),
  minStock: z.coerce
    .number()
    .int("Estoque mínimo deve ser um número inteiro")
    .min(0, "Estoque mínimo não pode ser negativo"),
  discontinued: z.boolean().default(false),
});

const deleteWineSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

const getWinesSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  country: wineCountryEnum.optional(),
  type: wineTypeEnum.optional(),
  size: wineSizeEnum.optional(),
  inStock: z.enum(["all", "available", "out-of-stock"]).default("all"),
  discontinued: z.enum(["all", "active", "discontinued"]).default("active"),
  sortBy: z
    .enum(["name", "country", "type", "inStock", "createdAt", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const updateStockSchema = z.object({
  id: z.string().uuid("ID inválido"),
  inStock: z.coerce
    .number()
    .int("Estoque deve ser um número inteiro")
    .min(0, "Estoque não pode ser negativo"),
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

// Tipos para estatísticas
type StatsRow = {
  total: string | number;
  active: string | number;
  discontinued: string | number;
  out_of_stock: string | number;
  low_stock: string | number;
  recent_count: string | number;
};

type CountryRow = {
  country: string;
  count: string | number;
};

type TypeRow = {
  type: string;
  count: string | number;
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
    const [newWine] = await db
      .insert(wines)
      .values({
        ...validatedData,
        externalId: nanoid(),
      })
      .returning();

    // Revalidar cache usando tags
    await revalidateWinesCache();

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
 * Buscar wines com paginação e filtros avançados (otimizado com cache)
 */
export async function getWines(
  input: Partial<GetWinesInput> = {}
): Promise<WineActionResult<PaginatedWines>> {
  try {
    // Validação dos parâmetros
    const validatedInput = getWinesSchema.parse(input);

    return await getCachedWines(validatedInput);
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
 * Versão com cache da busca de vinhos
 */
const getCachedWines = unstable_cache(
  async (
    validatedInput: GetWinesInput
  ): Promise<WineActionResult<PaginatedWines>> => {
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

    // Filtro de busca no nome (melhorado para buscar em nome e país)
    if (search?.trim()) {
      const searchTerm = search.trim().toLowerCase();
      conditions.push(
        or(
          ilike(wines.name, `%${searchTerm}%`),
          ilike(wines.country, `%${searchTerm}%`)
        )
      );
    }

    // Filtro por país (exato)
    if (country?.trim() && country !== "all") {
      conditions.push(eq(wines.country, country.trim()));
    }

    // Filtro por tipo
    if (type && type !== "all") {
      conditions.push(eq(wines.type, type.trim()));
    }

    // Filtro por tamanho
    if (size && size !== "all") {
      conditions.push(eq(wines.size, size));
    }

    // Filtro por estoque (melhorado)
    if (inStock === "available") {
      conditions.push(sql`${wines.inStock} > 0`);
    } else if (inStock === "out-of-stock") {
      conditions.push(eq(wines.inStock, 0));
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

    // Executar queries em paralelo para melhor performance
    const [winesResult, totalResult, filtersResult] = await Promise.all([
      // Buscar wines com paginação e ordenação
      db
        .select()
        .from(wines)
        .where(whereCondition)
        .orderBy(sortOrder === "asc" ? asc(wines[sortBy]) : desc(wines[sortBy]))
        .limit(limit)
        .offset(offset),

      // Contar total
      db.select({ count: count() }).from(wines).where(whereCondition),

      // Buscar filtros disponíveis em paralelo
      Promise.all([
        db
          .selectDistinct({ country: wines.country })
          .from(wines)
          .where(
            and(
              eq(wines.discontinued, false),
              sql`${wines.country} IS NOT NULL`
            )
          )
          .orderBy(asc(wines.country)),
        db
          .selectDistinct({ type: wines.type })
          .from(wines)
          .where(
            and(eq(wines.discontinued, false), sql`${wines.type} IS NOT NULL`)
          )
          .orderBy(asc(wines.type)),
        db
          .selectDistinct({ size: wines.size })
          .from(wines)
          .where(
            and(eq(wines.discontinued, false), sql`${wines.size} IS NOT NULL`)
          )
          .orderBy(asc(wines.size)),
      ]),
    ]);

    const [countriesResult, typesResult, sizesResult] = filtersResult;
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
          countries: countriesResult
            .map((r) => r.country)
            .filter(Boolean) as string[],
          types: typesResult.map((r) => r.type).filter(Boolean) as string[],
          sizes: sizesResult.map((r) => r.size).filter(Boolean) as string[],
        },
      },
    };
  },
  ["wines-list"],
  {
    tags: ["wines"],
    revalidate: 300, // 5 minutos
  }
);

/**
 * Buscar wine por ID
 */
export async function getWineById(id: string): Promise<WineActionResult<Wine>> {
  try {
    // Validação do ID
    const validatedId = z.string().uuid("ID inválido").parse(id);

    // Buscar wine com cache
    const wine = await getCachedWineById(validatedId);

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
 * Cache para busca de vinho por ID
 */
const getCachedWineById = unstable_cache(
  async (id: string) => {
    const [wine] = await db
      .select()
      .from(wines)
      .where(eq(wines.id, id))
      .limit(1);

    return wine;
  },
  ["wine-by-id"],
  {
    tags: ["wines"],
    revalidate: 300, // 5 minutos
  }
);

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
        minStock: validatedData.minStock,
        discontinued: validatedData.discontinued,
      })
      .where(eq(wines.id, validatedData.id))
      .returning();

    // Revalidar cache usando tags
    await revalidateWinesCache();

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

    // Revalidar cache usando tags
    await revalidateWinesCache();
    await revalidateWineStatsCache();

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
 * Buscar estatísticas de wines (otimizado com cache)
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
    return await getCachedWineStats();
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Versão com cache das estatísticas de vinhos
 */
const getCachedWineStats = unstable_cache(
  async () => {
    // Data de 30 dias atrás
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Query única otimizada usando SQL bruto para melhor performance
    const statsQuery = sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE discontinued = false) as active,
        COUNT(*) FILTER (WHERE discontinued = true) as discontinued,
        COUNT(*) FILTER (WHERE in_stock = 0 AND discontinued = false) as out_of_stock,
        COUNT(*) FILTER (WHERE in_stock BETWEEN 1 AND 5 AND discontinued = false) as low_stock,
        COUNT(*) FILTER (WHERE created_at >= ${thirtyDaysAgo}) as recent_count
      FROM ${wines}
    `;

    const topCountriesQuery = sql`
      SELECT country, COUNT(*) as count
      FROM ${wines}
      WHERE discontinued = false AND country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
      LIMIT 5
    `;

    const topTypesQuery = sql`
      SELECT type, COUNT(*) as count
      FROM ${wines}
      WHERE discontinued = false AND type IS NOT NULL
      GROUP BY type
      ORDER BY count DESC
    `;

    // Executar queries em paralelo
    const [statsResult, topCountriesResult, topTypesResult] = await Promise.all(
      [
        db.execute(statsQuery),
        db.execute(topCountriesQuery),
        db.execute(topTypesQuery),
      ]
    );

    const stats = statsResult.rows[0] as StatsRow;

    return {
      success: true,
      data: {
        total: Number(stats.total) || 0,
        active: Number(stats.active) || 0,
        discontinued: Number(stats.discontinued) || 0,
        outOfStock: Number(stats.out_of_stock) || 0,
        lowStock: Number(stats.low_stock) || 0,
        recentCount: Number(stats.recent_count) || 0,
        topCountries: topCountriesResult.rows.map((r: CountryRow) => ({
          country: r.country || "Não informado",
          count: Number(r.count),
        })),
        topTypes: topTypesResult.rows.map((r: TypeRow) => ({
          type: r.type || "Não informado",
          count: Number(r.count),
        })),
      },
    };
  },
  ["wine-stats"],
  {
    tags: ["wine-stats"],
    revalidate: 600, // 10 minutos
  }
);

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
    await revalidateWinesCache();

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
 * Buscar wines com estoque baixo (otimizado)
 */
export async function getLowStockWines(
  threshold: number = 5
): Promise<WineActionResult<Wine[]>> {
  try {
    return await getCachedLowStockWines(threshold);
  } catch (error) {
    console.error("Erro ao buscar wines com estoque baixo:", error);

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Versão com cache dos vinhos com estoque baixo
 */
const getCachedLowStockWines = unstable_cache(
  async (threshold: number) => {
    // Validar threshold
    const validThreshold = z.number().min(0).max(100).parse(threshold);

    // Buscar wines com estoque baixo usando SQL otimizado
    const lowStockWines = await db
      .select()
      .from(wines)
      .where(
        and(
          sql`${wines.inStock} BETWEEN 0 AND ${validThreshold}`,
          eq(wines.discontinued, false)
        )
      )
      .orderBy(asc(wines.inStock), asc(wines.name));

    return {
      success: true,
      data: lowStockWines,
    };
  },
  ["low-stock-wines"],
  {
    tags: ["wines", "low-stock"],
    revalidate: 300, // 5 minutos
  }
);

/**
 * Buscar filtros disponíveis (otimizado com cache)
 */
export async function getWineFilters(): Promise<
  WineActionResult<{
    countries: string[];
    types: string[];
    sizes: string[];
  }>
> {
  try {
    return await getCachedWineFilters();
  } catch (error) {
    console.error("Erro ao buscar filtros:", error);

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Versão com cache dos filtros de vinhos
 */
const getCachedWineFilters = unstable_cache(
  async () => {
    // Buscar filtros disponíveis em paralelo
    const [countriesResult, typesResult, sizesResult] = await Promise.all([
      db
        .selectDistinct({ country: wines.country })
        .from(wines)
        .where(
          and(eq(wines.discontinued, false), sql`${wines.country} IS NOT NULL`)
        )
        .orderBy(asc(wines.country)),
      db
        .selectDistinct({ type: wines.type })
        .from(wines)
        .where(
          and(eq(wines.discontinued, false), sql`${wines.type} IS NOT NULL`)
        )
        .orderBy(asc(wines.type)),
      db
        .selectDistinct({ size: wines.size })
        .from(wines)
        .where(
          and(eq(wines.discontinued, false), sql`${wines.size} IS NOT NULL`)
        )
        .orderBy(asc(wines.size)),
    ]);

    return {
      success: true,
      data: {
        countries: countriesResult
          .map((r) => r.country)
          .filter(Boolean) as string[],
        types: typesResult.map((r) => r.type).filter(Boolean) as string[],
        sizes: sizesResult.map((r) => r.size).filter(Boolean) as string[],
      },
    };
  },
  ["wine-filters"],
  {
    tags: ["wine-filters"],
    revalidate: 600, // 10 minutos
  }
);
