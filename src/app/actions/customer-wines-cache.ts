"use server";

import { revalidatePath } from "next/cache";

/**
 * Revalida o cache das páginas relacionadas às listas de vinhos dos clientes
 */
export async function revalidateCustomerWinesCache() {
  try {
    // Revalidar páginas principais
    revalidatePath("/wines-list");
    revalidatePath("/customers");
    revalidatePath("/wines");
    revalidatePath("/dashboard");

    // Revalidar layout principal
    revalidatePath("/(app)");
  } catch (error) {
    console.error("Erro ao revalidar cache das listas de vinhos:", error);
  }
}
