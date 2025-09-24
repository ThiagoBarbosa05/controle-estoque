"use server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { eq, desc, asc, count, and, or, ilike, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schemas de validação
const createUserSchema = z.object({
  id: z
    .string()
    .min(1, "ID é obrigatório")
    .max(255, "ID deve ter no máximo 255 caracteres"),
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres"),
  email: z
    .string()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),
  emailVerified: z.boolean().default(false),
  image: z
    .string()
    .url("URL da imagem inválida")
    .max(500, "URL da imagem deve ter no máximo 500 caracteres")
    .optional()
    .nullable(),
});

const updateUserSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres")
    .optional(),
  email: z
    .string()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres")
    .optional(),
  emailVerified: z.boolean().optional(),
  image: z
    .string()
    .url("URL da imagem inválida")
    .max(500, "URL da imagem deve ter no máximo 500 caracteres")
    .optional()
    .nullable(),
});

const getUsersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z
    .enum(["name", "email", "createdAt", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  emailVerified: z.enum(["all", "verified", "unverified"]).default("all"),
});

const bulkDeleteUsersSchema = z.object({
  userIds: z
    .array(z.string().min(1, "ID do usuário inválido"))
    .min(1, "Pelo menos um usuário deve ser selecionado")
    .max(50, "Máximo 50 usuários por operação"),
});

const bulkUpdateUsersSchema = z.object({
  userIds: z
    .array(z.string().min(1, "ID do usuário inválido"))
    .min(1, "Pelo menos um usuário deve ser selecionado")
    .max(50, "Máximo 50 usuários por operação"),
  updates: z.object({
    emailVerified: z.boolean().optional(),
  }),
});

// Tipos
export type User = typeof user.$inferSelect;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUsersInput = z.infer<typeof getUsersSchema>;
export type BulkDeleteUsersInput = z.infer<typeof bulkDeleteUsersSchema>;
export type BulkUpdateUsersInput = z.infer<typeof bulkUpdateUsersSchema>;

export type UserActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

