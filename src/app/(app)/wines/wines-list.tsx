import { getWines, type GetWinesInput } from "@/app/actions/wines";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuickStockUpdate } from "@/components/wines/quick-stock-update";

import { WinesPagination } from "@/components/wines/wines-pagination";

import { Edit, Globe, MoreHorizontal, Plus, Wine } from "lucide-react";
import { EditWineButton } from "./edit-wine-button";
import { DeleteWineButton } from "./delete-wine-button";
import { WineFormDialog } from "./wine-dialogs";

// Componente para uma linha de vinho (responsivo)
function WineRow({ wine }: { wine: any }) {
  return (
    <div
      key={wine.id}
      className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors bg-background"
    >
      {/* Mobile layout */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium break-words max-w-[60vw]">{wine.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="flex items-center gap-1">
                <QuickStockUpdate wine={wine} />
                <WineFormDialog wine={wine}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                  </Button>
                </WineFormDialog>
                <DeleteWineButton wine={wine} />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <span>{wine.country}</span>
          <span>{wine.type}</span>
          <span>{wine.size}</span>
          <span
            className={wine.inStock === "0" ? "text-red-600" : "text-green-600"}
          >
            {wine.inStock} unidades
          </span>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant={wine.discontinued ? "secondary" : "default"}>
            {wine.discontinued ? "Descontinuado" : "Ativo"}
          </Badge>
          {wine.inStock === "0" && (
            <Badge variant="outline" className="text-red-600 border-red-600">
              Sem estoque
            </Badge>
          )}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:contents">
        <div className="col-span-3 font-medium break-words">{wine.name}</div>
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
          <Badge variant={wine.discontinued ? "secondary" : "default"}>
            {wine.discontinued ? "Descontinuado" : "Ativo"}
          </Badge>
        </div>
        <div className="col-span-2 flex gap-2 flex-wrap">
          <QuickStockUpdate wine={wine} />
          <WineFormDialog wine={wine}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" />
            </Button>
          </WineFormDialog>
          <DeleteWineButton wine={wine} />
        </div>
      </div>
    </div>
  );
}

export async function WinesList({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  // Converter parâmetros de busca para entrada da query
  // Log para depuração
  // Garantir que só valores válidos dos enums sejam passados
  const validCountries = [
    "CHILE",
    "ARGENTINA",
    "ITALIA",
    "FRANÇA",
    "ALEMANHA",
    "URUGUAI",
    "PORTUGAL",
    "ESPANHA",
    "BRASIL",
    "ESTADOS UNIDOS",
    "NOVA ZELÂNDIA",
    "OUTROS",
  ];
  const validTypes = [
    "TINTO",
    "BRANCO",
    "ROSE",
    "ESPUMANTE",
    "FORTIFICADO",
    "SOBREMESA",
  ];
  const validSizes = ["187ML", "375ML", "750ML", "1L", "1.5L", "3L", "6L"];

  const queryInput: Partial<GetWinesInput> = {
    page: parseInt(searchParams.page || "1"),
    limit: parseInt(searchParams.limit || "10"),
    search: searchParams.search,
    country:
      searchParams.country && validCountries.includes(searchParams.country)
        ? (searchParams.country as GetWinesInput["country"])
        : undefined,
    type:
      searchParams.type && validTypes.includes(searchParams.type)
        ? (searchParams.type as GetWinesInput["type"])
        : undefined,
    size:
      searchParams.size && validSizes.includes(searchParams.size)
        ? (searchParams.size as GetWinesInput["size"])
        : undefined,
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

  const { wines, pagination } = result.data ?? {
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

      {/* Lista de vinhos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Vinhos Cadastrados ({pagination.total})</span>
            <WineFormDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Vinho
              </Button>
            </WineFormDialog>
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
                <WineRow key={wine.id} wine={wine} />
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
