import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { revalidateCustomerWinesCache } from "@/app/actions/customer-wines-cache";
import {
  StatCardSkeleton,
  CustomerWinesTableSkeleton,
  CustomerWinesStats,
  CustomerWinesList,
} from "./components";

interface CustomerWinesListPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function CustomerWinesListPage({
  searchParams,
}: CustomerWinesListPageProps) {
  // Normalizar searchParams
  const normalizedSearchParams = Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Listas de Vinhos
          </h1>
          <p className="text-muted-foreground">
            Gerencie as associações entre clientes e vinhos
          </p>
        </div>
        <form action={revalidateCustomerWinesCache}>
          <Button type="submit" variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Cache
          </Button>
        </form>
      </div>

      {/* Grid de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<StatCardSkeleton />}>
          <CustomerWinesStats />
        </Suspense>
      </div>

      {/* Lista de associações com filtros */}
      <Suspense fallback={<CustomerWinesTableSkeleton />}>
        <CustomerWinesList searchParams={normalizedSearchParams} />
      </Suspense>
    </div>
  );
}
