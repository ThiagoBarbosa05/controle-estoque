"use server";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, desc, asc, ilike, count, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schemas de validação
const createCustomerSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim()
    .transform((val) => val.replace(/\s+/g, " ")), // Remove espaços extras
});

const updateCustomerSchema = z.object({
  id: z.string().uuid("ID inválido"),
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim()
    .transform((val) => val.replace(/\s+/g, " ")),
});

const deleteCustomerSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

const getCustomersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Tipos
export type Customer = typeof customers.$inferSelect;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type GetCustomersInput = z.infer<typeof getCustomersSchema>;

export type CustomerActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

export type PaginatedCustomers = {
  customers: Customer[];
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
 * Criar um novo customer
 */
export async function createCustomer(
  input: CreateCustomerInput
): Promise<CustomerActionResult<Customer>> {
  try {
    // Validação dos dados
    const validatedData = createCustomerSchema.parse(input);

    // Verificar se já existe customer com o mesmo nome
    const existingCustomer = await db
      .select({ id: customers.id })
      .from(customers)
      .where(ilike(customers.name, validatedData.name))
      .limit(1);

    if (existingCustomer.length > 0) {
      return {
        success: false,
        error: "Já existe um cliente com este nome",
      };
    }

    // Inserir novo customer
    const [newCustomer] = await db
      .insert(customers)
      .values(validatedData)
      .returning();

    // Revalidar cache
    revalidatePath("/customers");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: newCustomer,
    };
  } catch (error) {
    console.error("Erro ao criar customer:", error);

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
 * Buscar customers com paginação e filtros
 */
export async function getCustomers(
  input: Partial<GetCustomersInput> = {}
): Promise<CustomerActionResult<PaginatedCustomers>> {
  try {
    // Validação dos parâmetros
    const validatedInput = getCustomersSchema.parse(input);
    const { page, limit, search, sortBy, sortOrder } = validatedInput;

    // Calcular offset
    const offset = (page - 1) * limit;

    // Construir where condition
    const whereCondition = search?.trim()
      ? ilike(customers.name, `%${search.trim()}%`)
      : undefined;

    // Query para buscar customers
    const customersQuery = db.select().from(customers).$dynamic();

    // Query para contar total
    const countQuery = db.select({ count: count() }).from(customers).$dynamic();

    // Aplicar filtros se existirem
    if (whereCondition) {
      customersQuery.where(whereCondition);
      countQuery.where(whereCondition);
    }

    // Aplicar ordenação
    const orderColumn = customers[sortBy];
    const orderFn = sortOrder === "asc" ? asc : desc;
    customersQuery.orderBy(orderFn(orderColumn));

    // Aplicar paginação
    customersQuery.limit(limit).offset(offset);

    // Executar queries em paralelo
    const [customersResult, totalResult] = await Promise.all([
      customersQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        customers: customersResult,
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
    console.error("Erro ao buscar customers:", error);

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
 * Buscar customer por ID
 */
export async function getCustomerById(
  id: string
): Promise<CustomerActionResult<Customer>> {
  try {
    // Validação do ID
    const validatedId = z.string().uuid("ID inválido").parse(id);

    // Buscar customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, validatedId))
      .limit(1);

    if (!customer) {
      return {
        success: false,
        error: "Cliente não encontrado",
      };
    }

    return {
      success: true,
      data: customer,
    };
  } catch (error) {
    console.error("Erro ao buscar customer:", error);

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
 * Atualizar customer
 */
export async function updateCustomer(
  input: UpdateCustomerInput
): Promise<CustomerActionResult<Customer>> {
  try {
    // Validação dos dados
    const validatedData = updateCustomerSchema.parse(input);

    // Verificar se customer existe
    const existingCustomer = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, validatedData.id))
      .limit(1);

    if (existingCustomer.length === 0) {
      return {
        success: false,
        error: "Cliente não encontrado",
      };
    }

    // Verificar se já existe outro customer com o mesmo nome
    const duplicateCustomer = await db
      .select({ id: customers.id })
      .from(customers)
      .where(ilike(customers.name, validatedData.name))
      .limit(1);

    if (
      duplicateCustomer.length > 0 &&
      duplicateCustomer[0].id !== validatedData.id
    ) {
      return {
        success: false,
        error: "Já existe outro cliente com este nome",
      };
    }

    // Atualizar customer
    const [updatedCustomer] = await db
      .update(customers)
      .set({ name: validatedData.name })
      .where(eq(customers.id, validatedData.id))
      .returning();

    // Revalidar cache
    revalidatePath("/customers");
    revalidatePath("/dashboard");
    revalidatePath(`/customers/${validatedData.id}`);

    return {
      success: true,
      data: updatedCustomer,
    };
  } catch (error) {
    console.error("Erro ao atualizar customer:", error);

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
 * Deletar customer
 */
export async function deleteCustomer(input: {
  id: string;
}): Promise<CustomerActionResult<void>> {
  try {
    // Validação do ID
    const validatedData = deleteCustomerSchema.parse(input);

    // Verificar se customer existe
    const existingCustomer = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, validatedData.id))
      .limit(1);

    if (existingCustomer.length === 0) {
      return {
        success: false,
        error: "Cliente não encontrado",
      };
    }

    // Deletar customer (cascade delete cuidará dos relacionamentos)
    await db.delete(customers).where(eq(customers.id, validatedData.id));

    // Revalidar cache
    revalidatePath("/customers");
    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao deletar customer:", error);

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
          "Não é possível excluir este cliente pois possui vinhos associados",
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

/**
 * Buscar estatísticas de customers
 */
export async function getCustomerStats(): Promise<
  CustomerActionResult<{
    total: number;
    recentCount: number;
  }>
> {
  try {
    // Data de 30 dias atrás
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Buscar estatísticas em paralelo
    const [totalResult, recentResult] = await Promise.all([
      db.select({ count: count() }).from(customers),
      db
        .select({ count: count() })
        .from(customers)
        .where(gte(customers.createdAt, thirtyDaysAgo)),
    ]);

    return {
      success: true,
      data: {
        total: totalResult[0]?.count || 0,
        recentCount: recentResult[0]?.count || 0,
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
