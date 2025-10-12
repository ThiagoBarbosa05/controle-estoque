import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { revalidateWinesCache } from "@/app/(app)/wines/actions/wines-cache";
import { StatCardSkeleton } from "./stat-card-skeleton";
import { WinesStats } from "./wine-stats";
import { WinesList } from "./wines-list";
import { WinesTableSkeleton } from "./wines-table-skeleton";
import { WineFilters } from "./wine-filters";

export default async function WinesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Normalizar searchParams

  const filters = await searchParams;
  const normalizedSearchParams = Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vinhos</h1>
          <p className="text-muted-foreground">
            Gerencie o catálogo de vinhos e controle de estoque
          </p>
        </div>
        <form action={revalidateWinesCache}>
          <Button type="submit" variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Cache
          </Button>
        </form>
      </div>

      {/* Grid de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<StatCardSkeleton />}>
          <WinesStats />
        </Suspense>
      </div>

      <WineFilters />

      {/* Lista de vinhos com filtros */}
      <Suspense
        key={
          normalizedSearchParams
            ? JSON.stringify(normalizedSearchParams)
            : "all"
        }
        fallback={<WinesTableSkeleton />}
      >
        <WinesList searchParams={normalizedSearchParams} />
      </Suspense>

      {/* <WinesListWithFilters searchParams={normalizedSearchParams} /> */}
    </div>
  );
}
