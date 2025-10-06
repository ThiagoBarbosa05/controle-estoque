"use server";

import { revalidatePath } from "next/cache";

/**
 * Revalida o cache das páginas relacionadas aos vinhos
 */
export async function revalidateWinesCache() {
  try {
    // Revalidar páginas principais
    revalidatePath("/wines");
    revalidatePath("/dashboard");
    revalidatePath("/customer-wines");

    // Revalidar layout principal
    revalidatePath("/(app)");
  } catch (error) {
    console.error("Erro ao revalidar cache dos vinhos:", error);
  }
}
