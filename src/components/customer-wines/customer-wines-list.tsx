import { Suspense } from "react";
import { cache } from "react";
import { getCustomerWines } from "@/lib/data/customer-wines";
import { CustomerWinesFiltersSimple } from "./customer-wines-filters-simple";
import { CustomerWinesPagination } from "./customer-wines-pagination";
import type {
  GetCustomerWinesParams,
  CustomerWinesSortBy,
  SortOrder,
} from "@/types/customer-wines";
import { CustomerWinesLoading } from "./customer-wines-loading";
import { CustomerWinesTable } from "./customer-wines-table";

/**
 * Cache memoization para evitar múltiplas chamadas da mesma consulta
 * durante a renderização do componente
 */
const getCachedCustomerWines = cache(getCustomerWines);

/**
 * Preload function para iniciar o carregamento de dados antes da renderização
 */
export const preloadCustomerWines = (params: GetCustomerWinesParams) => {
  void getCachedCustomerWines(params);
};

/**
 * Helper para normalizar e cachear parâmetros de busca
 */
const normalizeSearchParams = cache(
  (
    searchParams: CustomerWinesListProps["searchParams"],
    customerId: string
  ): GetCustomerWinesParams => {
    return {
      customerId,
      page: parseInt(searchParams?.page || "1"),
      limit: parseInt(searchParams?.limit || "20"),
      sortBy: (searchParams?.sortBy as CustomerWinesSortBy) || "addedAt",
      sortOrder: (searchParams?.sortOrder as SortOrder) || "desc",
      search: searchParams?.search,
      wineType: searchParams?.wineType,
      country: searchParams?.country,
      discontinued:
        (searchParams?.discontinued as "all" | "active" | "discontinued") ||
        "active",
    };
  }
);

interface CustomerWinesListProps {
  customerId: string;
  searchParams?: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    wineType?: string;
    country?: string;
    discontinued?: string;
  };
}

export async function CustomerWinesList({
  customerId,
  searchParams = {},
}: CustomerWinesListProps) {
  // Parse search params with defaults and proper typing usando cache
  const params = normalizeSearchParams(searchParams, customerId);

  // Preload dos dados para melhor performance
  preloadCustomerWines(params);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <CustomerWinesFiltersSimple
        currentFilters={{
          search: params.search,
          wineType: params.wineType,
          country: params.country,
          discontinued: params.discontinued,
        }}
      />

      {/* Content with Suspense for streaming */}
      <Suspense
        key={JSON.stringify(params)}
        fallback={<CustomerWinesLoading />}
      >
        <CustomerWinesContent params={params} />
      </Suspense>
    </div>
  );
}

interface CustomerWinesContentProps {
  params: GetCustomerWinesParams;
}

async function CustomerWinesContent({ params }: CustomerWinesContentProps) {
  try {
    // Usar a versão cached para evitar consultas duplicadas durante a renderização
    // Os dados já estão sendo buscados com cache do Next.js (unstable_cache) na camada de dados
    // e também evitamos re-fetches desnecessários durante a renderização com React cache
    const result = await getCachedCustomerWines(params);

    return (
      <>
        <CustomerWinesTable
          customerWines={result.customerWines}
          sortBy={params.sortBy}
          sortOrder={params.sortOrder}
          customerId={params.customerId}
        />

        <CustomerWinesPagination
          pagination={result.pagination}
          // baseUrl={`/customers/${params.customerId}/wines`}
        />
      </>
    );
  } catch (error) {
    console.error("Erro ao carregar vinhos do cliente:", error);
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Erro ao carregar vinhos do cliente. Tente novamente.
        </p>
      </div>
    );
  }
}
