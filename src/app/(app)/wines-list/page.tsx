import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Wine,
  TrendingUp,
  RefreshCw,
  Globe,
  Package,
  ListChecks,
  MoreHorizontal,
} from "lucide-react";
import {
  getCustomerWinesStats,
  getCustomerWines,
  type GetCustomerWinesInput,
} from "@/app/actions/customer-wines-list";
import { getCustomers } from "@/app/actions/customers";
import { revalidateCustomerWinesCache } from "@/app/actions/customer-wines-cache";
import { CustomerWinesFilters } from "@/components/customer-wines/customer-wines-filters";
import { CustomerWinesPagination } from "@/components/customer-wines/customer-wines-pagination";
// import { CustomerWinesBulkActions } from "@/components/customer-wines/customer-wines-bulk-actions";
import {
  AddWineToCustomerDialog,
  RemoveWineFromCustomerDialog,
} from "@/components/customer-wines/customer-wines-dialogs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Componente de carregamento
function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-24"></div>
          <div className="h-8 bg-muted rounded w-16"></div>
          <div className="h-3 bg-muted rounded w-32"></div>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerWinesTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de estatísticas gerais
async function CustomerWinesStats() {
  const result = await getCustomerWinesStats();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Erro ao carregar estatísticas
          </p>
        </CardContent>
      </Card>
    );
  }

  const {
    totalAssociations,
    uniqueCustomersWithWines,
    uniqueWinesInLists,
    averageWinesPerCustomer,
    topCustomersByWineCount,
    topWinesByCustomerCount,
  } = result.data ?? {
    totalAssociations: 0,
    uniqueCustomersWithWines: 0,
    uniqueWinesInLists: 0,
    averageWinesPerCustomer: 0,
    topCustomersByWineCount: [],
    topWinesByCustomerCount: [],
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Associações
          </CardTitle>
          <ListChecks className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAssociations}</div>
          <p className="text-xs text-muted-foreground">
            {uniqueCustomersWithWines} clientes com vinhos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vinhos Únicos</CardTitle>
          <Wine className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {uniqueWinesInLists}
          </div>
          <p className="text-xs text-muted-foreground">
            Em {uniqueCustomersWithWines} listas diferentes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Média por Cliente
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {averageWinesPerCustomer.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">Vinhos por cliente</p>
        </CardContent>
      </Card>

      {/* Top Customers Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCustomersByWineCount.slice(0, 3).map((customer, index) => (
              <div
                key={customer.customerId}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium text-sm">
                    {customer.customerName}
                  </span>
                </div>
                <Badge variant="secondary">{customer.wineCount} vinhos</Badge>
              </div>
            ))}
            {topCustomersByWineCount.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum dado disponível
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Wines Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wine className="h-5 w-5" />
            Vinhos Mais Populares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topWinesByCustomerCount.slice(0, 3).map((wine, index) => (
              <div
                key={wine.wineId}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium text-sm">{wine.wineName}</span>
                </div>
                <Badge variant="outline">{wine.customerCount} clientes</Badge>
              </div>
            ))}
            {topWinesByCustomerCount.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum dado disponível
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Componente da lista de associações cliente-vinho
async function CustomerWinesList({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  // Preparar entrada para query
  let queryInput: Partial<GetCustomerWinesInput> | undefined;

  // Se há customerId, buscar vinhos desse cliente
  if (searchParams.customerId) {
    queryInput = {
      customerId: searchParams.customerId,
      page: parseInt(searchParams.page || "1"),
      limit: parseInt(searchParams.limit || "20"),
      sortBy: (searchParams.sortBy || "addedAt") as
        | "wineName"
        | "wineCountry"
        | "wineType"
        | "addedAt",
      sortOrder: (searchParams.sortOrder || "desc") as "asc" | "desc",
      search: searchParams.search,
      wineType:
        searchParams.wineType === "all" ? undefined : searchParams.wineType,
      country:
        searchParams.country === "all" ? undefined : searchParams.country,
      discontinued: (searchParams.discontinued || "active") as
        | "all"
        | "active"
        | "discontinued",
    };
  }

  // Buscar dados se há filtro de cliente
  let customerWinesData = null;
  if (queryInput) {
    const result = await getCustomerWines(queryInput);
    if (result.success) {
      customerWinesData = result.data;
    }
  }

  // Buscar dados para filtros
  const customersResult = await getCustomers({ limit: 100 });
  const customers = customersResult.success
    ? customersResult.data?.customers || []
    : [];

  // Extrair tipos e países únicos para filtros
  const availableWineTypes: string[] = [];
  const availableCountries: string[] = [];

  if (customerWinesData?.customerWines) {
    customerWinesData.customerWines.forEach((cw) => {
      if (!availableWineTypes.includes(cw.wine.type)) {
        availableWineTypes.push(cw.wine.type);
      }
      if (!availableCountries.includes(cw.wine.country)) {
        availableCountries.push(cw.wine.country);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <CustomerWinesFilters
        availableWineTypes={availableWineTypes.sort()}
        availableCountries={availableCountries.sort()}
      />

      {/* Lista de associações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Listas de Vinhos dos Clientes
              {customerWinesData && ` (${customerWinesData.pagination.total})`}
            </span>
            <AddWineToCustomerDialog />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!searchParams.customerId ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground mb-4">
                Selecione um cliente para ver sua lista de vinhos
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {customers.slice(0, 6).map((customer) => (
                  <Button
                    key={customer.id}
                    variant="outline"
                    className="text-left justify-start"
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set("customerId", customer.id);
                      window.history.pushState({}, "", `?${params.toString()}`);
                      window.location.reload();
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {customer.name}
                  </Button>
                ))}
              </div>
              {customers.length > 6 && (
                <p className="text-sm text-muted-foreground mt-4">
                  +{customers.length - 6} outros clientes
                </p>
              )}
            </div>
          ) : customerWinesData?.customerWines?.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Este cliente não possui vinhos em sua lista
              </p>
              <AddWineToCustomerDialog
                preselectedCustomerId={searchParams.customerId}
                trigger={
                  <Button className="mt-4">
                    <Wine className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Vinho
                  </Button>
                }
              />
            </div>
          ) : customerWinesData ? (
            <div className="space-y-4">
              {/* Ações em massa */}
              {/* <CustomerWinesBulkActions
                customerWines={customerWinesData.customerWines.map((cw) => ({
                  id: cw.id,
                  customerId: cw.customerId,
                  wineId: cw.wineId,
                  customer: cw.customer,
                  wine: cw.wine,
                }))}
              /> */}

              {/* Cabeçalho da tabela - apenas em telas maiores */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 pb-2 border-b font-medium text-sm text-muted-foreground">
                <div className="col-span-3">Cliente</div>
                <div className="col-span-3">Vinho</div>
                <div className="col-span-2">País</div>
                <div className="col-span-2">Tipo</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Ações</div>
              </div>

              {/* Lista de associações */}
              {customerWinesData.customerWines.map((customerWine) => (
                <div
                  key={customerWine.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Mobile layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{customerWine.wine.name}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <RemoveWineFromCustomerDialog
                            customerId={customerWine.customerId}
                            wineId={customerWine.wineId}
                            customerName={customerWine.customer.name}
                            wineName={customerWine.wine.name}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {customerWine.customer.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <span>{customerWine.wine.country}</span>
                      <span>{customerWine.wine.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          customerWine.wine.discontinued
                            ? "secondary"
                            : "default"
                        }
                      >
                        {customerWine.wine.discontinued
                          ? "Descontinuado"
                          : "Ativo"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {customerWine.wine.size}
                      </Badge>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:contents">
                    <div className="col-span-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {customerWine.customer.name}
                      </span>
                    </div>
                    <div className="col-span-3 font-medium">
                      {customerWine.wine.name}
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      {customerWine.wine.country}
                    </div>
                    <div className="col-span-2">{customerWine.wine.type}</div>
                    <div className="col-span-1">
                      <Badge
                        variant={
                          customerWine.wine.discontinued
                            ? "secondary"
                            : "default"
                        }
                      >
                        {customerWine.wine.discontinued ? "Desc." : "Ativo"}
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <RemoveWineFromCustomerDialog
                        customerId={customerWine.customerId}
                        wineId={customerWine.wineId}
                        customerName={customerWine.customer.name}
                        wineName={customerWine.wine.name}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Paginação */}
              <CustomerWinesPagination
                pagination={customerWinesData.pagination}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Erro ao carregar lista de vinhos
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente principal da página
export default async function CustomerWinesListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
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
