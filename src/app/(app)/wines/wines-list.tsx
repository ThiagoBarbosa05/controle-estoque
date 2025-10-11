import { getWines, GetWinesInput } from "@/app/actions/wines";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { QuickStockUpdate } from "@/components/wines/quick-stock-update";
import { AddWineButton, DeleteWineButton, EditWineButton } from "@/components/wines/wine-dialogs";
import { WineFilters } from "@/app/(app)/wines/wine-filters";
import { WinesPagination } from "@/components/wines/wines-pagination";
import { Globe, MoreHorizontal, Wine } from "lucide-react";
import { unstable_cache } from "next/cache";

export async function WinesList({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  // Converter parâmetros de busca para entrada da query
  const queryInput: Partial<GetWinesInput> = {
    page: parseInt(searchParams.page || "1"),
    limit: parseInt(searchParams.limit || "10"),
    search: searchParams.search,
    country: searchParams.country === "all" ? undefined : searchParams.country,
    type:
      searchParams.type === "all"
        ? undefined
        : (searchParams.type as
            | "Tinto"
            | "Branco"
            | "Rosé"
            | "Espumante"
            | "Fortificado"
            | "Sobremesa"
            | undefined),
    size:
      searchParams.size === "all"
        ? undefined
        : (searchParams.size as
            | "187ml"
            | "375ml"
            | "750ml"
            | "1L"
            | "1.5L"
            | "3L"
            | "6L"
            | undefined),
    inStock: (searchParams.inStock || "all") as
      | "all"
      | "available"
      | "out-of-stock",
    discontinued: (searchParams.discontinued || "active") as
      | "all"
      | "active"
      | "discontinued",
    sortBy: (searchParams.sortBy || "createdAt") as
      | "name"
      | "country"
      | "type"
      | "inStock"
      | "createdAt"
      | "updatedAt",
    sortOrder: (searchParams.sortOrder || "desc") as "asc" | "desc",
  };

  const result = await unstable_cache(async () => await getWines(queryInput), [
    "wines", queryInput.country, queryInput.type, queryInput.size, queryInput.inStock, queryInput.discontinued, queryInput.sortBy, queryInput.sortOrder, queryInput.page?.toString(), queryInput.limit?.toString(), queryInput.search
  ])();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">
            Erro ao carregar vinhos: {result.error}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { wines, pagination, filters } = result.data ?? {
    wines: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    filters: {
      countries: [],
      types: [],
      sizes: [],
    },
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <WineFilters
        availableCountries={filters.countries}
        availableTypes={filters.types}
        availableSizes={filters.sizes}
      />

      {/* Lista de vinhos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Vinhos Cadastrados ({pagination.total})</span>
            <AddWineButton />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wines.length === 0 ? (
            <div className="text-center py-8">
              <Wine className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Nenhum vinho encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cabeçalho da tabela - apenas em telas maiores */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 pb-2 border-b font-medium text-sm text-muted-foreground">
                <div className="col-span-3">Nome</div>
                <div className="col-span-2">País</div>
                <div className="col-span-2">Tipo</div>
                <div className="col-span-1">Tamanho</div>
                <div className="col-span-1">Estoque</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Ações</div>
              </div>

              {/* Lista de vinhos */}
              {wines.map((wine) => (
                <div
                  key={wine.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Mobile layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{wine.name}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <QuickStockUpdate wine={wine} />
                          <EditWineButton wine={wine} />
                          <DeleteWineButton wine={wine} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <span>{wine.country}</span>
                      <span>{wine.type}</span>
                      <span>{wine.size}</span>
                      <span
                        className={
                          wine.inStock === "0"
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {wine.inStock} unidades
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={wine.discontinued ? "secondary" : "default"}
                      >
                        {wine.discontinued ? "Descontinuado" : "Ativo"}
                      </Badge>
                      {wine.inStock === "0" && (
                        <Badge
                          variant="outline"
                          className="text-red-600 border-red-600"
                        >
                          Sem estoque
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:contents">
                    <div className="col-span-3 font-medium">{wine.name}</div>
                    <div className="col-span-2 flex items-center gap-1">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      {wine.country}
                    </div>
                    <div className="col-span-2">{wine.type}</div>
                    <div className="col-span-1">{wine.size}</div>
                    <div className="col-span-1">
                      <Badge
                        variant="outline"
                        className={
                          wine.inStock === "0"
                            ? "text-red-600 border-red-600"
                            : parseInt(wine.inStock) <= 5
                            ? "text-amber-600 border-amber-600"
                            : "text-green-600 border-green-600"
                        }
                      >
                        {wine.inStock}
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <Badge
                        variant={wine.discontinued ? "secondary" : "default"}
                      >
                        {wine.discontinued ? "Descontinuado" : "Ativo"}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <QuickStockUpdate wine={wine} />
                      <EditWineButton wine={wine} />
                      <DeleteWineButton wine={wine} />
                    </div>
                  </div>
                </div>
              ))}

              {/* Paginação */}
              <WinesPagination pagination={pagination} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}