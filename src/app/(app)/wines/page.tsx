import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wine,
  Package,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Globe,
  MoreHorizontal,
} from "lucide-react";
import {
  getWines,
  getWineStats,
  getLowStockWines,
  type GetWinesInput,
} from "@/app/actions/wines";
import { revalidateWinesCache } from "@/app/actions/wines-cache";
import { WineFilters } from "@/components/wines/wine-filters";
import { WinesPagination } from "@/components/wines/wines-pagination";
import {
  AddWineButton,
  EditWineButton,
  DeleteWineButton,
} from "@/components/wines/wine-dialogs";
import { QuickStockUpdate } from "@/components/wines/quick-stock-update";
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

function WinesTableSkeleton() {
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

// Componente de estatísticas gerais dos vinhos
async function WinesStats() {
  const result = await getWineStats();

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

  const { total, active, discontinued, outOfStock, lowStock, recentCount } =
    result.data ?? {
      total: 0,
      active: 0,
      discontinued: 0,
      outOfStock: 0,
      lowStock: 0,
      recentCount: 0,
    };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Vinhos</CardTitle>
          <Wine className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">
            {active} ativos, {discontinued} descontinuados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estoque</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{outOfStock}</div>
          <p className="text-xs text-muted-foreground">Sem estoque</p>
          {lowStock > 0 && (
            <Badge
              variant="outline"
              className="text-amber-600 border-amber-600 mt-2"
            >
              {lowStock} com estoque baixo
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Adicionados Recentemente
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{recentCount}</div>
          <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
        </CardContent>
      </Card>
    </>
  );
}

// Componente de alerta de baixo estoque
async function LowStockAlert() {
  const result = await getLowStockWines(5);

  if (!result.success || !result.data || result.data.length === 0) {
    return null;
  }

  const lowStockWines = result.data;

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
          Vinhos com Estoque Baixo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {lowStockWines.slice(0, 5).map((wine) => (
            <div
              key={wine.id}
              className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200"
            >
              <div>
                <p className="font-medium">{wine.name}</p>
                <p className="text-sm text-muted-foreground">
                  {wine.country} • {wine.type} • {wine.size}
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-600"
              >
                {wine.inStock} unidades
              </Badge>
            </div>
          ))}
          {lowStockWines.length > 5 && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              +{lowStockWines.length - 5} outros vinhos com estoque baixo
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente da lista de vinhos
async function WinesList({
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

  const result = await getWines(queryInput);

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

// Componente principal da página
export default async function WinesPage({
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

      {/* Alerta de estoque baixo */}
      <Suspense
        fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}
      >
        <LowStockAlert />
      </Suspense>

      {/* Lista de vinhos com filtros */}
      <Suspense fallback={<WinesTableSkeleton />}>
        <WinesList searchParams={normalizedSearchParams} />
      </Suspense>
    </div>
  );
}
