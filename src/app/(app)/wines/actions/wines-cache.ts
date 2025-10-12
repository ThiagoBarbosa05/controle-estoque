"use server";

import { revalidateTag, revalidatePath } from "next/cache";

/**
 * Revalida o cache das páginas relacionadas aos vinhos
 */
export async function revalidateWinesCache() {
  try {
    // Revalidar cache por tags (mais eficiente)
    revalidateTag("wines");
    revalidateTag("wine-stats");
    revalidateTag("wine-filters");

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

/**
 * Revalida cache específico dos stats
 */
export async function revalidateWineStatsCache() {
  try {
    revalidateTag("wine-stats");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Erro ao revalidar cache das estatísticas:", error);
  }
}

/**
 * Revalida cache específico dos filtros
 */
export async function revalidateWineFiltersCache() {
  try {
    revalidateTag("wine-filters");
  } catch (error) {
    console.error("Erro ao revalidar cache dos filtros:", error);
  }
}
