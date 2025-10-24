"use server";

import { unstable_cache } from "next/cache";
import { getCustomerWinesStats } from "@/lib/data/customer-wines";
import type {
  CustomerWinesActionResult,
  CustomerWinesStats,
} from "@/types/customer-wines";
import { CACHE_TAGS } from "@/lib/cache/customer-wines";

/**
 * Cache helper para estatísticas com cache de longa duração
 */
const getCachedStats = unstable_cache(
  async () => {
    return await getCustomerWinesStats();
  },
  ["customer-wines-stats"],
  {
    tags: [CACHE_TAGS.CUSTOMER_WINES_STATS],
    revalidate: 300, // 5 minutos
  }
);

/**
 * Obter estatísticas das listas de vinhos dos clientes
 */
export async function getCustomerWinesStatsAction(): Promise<
  CustomerWinesActionResult<CustomerWinesStats>
> {
  try {
    const stats = await getCachedStats();

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}
