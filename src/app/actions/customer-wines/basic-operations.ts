"use server";

import { db } from "@/db";
import { customerWinesList, customers, wines } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";
import {
  addWineToCustomerSchema,
  removeWineFromCustomerSchema,
} from "@/lib/schemas/customer-wines";
import type {
  AddWineToCustomerInput,
  RemoveWineFromCustomerInput,
} from "@/lib/schemas/customer-wines";
import type {
  CustomerWinesActionResult,
  CustomerWinesList,
} from "@/types/customer-wines";
import { CACHE_TAGS } from "@/lib/cache/customer-wines";

/**
 * Cache helper para verificar se cliente existe
 */
const getCachedCustomer = unstable_cache(
  async (customerId: string) => {
    return await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);
  },
  ["customer"],
  {
    tags: [CACHE_TAGS.CUSTOMER_WINES],
    revalidate: 300, // 5 minutos
  }
);

/**
 * Cache helper para verificar se vinho existe
 */
const getCachedWine = unstable_cache(
  async (wineId: string) => {
    return await db
      .select({ id: wines.id, discontinued: wines.discontinued })
      .from(wines)
      .where(eq(wines.id, wineId))
      .limit(1);
  },
  ["wine"],
  {
    tags: [CACHE_TAGS.CUSTOMER_WINES],
    revalidate: 300, // 5 minutos
  }
);

/**
 * Cache helper para verificar associação existente
 */
const getCachedAssociation = unstable_cache(
  async (customerId: string, wineId: string) => {
    return await db
      .select({ id: customerWinesList.id })
      .from(customerWinesList)
      .where(
        and(
          eq(customerWinesList.customerId, customerId),
          eq(customerWinesList.wineId, wineId)
        )
      )
      .limit(1);
  },
  ["customer-wine-association"],
  {
    tags: [CACHE_TAGS.CUSTOMER_WINES],
    revalidate: 60, // 1 minuto
  }
);

/**
 * Adicionar vinho à lista de um cliente
 */
export async function addWineToCustomer(
  input: AddWineToCustomerInput
): Promise<CustomerWinesActionResult<CustomerWinesList>> {
  try {
    // Validação dos dados
    const validatedData = addWineToCustomerSchema.parse(input);

    // Verificar se cliente existe (com cache)
    const [customer] = await getCachedCustomer(validatedData.customerId);

    if (!customer) {
      return {
        success: false,
        error: "Cliente não encontrado",
      };
    }

    // Verificar se vinho existe e não está descontinuado (com cache)
    const [wine] = await getCachedWine(validatedData.wineId);

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

    // Verificar se a associação já existe (com cache)
    const [existingAssociation] = await getCachedAssociation(
      validatedData.customerId,
      validatedData.wineId
    );

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

    // Invalidar cache com tags específicas
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES);
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES_LIST(validatedData.customerId));
    revalidateTag(CACHE_TAGS.WINE_CUSTOMERS(validatedData.wineId));
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES_STATS);
    revalidateTag(CACHE_TAGS.AVAILABLE_WINES(validatedData.customerId));

    // Revalidar caminhos específicos
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
 * Remover vinho da lista de um cliente
 */
export async function removeWineFromCustomer(
  input: RemoveWineFromCustomerInput
): Promise<CustomerWinesActionResult<void>> {
  try {
    // Validação dos dados
    const validatedData = removeWineFromCustomerSchema.parse(input);

    // Verificar se a associação existe (com cache)
    const [existingAssociation] = await getCachedAssociation(
      validatedData.customerId,
      validatedData.wineId
    );

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

    // Invalidar cache com tags específicas
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES);
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES_LIST(validatedData.customerId));
    revalidateTag(CACHE_TAGS.WINE_CUSTOMERS(validatedData.wineId));
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES_STATS);
    revalidateTag(CACHE_TAGS.AVAILABLE_WINES(validatedData.customerId));

    // Revalidar caminhos específicos
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

    // Verificar se cliente existe (com cache)
    const [customer] = await getCachedCustomer(validatedId);

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

    // Invalidar cache com tags específicas
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES);
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES_LIST(validatedId));
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES_STATS);
    revalidateTag(CACHE_TAGS.AVAILABLE_WINES(validatedId));

    // Revalidar caminhos específicos
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