export type PaginatedUsers = {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type UserStats = {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  usersCreatedToday: number;
  usersCreatedThisWeek: number;
  usersCreatedThisMonth: number;
  verificationRate: number;
};

/**
 * Criar um novo usuário
 */
export async function createUser(
  input: CreateUserInput
): Promise<UserActionResult<User>> {
  try {
    // Validação dos dados
    const validatedData = createUserSchema.parse(input);

    // Verificar se já existe usuário com o mesmo email
    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return {
        success: false,
        error: "Já existe um usuário com este email",
      };
    }

    // Verificar se já existe usuário com o mesmo ID
    const existingUserId = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, validatedData.id))
      .limit(1);

    if (existingUserId.length > 0) {
      return {
        success: false,
        error: "Já existe um usuário com este ID",
      };
    }

    // Criar usuário
    const [newUser] = await db.insert(user).values(validatedData).returning();

    revalidatePath("/users");

    return {
      success: true,
      data: newUser,
    };
  } catch (error) {
    console.error("Erro ao criar usuário:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Dados inválidos",
        errors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Buscar usuários com filtros, ordenação e paginação
 */
export async function getUsers(
  input: Partial<GetUsersInput> = {}
): Promise<UserActionResult<PaginatedUsers>> {
  try {
    // Validação dos dados
    const validatedInput = getUsersSchema.parse(input);
    const { page, limit, sortBy, sortOrder, search, emailVerified } =
      validatedInput;

    // Calcular offset
    const offset = (page - 1) * limit;

    // Construir query base
    let baseQuery = db.select().from(user);
    let countQuery = db.select({ count: count() }).from(user);

    // Aplicar filtros
    const filters = [];

    // Filtro de busca por nome ou email
    if (search?.trim()) {
      const searchTerm = `%${search.trim()}%`;
      filters.push(
        or(ilike(user.name, searchTerm), ilike(user.email, searchTerm))
      );
    }

    // Filtro por status de verificação de email
    if (emailVerified !== "all") {
      filters.push(eq(user.emailVerified, emailVerified === "verified"));
    }

    // Aplicar filtros se existirem
    if (filters.length > 0) {
      const whereCondition =
        filters.length === 1 ? filters[0] : and(...filters);
      baseQuery = baseQuery.where(whereCondition) as typeof baseQuery;
      countQuery = countQuery.where(whereCondition) as typeof countQuery;
    }

    // Aplicar ordenação
    const orderFunction = sortOrder === "asc" ? asc : desc;
    let orderColumn:
      | typeof user.name
      | typeof user.email
      | typeof user.createdAt
      | typeof user.updatedAt;

    switch (sortBy) {
      case "name":
        orderColumn = user.name;
        break;
      case "email":
        orderColumn = user.email;
        break;
      case "updatedAt":
        orderColumn = user.updatedAt;
        break;
      default:
        orderColumn = user.createdAt;
        break;
    }

    baseQuery = baseQuery.orderBy(
      orderFunction(orderColumn)
    ) as typeof baseQuery;

    // Aplicar paginação
    baseQuery = baseQuery.limit(limit).offset(offset) as typeof baseQuery;

    // Executar queries em paralelo
    const [usersResult, totalResult] = await Promise.all([
      baseQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        users: usersResult,
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
    console.error("Erro ao buscar usuários:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Parâmetros de busca inválidos",
        errors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Buscar usuário por ID
 */
export async function getUserById(
  userId: string
): Promise<UserActionResult<User>> {
  try {
    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        error: "ID do usuário é obrigatório",
      };
    }

    const [userResult] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userResult) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    return {
      success: true,
      data: userResult,
    };
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Buscar usuário por email
 */
export async function getUserByEmail(
  email: string
): Promise<UserActionResult<User>> {
  try {
    if (!email || typeof email !== "string") {
      return {
        success: false,
        error: "Email é obrigatório",
      };
    }

    // Validar formato do email
    const emailValidation = z.string().email().safeParse(email);
    if (!emailValidation.success) {
      return {
        success: false,
        error: "Email inválido",
      };
    }

    const [userResult] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!userResult) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    return {
      success: true,
      data: userResult,
    };
  } catch (error) {
    console.error("Erro ao buscar usuário por email:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Atualizar usuário
 */
export async function updateUser(
  input: UpdateUserInput
): Promise<UserActionResult<User>> {
  try {
    // Validação dos dados
    const validatedData = updateUserSchema.parse(input);
    const { id, ...updateData } = validatedData;

    // Verificar se usuário existe
    const existingUser = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    // Se está atualizando o email, verificar se não existe outro usuário com o mesmo email
    if (updateData.email && updateData.email !== existingUser[0].email) {
      const emailExists = await db
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.email, updateData.email), eq(user.id, id)))
        .limit(1);

      if (emailExists.length > 0) {
        return {
          success: false,
          error: "Já existe um usuário com este email",
        };
      }
    }

    // Remover campos undefined do updateData
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdateData).length === 0) {
      return {
        success: false,
        error: "Nenhum campo para atualizar foi fornecido",
      };
    }

    // Atualizar usuário
    const [updatedUser] = await db
      .update(user)
      .set(cleanUpdateData)
      .where(eq(user.id, id))
      .returning();

    revalidatePath("/users");

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Dados inválidos",
        errors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Deletar usuário
 */
export async function deleteUser(
  userId: string
): Promise<UserActionResult<{ id: string }>> {
  try {
    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        error: "ID do usuário é obrigatório",
      };
    }

    // Verificar se usuário existe
    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    // Deletar usuário (isso também deletará sessões e contas devido ao cascade)
    await db.delete(user).where(eq(user.id, userId));

    revalidatePath("/users");

    return {
      success: true,
      data: { id: userId },
    };
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Deletar múltiplos usuários
 */
export async function bulkDeleteUsers(
  input: BulkDeleteUsersInput
): Promise<UserActionResult<{ deletedCount: number; deletedIds: string[] }>> {
  try {
    // Validação dos dados
    const validatedData = bulkDeleteUsersSchema.parse(input);
    const { userIds } = validatedData;

    // Verificar quantos usuários existem e deletar
    const deletedIds: string[] = [];

    for (const userId of userIds) {
      try {
        const result = await db
          .delete(user)
          .where(eq(user.id, userId))
          .returning({ id: user.id });

        if (result.length > 0) {
          deletedIds.push(result[0].id);
        }
      } catch (error) {
        console.warn(`Erro ao deletar usuário ${userId}:`, error);
      }
    }

    revalidatePath("/users");

    return {
      success: true,
      data: {
        deletedCount: deletedIds.length,
        deletedIds,
      },
    };
  } catch (error) {
    console.error("Erro ao deletar usuários em lote:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Dados inválidos",
        errors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Atualizar múltiplos usuários
 */
export async function bulkUpdateUsers(
  input: BulkUpdateUsersInput
): Promise<UserActionResult<{ updatedCount: number; updatedIds: string[] }>> {
  try {
    // Validação dos dados
    const validatedData = bulkUpdateUsersSchema.parse(input);
    const { userIds, updates } = validatedData;

    // Verificar se há atualizações para fazer
    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        error: "Nenhuma atualização fornecida",
      };
    }

    const updatedIds: string[] = [];

    // Atualizar cada usuário
    for (const userId of userIds) {
      try {
        const result = await db
          .update(user)
          .set(updates)
          .where(eq(user.id, userId))
          .returning({ id: user.id });

        if (result.length > 0) {
          updatedIds.push(result[0].id);
        }
      } catch (error) {
        console.warn(`Erro ao atualizar usuário ${userId}:`, error);
      }
    }

    revalidatePath("/users");

    return {
      success: true,
      data: {
        updatedCount: updatedIds.length,
        updatedIds,
      },
    };
  } catch (error) {
    console.error("Erro ao atualizar usuários em lote:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Dados inválidos",
        errors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Verificar email do usuário
 */
export async function verifyUserEmail(
  userId: string
): Promise<UserActionResult<User>> {
  try {
    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        error: "ID do usuário é obrigatório",
      };
    }

    // Verificar se usuário existe
    const existingUser = await db
      .select({ id: user.id, emailVerified: user.emailVerified })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    if (existingUser[0].emailVerified) {
      return {
        success: false,
        error: "Email já está verificado",
      };
    }

    // Verificar email
    const [updatedUser] = await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.id, userId))
      .returning();

    revalidatePath("/users");

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    console.error("Erro ao verificar email do usuário:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Obter estatísticas dos usuários
 */
export async function getUserStats(): Promise<UserActionResult<UserStats>> {
  try {
    // Data de hoje, início da semana e início do mês
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Executar todas as queries em paralelo
    const [
      totalUsersResult,
      verifiedUsersResult,
      unverifiedUsersResult,
      usersCreatedTodayResult,
      usersCreatedThisWeekResult,
      usersCreatedThisMonthResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(user),
      db
        .select({ count: count() })
        .from(user)
        .where(eq(user.emailVerified, true)),
      db
        .select({ count: count() })
        .from(user)
        .where(eq(user.emailVerified, false)),
      db
        .select({ count: count() })
        .from(user)
        .where(gte(user.createdAt, today)),
      db
        .select({ count: count() })
        .from(user)
        .where(gte(user.createdAt, startOfWeek)),
      db
        .select({ count: count() })
        .from(user)
        .where(gte(user.createdAt, startOfMonth)),
    ]);

    const totalUsers = totalUsersResult[0]?.count || 0;
    const verifiedUsers = verifiedUsersResult[0]?.count || 0;
    const unverifiedUsers = unverifiedUsersResult[0]?.count || 0;
    const usersCreatedToday = usersCreatedTodayResult[0]?.count || 0;
    const usersCreatedThisWeek = usersCreatedThisWeekResult[0]?.count || 0;
    const usersCreatedThisMonth = usersCreatedThisMonthResult[0]?.count || 0;

    const verificationRate =
      totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0;

    return {
      success: true,
      data: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers,
        usersCreatedToday,
        usersCreatedThisWeek,
        usersCreatedThisMonth,
        verificationRate: Math.round(verificationRate * 100) / 100,
      },
    };
  } catch (error) {
    console.error("Erro ao obter estatísticas dos usuários:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}
