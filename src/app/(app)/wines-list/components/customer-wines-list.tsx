import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Wine,
  Globe,
  Package,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import {
  getCustomerWines,
  type GetCustomerWinesInput,
} from "@/app/actions/customer-wines-list";
import { getCustomers } from "@/app/actions/customers";
import { CustomerWinesFilters } from "@/components/customer-wines/customer-wines-filters";
import { CustomerWinesPagination } from "@/components/customer-wines/customer-wines-pagination";
// import { CustomerWinesBulkActions } from "@/components/customer-wines/customer-wines-bulk-actions";
import {
  AddWineToCustomerDialog,
  RemoveWineFromCustomerDialog,
} from "@/app/(app)/wines-list/components/customer-wines-dialogs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CustomerWinesListProps {
  searchParams: Record<string, string | undefined>;
}

export async function CustomerWinesList({
  searchParams,
}: CustomerWinesListProps) {
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
            <Link href="/wines-list/create">
              <Button variant="outline">
                <Plus /> Adicionar Vinho
              </Button>
            </Link>
            {/* <AddWineToCustomerDialog /> */}
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
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}/wines`}
                    className={cn(
                      "p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    )}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {customer.name}
                  </Link>
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
