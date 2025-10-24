"use server";

import { db } from "@/db";
import { customerWinesList, customers, wines } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";
import {
  bulkAddWinesToCustomerSchema,
  bulkRemoveWinesFromCustomerSchema,
  transferWinesSchema,
} from "@/lib/schemas/customer-wines";
import type {
  BulkAddWinesToCustomerInput,
  BulkRemoveWinesFromCustomerInput,
  TransferWinesInput,
} from "@/lib/schemas/customer-wines";
import type {
  CustomerWinesActionResult,
  CustomerWinesList,
} from "@/types/customer-wines";
import { CACHE_TAGS } from "@/lib/cache/customer-wines";

/**
 * Cache helper para verificar múltiplos clientes
 */
const getCachedCustomers = unstable_cache(
  async (customerIds: string[]) => {
    return await db
      .select({ id: customers.id })
      .from(customers)
      .where(inArray(customers.id, customerIds));
  },
  ["customers-bulk"],
  {
    tags: [CACHE_TAGS.CUSTOMER_WINES],
    revalidate: 300, // 5 minutos
  }
);

/**
 * Cache helper para verificar múltiplos vinhos
 */
const getCachedWines = unstable_cache(
  async (wineIds: string[]) => {
    return await db
      .select({ id: wines.id, discontinued: wines.discontinued })
      .from(wines)
      .where(inArray(wines.id, wineIds));
  },
  ["wines-bulk"],
  {
    tags: [CACHE_TAGS.CUSTOMER_WINES],
    revalidate: 300, // 5 minutos
  }
);

/**
 * Cache helper para verificar associações existentes
 */
const getCachedAssociations = unstable_cache(
  async (customerId: string, wineIds: string[]) => {
    return await db
      .select({ wineId: customerWinesList.wineId })
      .from(customerWinesList)
      .where(
        and(
          eq(customerWinesList.customerId, customerId),
          inArray(customerWinesList.wineId, wineIds)
        )
      );
  },
  ["customer-wine-associations-bulk"],
  {
    tags: [CACHE_TAGS.CUSTOMER_WINES],
    revalidate: 60, // 1 minuto
  }
);

/**
 * Adicionar múltiplos vinhos à lista de um cliente
 */
export async function bulkAddWinesToCustomer(
  input: BulkAddWinesToCustomerInput
): Promise<CustomerWinesActionResult<CustomerWinesList[]>> {
  try {
    // Validação dos dados
    const validatedData = bulkAddWinesToCustomerSchema.parse(input);

    // Verificar se cliente existe (com cache)
    const customersCheck = await getCachedCustomers([validatedData.customerId]);

    if (customersCheck.length === 0) {
      return {
        success: false,
        error: "Cliente não encontrado",
      };
    }

    // Verificar se todos os vinhos existem e não estão descontinuados (com cache)
    const winesCheck = await getCachedWines(validatedData.wineIds);

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

    // Verificar associações existentes (com cache)
    const existingAssociations = await getCachedAssociations(
      validatedData.customerId,
      validatedData.wineIds
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

    // Invalidar cache com tags específicas
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES);
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES_LIST(validatedData.customerId));
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES_STATS);
    revalidateTag(CACHE_TAGS.AVAILABLE_WINES(validatedData.customerId));

    // Invalidar cache para cada vinho adicionado
    newWineIds.forEach((wineId) => {
      revalidateTag(CACHE_TAGS.WINE_CUSTOMERS(wineId));
    });

    // Revalidar caminhos específicos
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
 * Remover múltiplos vinhos da lista de um cliente
 */
export async function bulkRemoveWinesFromCustomer(
  input: BulkRemoveWinesFromCustomerInput
): Promise<CustomerWinesActionResult<void>> {
  try {
    // Validação dos dados
    const validatedData = bulkRemoveWinesFromCustomerSchema.parse(input);

    // Verificar associações existentes (com cache)
    const existingAssociations = await getCachedAssociations(
      validatedData.customerId,
      validatedData.wineIds
    );

    if (existingAssociations.length === 0) {
      return {
        success: false,
        error: "Nenhum dos vinhos selecionados está na lista do cliente",
      };
    }

    // Buscar IDs completos das associações para deletar
    const associationsToDelete = await db
      .select({ id: customerWinesList.id })
      .from(customerWinesList)
      .where(
        and(
          eq(customerWinesList.customerId, validatedData.customerId),
          inArray(customerWinesList.wineId, validatedData.wineIds)
        )
      );

    // Remover associações
    await db.delete(customerWinesList).where(
      inArray(
        customerWinesList.id,
        associationsToDelete.map((a) => a.id)
      )
    );

    // Invalidar cache com tags específicas
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES);
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES_LIST(validatedData.customerId));
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES_STATS);
    revalidateTag(CACHE_TAGS.AVAILABLE_WINES(validatedData.customerId));

    // Invalidar cache para cada vinho removido
    validatedData.wineIds.forEach((wineId) => {
      revalidateTag(CACHE_TAGS.WINE_CUSTOMERS(wineId));
    });

    // Revalidar caminhos específicos
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

    // Verificar se ambos os clientes existem (com cache)
    const customersCheck = await getCachedCustomers([
      validatedData.fromCustomerId,
      validatedData.toCustomerId,
    ]);

    if (customersCheck.length !== 2) {
      return {
        success: false,
        error: "Um ou ambos os clientes não foram encontrados",
      };
    }

    // Verificar se as associações existem no cliente origem (com cache)
    const existingAssociations = await getCachedAssociations(
      validatedData.fromCustomerId,
      validatedData.wineIds
    );

    if (existingAssociations.length !== validatedData.wineIds.length) {
      return {
        success: false,
        error:
          "Nem todos os vinhos selecionados estão na lista do cliente origem",
      };
    }

    // Verificar se já existem associações no cliente destino (com cache)
    const existingDestinationAssociations = await getCachedAssociations(
      validatedData.toCustomerId,
      validatedData.wineIds
    );

    if (existingDestinationAssociations.length > 0) {
      return {
        success: false,
        error: "Alguns vinhos já estão na lista do cliente destino",
      };
    }

    // Buscar IDs completos das associações para transferir
    const associationsToTransfer = await db
      .select({ id: customerWinesList.id, wineId: customerWinesList.wineId })
      .from(customerWinesList)
      .where(
        and(
          eq(customerWinesList.customerId, validatedData.fromCustomerId),
          inArray(customerWinesList.wineId, validatedData.wineIds)
        )
      );

    // Executar transferência em transação
    const result = await db.transaction(async (tx) => {
      // Remover associações do cliente origem
      await tx.delete(customerWinesList).where(
        inArray(
          customerWinesList.id,
          associationsToTransfer.map((a) => a.id)
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

    // Invalidar cache com tags específicas para ambos os clientes
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES);
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES_LIST(validatedData.fromCustomerId));
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES_LIST(validatedData.toCustomerId));
    revalidateTag(CACHE_TAGS.CUSTOMER_WINES_STATS);
    revalidateTag(CACHE_TAGS.AVAILABLE_WINES(validatedData.fromCustomerId));
    revalidateTag(CACHE_TAGS.AVAILABLE_WINES(validatedData.toCustomerId));

    // Invalidar cache para cada vinho transferido
    validatedData.wineIds.forEach((wineId) => {
      revalidateTag(CACHE_TAGS.WINE_CUSTOMERS(wineId));
    });

    // Revalidar caminhos específicos
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
