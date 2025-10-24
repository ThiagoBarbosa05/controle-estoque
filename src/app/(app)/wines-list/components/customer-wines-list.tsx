/**
 * @file customer-wines-list.tsx
 * @description Componente Server para listagem de vinhos de clientes com cache otimizado
 *
 * Otimizações implementadas:
 * - React cache() para memoização de funções assíncronas
 * - Busca paralela de dados com Promise.all()
 * - Normalização de search params com cache
 * - Extração de dados únicos com cache
 * - Funções de preload para performance
 * - Integração com data layer otimizada (unstable_cache)
 *
 * Performance:
 * - Cache duplo: React cache + Next.js unstable_cache
 * - Invalidação granular via cache tags
 * - Minimização de re-renders e re-computações
 */

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
import { cache } from "react";
import { getCustomerWines } from "@/lib/data/customer-wines";
import { getCustomers } from "@/app/actions/customers";
import type {
  GetCustomerWinesParams,
  PaginatedCustomerWines,
  CustomerWineWithDetails,
} from "@/types/customer-wines";
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

// Função para normalizar search params com memoização
const normalizeSearchParams = cache(
  (
    searchParams: Record<string, string | undefined>
  ): Partial<GetCustomerWinesParams> | undefined => {
    if (!searchParams.customerId) return undefined;

    return {
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
);

// Cache React para otimizar busca de vinhos do cliente
const getCustomerWinesCached = cache(
  async (
    params: Partial<GetCustomerWinesParams>
  ): Promise<PaginatedCustomerWines | null> => {
    try {
      return await getCustomerWines(params);
    } catch (error) {
      console.error("Erro ao buscar vinhos do cliente:", error);
      return null;
    }
  }
);

// Cache React para otimizar busca de clientes
const getCustomersCached = cache(async (limit: number = 100) => {
  try {
    const result = await getCustomers({ limit });
    return result.success ? result.data?.customers || [] : [];
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return [];
  }
});

// Função de preload para melhorar performance
export const preloadCustomerWines = (
  params: Partial<GetCustomerWinesParams>
) => {
  void getCustomerWinesCached(params);
};

// Função de preload para clientes
export const preloadCustomers = (limit: number = 100) => {
  void getCustomersCached(limit);
};

// Função de preload completa para página
export const preloadCustomerWinesPage = (
  searchParams: Record<string, string | undefined>
) => {
  const queryInput = normalizeSearchParams(searchParams);
  if (queryInput) {
    void getCustomerWinesCached(queryInput);
  }
  void getCustomersCached(100);
};

// Cache para extrair dados únicos para filtros
const extractUniqueFilterData = cache(
  (customerWines: CustomerWineWithDetails[] | undefined) => {
    const availableWineTypes: string[] = [];
    const availableCountries: string[] = [];

    if (customerWines) {
      customerWines.forEach((cw) => {
        if (cw.wine.type && !availableWineTypes.includes(cw.wine.type)) {
          availableWineTypes.push(cw.wine.type);
        }
        if (cw.wine.country && !availableCountries.includes(cw.wine.country)) {
          availableCountries.push(cw.wine.country);
        }
      });
    }

    return {
      availableWineTypes: availableWineTypes.sort(),
      availableCountries: availableCountries.sort(),
    };
  }
);

export async function CustomerWinesList({
  searchParams,
}: CustomerWinesListProps) {
  // Normalizar search params com cache
  const queryInput = normalizeSearchParams(searchParams);

  // Buscar dados em paralelo usando cache
  const [customerWinesData, customers] = await Promise.all([
    queryInput ? getCustomerWinesCached(queryInput) : Promise.resolve(null),
    getCustomersCached(100),
  ]);

  // Extrair dados únicos para filtros usando cache
  const { availableWineTypes, availableCountries } = extractUniqueFilterData(
    customerWinesData?.customerWines
  );

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-card rounded-xl border shadow-sm">
        <CustomerWinesFilters
          availableWineTypes={availableWineTypes}
          availableCountries={availableCountries}
        />
      </div>

      {/* Lista de associações */}
      <Card className="shadow-sm border-0 bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wine className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Listas de Vinhos dos Clientes
                </h2>
                {customerWinesData && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {customerWinesData.pagination.total}{" "}
                    {customerWinesData.pagination.total === 1
                      ? "item encontrado"
                      : "itens encontrados"}
                  </p>
                )}
              </div>
            </div>
            <Link href="/wines-list/create">
              <Button variant="outline" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Vinho
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!searchParams.customerId ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Selecione um cliente</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Escolha um cliente abaixo para visualizar e gerenciar sua lista
                de vinhos
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-4xl mx-auto">
                {customers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}/wines`}
                    className={cn(
                      "group relative p-4 border border-border rounded-lg",
                      "hover:bg-muted/50 hover:border-muted-foreground/20",
                      "transition-all duration-200 ease-in-out",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm group-hover:text-foreground transition-colors">
                        {customer.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : customerWinesData?.customerWines?.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Lista vazia</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Este cliente ainda não possui vinhos em sua lista. Que tal
                adicionar o primeiro?
              </p>
              <AddWineToCustomerDialog
                preselectedCustomerId={searchParams.customerId}
                trigger={
                  <Button size="lg" className="shadow-sm">
                    <Wine className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Vinho
                  </Button>
                }
              />
            </div>
          ) : customerWinesData ? (
            <div className="space-y-6">
              {/* Cabeçalho da tabela - apenas em telas maiores */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-3 bg-muted/30 rounded-lg border font-medium text-sm text-muted-foreground">
                <div className="col-span-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Cliente
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  <Wine className="h-4 w-4" />
                  Vinho
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  País
                </div>
                <div className="col-span-2">Tipo</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1 text-center">Ações</div>
              </div>

              {/* Lista de associações */}
              <div className="space-y-3">
                {customerWinesData.customerWines.length > 10 && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      Mostrando {customerWinesData.customerWines.length} de{" "}
                      {customerWinesData.pagination.total} itens
                    </div>
                    {customerWinesData.pagination.total >
                      customerWinesData.pagination.limit && (
                      <Badge variant="outline" className="text-xs">
                        Página {customerWinesData.pagination.page} de{" "}
                        {customerWinesData.pagination.totalPages}
                      </Badge>
                    )}
                  </div>
                )}

                {customerWinesData.customerWines.map(
                  (customerWine: CustomerWineWithDetails) => (
                    <div
                      key={customerWine.id}
                      className={cn(
                        "group relative overflow-hidden rounded-lg border bg-card",
                        "hover:bg-accent/50 hover:border-accent-foreground/20",
                        "transition-all duration-200 ease-in-out hover:shadow-md",
                        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                      )}
                    >
                      {/* Mobile layout */}
                      <div className="lg:hidden p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate mb-1">
                              {customerWine.wine.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                              <Users className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">
                                {customerWine.customer.name}
                              </span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-muted"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">
                                  Abrir menu de ações
                                </span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
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

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              País
                            </p>
                            <div className="flex items-center gap-2">
                              <Globe className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {customerWine.wine.country}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Tipo
                            </p>
                            <span className="text-sm">
                              {customerWine.wine.type}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                customerWine.wine.discontinued
                                  ? "secondary"
                                  : "default"
                              }
                              className={cn(
                                "text-xs font-medium",
                                customerWine.wine.discontinued
                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
                                  : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full mr-1.5",
                                  customerWine.wine.discontinued
                                    ? "bg-orange-500"
                                    : "bg-green-500"
                                )}
                              />
                              {customerWine.wine.discontinued
                                ? "Descontinuado"
                                : "Ativo"}
                            </Badge>
                            {customerWine.wine.size && (
                              <Badge variant="outline" className="text-xs">
                                {customerWine.wine.size}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Desktop layout */}
                      <div className="hidden lg:grid lg:grid-cols-12 gap-4 p-4 items-center">
                        <div className="col-span-3 flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium truncate">
                            {customerWine.customer.name}
                          </span>
                        </div>

                        <div className="col-span-3 min-w-0">
                          <span className="font-semibold truncate block">
                            {customerWine.wine.name}
                          </span>
                        </div>

                        <div className="col-span-2 flex items-center gap-2 min-w-0">
                          <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">
                            {customerWine.wine.country}
                          </span>
                        </div>

                        <div className="col-span-2 truncate">
                          {customerWine.wine.type}
                        </div>

                        <div className="col-span-1">
                          <Badge
                            variant={
                              customerWine.wine.discontinued
                                ? "secondary"
                                : "default"
                            }
                            className={cn(
                              "text-xs font-medium",
                              customerWine.wine.discontinued
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
                                : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                            )}
                          >
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full mr-1.5",
                                customerWine.wine.discontinued
                                  ? "bg-orange-500"
                                  : "bg-green-500"
                              )}
                            />
                            {customerWine.wine.discontinued ? "Desc." : "Ativo"}
                          </Badge>
                        </div>

                        <div className="col-span-1 flex justify-center">
                          <RemoveWineFromCustomerDialog
                            customerId={customerWine.customerId}
                            wineId={customerWine.wineId}
                            customerName={customerWine.customer.name}
                            wineName={customerWine.wine.name}
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">
                                  Abrir menu de ações
                                </span>
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Paginação */}
              <div className="pt-4 border-t bg-muted/30 rounded-lg">
                <CustomerWinesPagination
                  pagination={customerWinesData.pagination}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Package className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-destructive">
                Erro ao carregar dados
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Não foi possível carregar a lista de vinhos. Tente recarregar a
                página ou entre em contato com o suporte.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
