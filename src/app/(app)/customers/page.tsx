import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, RefreshCw, Calendar, TrendingUp } from "lucide-react";
import { getCustomers, getCustomerStats } from "@/app/actions/customers";
import { revalidatePath } from "next/cache";
import { CustomerFilters } from "@/components/customers/customer-filters";
import {
  AddCustomerButton,
  EditCustomerButton,
  DeleteCustomerButton,
} from "@/components/customers/customer-dialogs";
import { CustomersPagination } from "@/components/customers/customers-pagination";

// Action para revalidar cache da página de customers
async function revalidateCustomersCache() {
  "use server";
  revalidatePath("/customers");
  revalidatePath("/dashboard");
}

// Componente de loading para a tabela
function CustomersTableSkeleton() {
  const skeletonItems = Array.from({ length: 5 }, (_, index) => ({
    id: `skeleton-${index}-${Math.random().toString(36).substr(2, 9)}`,
    index,
  }));

  return (
    <div className="space-y-3">
      {skeletonItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
            <div className="space-y-1">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente de loading para estatísticas
function StatsSkeleton() {
  const skeletonCards = [
    { id: "stats-skeleton-total", type: "total" },
    { id: "stats-skeleton-recent", type: "recent" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {skeletonCards.map((card) => (
        <Card key={card.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Componente de estatísticas dos clientes
async function CustomersStats() {
  const result = await getCustomerStats();

  if (!result.success) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Erro ao carregar estatísticas
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { total, recentCount } = result.data ?? { total: 0, recentCount: 0 };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Clientes
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">
            Clientes cadastrados no sistema
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            +{recentCount}
          </div>
          <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente da lista de clientes
interface SearchParams {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

async function CustomersList({ searchParams }: { searchParams: SearchParams }) {
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 10;
  const search = searchParams.search || "";
  const sortBy = searchParams.sortBy || "createdAt";
  const sortOrder = searchParams.sortOrder || "desc";

  const result = await getCustomers({
    page,
    limit,
    search,
    sortBy: sortBy as "name" | "createdAt" | "updatedAt",
    sortOrder: sortOrder as "asc" | "desc",
  });

  if (!result.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Erro ao carregar clientes: {result.error}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { customers, pagination } = result.data ?? {
    customers: [],
    pagination: null,
  };

  if (!customers || customers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Nenhum cliente encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? "Tente ajustar os filtros de busca"
                : "Comece adicionando seu primeiro cliente"}
            </p>
            <AddCustomerButton />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lista de clientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Clientes ({pagination?.total || 0})</CardTitle>
            <AddCustomerButton />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium">{customer.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Criado em{" "}
                        {new Date(customer.createdAt).toLocaleDateString(
                          "pt-BR"
                        )}
                      </div>
                      {customer.updatedAt !== customer.createdAt && (
                        <div>
                          Atualizado em{" "}
                          {new Date(customer.updatedAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    ID: {customer.id.slice(0, 8)}...
                  </Badge>
                  <EditCustomerButton customer={customer} />
                  <DeleteCustomerButton customer={customer} />
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6">
              <CustomersPagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
                total={pagination.total}
                limit={pagination.limit}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
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
            <Button type="submit" variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
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
      <Suspense fallback={<CustomersTableSkeleton />}>
        <CustomersList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
