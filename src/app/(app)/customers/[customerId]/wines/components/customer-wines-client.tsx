"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Wine as WineIcon,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  type PaginatedCustomerWines,
  removeWineFromCustomer,
  getCustomerWines,
} from "@/app/actions/customer-wines";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface CustomerWinesClientProps {
  initialData: PaginatedCustomerWines;
  customerId: string;
  initialFilters: {
    page: number;
    limit: number;
    search: string;
    country: string;
    type: string;
    size: string;
    discontinued: "all" | "active" | "discontinued";
    sortBy: "name" | "country" | "type" | "inStock";
    sortOrder: "asc" | "desc";
  };
}

export function CustomerWinesClient({
  initialData,
  customerId,
  initialFilters,
}: CustomerWinesClientProps) {
  const router = useRouter();

  // Estados
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [removingWineId, setRemovingWineId] = useState<string | null>(null);

  // Debounced search
  const debouncedSearch = useDebounce(filters.search, 500);

  // Função para atualizar dados
  const fetchData = useCallback(
    async (newFilters: typeof filters) => {
      setIsLoading(true);
      setError("");

      try {
        const result = await getCustomerWines({
          customerId,
          ...newFilters,
        });

        if (result.success && result.data) {
          setData(result.data);

          // Atualizar URL sem recarregar
          const params = new URLSearchParams();
          if (newFilters.page > 1)
            params.set("page", newFilters.page.toString());
          if (newFilters.limit !== 20)
            params.set("limit", newFilters.limit.toString());
          if (newFilters.search) params.set("search", newFilters.search);
          if (newFilters.country !== "all")
            params.set("country", newFilters.country);
          if (newFilters.type !== "all") params.set("type", newFilters.type);
          if (newFilters.size !== "all") params.set("size", newFilters.size);
          if (newFilters.discontinued !== "active")
            params.set("discontinued", newFilters.discontinued);
          if (newFilters.sortBy !== "name")
            params.set("sortBy", newFilters.sortBy);
          if (newFilters.sortOrder !== "asc")
            params.set("sortOrder", newFilters.sortOrder);

          const newUrl = params.toString() ? `?${params.toString()}` : "";
          window.history.replaceState(
            {},
            "",
            `/customers/${customerId}/wines${newUrl}`
          );
        } else {
          setError(result.error || "Erro ao carregar dados");
        }
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setError("Erro interno do servidor");
      } finally {
        setIsLoading(false);
      }
    },
    [customerId]
  );

  // Atualizar quando search mudar (debounced)
  useEffect(() => {
    if (debouncedSearch !== initialFilters.search) {
      const newFilters = { ...filters, search: debouncedSearch, page: 1 };
      setFilters(newFilters);
      fetchData(newFilters);
    }
  }, [debouncedSearch, initialFilters.search, filters, fetchData]);

  // Handlers
  const handleFilterChange = useCallback(
    (key: keyof typeof filters, value: string | number) => {
      const newFilters = { ...filters, [key]: value, page: 1 };
      setFilters(newFilters);
      fetchData(newFilters);
    },
    [filters, fetchData]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const newFilters = { ...filters, page };
      setFilters(newFilters);
      fetchData(newFilters);
    },
    [filters, fetchData]
  );

  const handleRemoveWine = useCallback(
    async (wineId: string) => {
      if (!confirm("Tem certeza que deseja remover este vinho da lista?"))
        return;

      setRemovingWineId(wineId);
      setError("");

      try {
        const result = await removeWineFromCustomer({
          customerId,
          wineId,
        });

        if (result.success) {
          // Recarregar dados
          await fetchData(filters);
        } else {
          setError(result.error || "Erro ao remover vinho");
        }
      } catch (err) {
        console.error("Erro ao remover vinho:", err);
        setError("Erro interno do servidor");
      } finally {
        setRemovingWineId(null);
      }
    },
    [customerId, filters, fetchData]
  );

  // Estatísticas derivadas
  const statsCards = useMemo(
    () => [
      {
        title: "Total de Vinhos",
        value: data.stats.total,
        icon: WineIcon,
        color: "bg-blue-500",
      },
      {
        title: "Vinhos Ativos",
        value: data.stats.active,
        icon: CheckCircle2,
        color: "bg-green-500",
      },
      {
        title: "Fora de Estoque",
        value: data.stats.outOfStock,
        icon: AlertCircle,
        color: "bg-red-500",
      },
      {
        title: "Estoque Baixo",
        value: data.stats.lowStock,
        icon: TrendingDown,
        color: "bg-yellow-500",
      },
    ],
    [data.stats]
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Lista de Vinhos</h1>
            <p className="text-muted-foreground">
              {data.customer.name} • {data.pagination.total} vinho(s)
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/wines-list/create`)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Vinhos
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center p-6">
              <div className={`${stat.color} rounded-full p-3 mr-4`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome do vinho..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Country Filter */}
            <div className="space-y-2">
              <Label>País</Label>
              <Select
                value={filters.country}
                onValueChange={(value) => handleFilterChange("country", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {data.filters.countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => handleFilterChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {data.filters.types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size Filter */}
            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Select
                value={filters.size}
                onValueChange={(value) => handleFilterChange("size", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tamanho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {data.filters.sizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.discontinued}
                onValueChange={(value) =>
                  handleFilterChange("discontinued", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="discontinued">Descontinuados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ordenar por</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleFilterChange("sortBy", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="country">País</SelectItem>
                  <SelectItem value="type">Tipo</SelectItem>
                  <SelectItem value="inStock">Estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ordem</Label>
              <Select
                value={filters.sortOrder}
                onValueChange={(value) =>
                  handleFilterChange("sortOrder", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">
                    <div className="flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Crescente
                    </div>
                  </SelectItem>
                  <SelectItem value="desc">
                    <div className="flex items-center">
                      <TrendingDown className="mr-2 h-4 w-4" />
                      Decrescente
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wine List Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WineIcon className="h-5 w-5" />
              Vinhos
            </div>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <CardDescription>
            Página {data.pagination.page} de {data.pagination.totalPages} •{" "}
            {data.pagination.total} vinho(s) total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vinho</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.customerWines.length > 0 ? (
                  data.customerWines.map((customerWine) => (
                    <TableRow key={customerWine.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <WineIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {customerWine.wine.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Adicionado em {new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {customerWine.wine.country || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {customerWine.wine.type || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {customerWine.wine.size || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-medium",
                              customerWine.wine.inStock === 0
                                ? "text-red-600"
                                : customerWine.wine.inStock <=
                                  customerWine.wine.minStock
                                ? "text-yellow-600"
                                : "text-green-600"
                            )}
                          >
                            {customerWine.wine.inStock}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            unidades
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            customerWine.wine.discontinued
                              ? "destructive"
                              : "default"
                          }
                        >
                          {customerWine.wine.discontinued
                            ? "Descontinuado"
                            : "Ativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveWine(customerWine.wine.id)}
                          disabled={removingWineId === customerWine.wine.id}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {removingWineId === customerWine.wine.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <WineIcon className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {filters.search ||
                          filters.country !== "all" ||
                          filters.type !== "all" ||
                          filters.size !== "all"
                            ? "Nenhum vinho encontrado com os filtros aplicados"
                            : "Nenhum vinho na lista do cliente"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando{" "}
                {(data.pagination.page - 1) * data.pagination.limit + 1} a{" "}
                {Math.min(
                  data.pagination.page * data.pagination.limit,
                  data.pagination.total
                )}{" "}
                de {data.pagination.total} resultado(s)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.pagination.page - 1)}
                  disabled={!data.pagination.hasPrev || isLoading}
                >
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {data.pagination.page} de {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.pagination.page + 1)}
                  disabled={!data.pagination.hasNext || isLoading}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
