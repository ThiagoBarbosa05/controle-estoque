import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { revalidatePath } from "next/cache";
import { CustomerFilters } from "@/components/customers/customer-filters";
import { StatsSkeleton } from "./stats-skeleton";
import { CustomersStats } from "./customer-stats";
import { CustomersTableSkeleton } from "./customer-table-skeleton";
import { CustomersList } from "./customers-list";
import { AddCustomerButton } from "./add-customer-Button";

// Action para revalidar cache da página de customers
async function revalidateCustomersCache() {
  "use server";
  revalidatePath("/customers");
  revalidatePath("/dashboard");
}

// Componente da lista de clientes
export interface SearchParams {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

// Componente principal da página
export default function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e suas informações
          </p>
        </div>
        <div className="flex gap-2">
          <form action={revalidateCustomersCache}>
            <Button type="submit" variant="outline">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline-block"> Atualizar</span>
            </Button>
          </form>
          <AddCustomerButton />
        </div>
      </div>

      {/* Estatísticas */}
      <Suspense fallback={<StatsSkeleton />}>
        <CustomersStats />
      </Suspense>

      {/* Filtros e busca */}
      <Card>
        <CardContent className="p-4">
          <CustomerFilters />
        </CardContent>
      </Card>

      {/* Lista de clientes */}
      <Suspense
        key={
          searchParams.search ||
          searchParams.page ||
          searchParams.limit ||
          searchParams.sortBy ||
          searchParams.sortOrder
        }
        fallback={<CustomersTableSkeleton />}
      >
        <CustomersList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
