"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useTransition } from "react";
import { WINE_COUNTRIES, WINE_SIZES, WINE_TYPES } from "./wine-dialogs";

const availableCountries = WINE_COUNTRIES;
const availableTypes = WINE_TYPES;
const availableSizes = WINE_SIZES;

// Mapas para converter label -> enum
const countryLabelToEnum: Record<string, string> = {
  Chile: "CHILE",
  Argentina: "ARGENTINA",
  Itália: "ITALIA",
  França: "FRANÇA",
  Alemanha: "ALEMANHA",
  Uruguai: "URUGUAI",
  Portugal: "PORTUGAL",
  Espanha: "ESPANHA",
  Brasil: "BRASIL",
  "Estados Unidos": "ESTADOS UNIDOS",
  "Nova Zelândia": "NOVA ZELÂNDIA",
  Outros: "OUTROS",
};
const typeLabelToEnum: Record<string, string> = {
  Tinto: "TINTO",
  Branco: "BRANCO",
  Rose: "ROSE",
  Espumante: "ESPUMANTE",
  Fortificado: "FORTIFICADO",
  Sobremesa: "SOBREMESA",
};
const sizeLabelToEnum: Record<string, string> = {
  "187ml": "187ml",
  "375ml": "375ml",
  "750ml": "750ml",
  "1L": "1L",
  "1.5L": "1.5L",
  "3L": "3L",
  "6L": "6L",
};

export function WineFilters() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const router = useRouter();

  const updateFilters = useCallback(
    (newFilters: Record<string, string>) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams);

        // Reset para primeira página quando filtros mudarem
        params.delete("page");

        Object.entries(newFilters).forEach(([key, value]) => {
          if (value && value !== "all" && value !== "") {
            params.set(key, value);
          } else {
            params.delete(key);
          }
        });

        router.push(`/wines?${params.toString()}`);
      });
    },
    [searchParams, router]
  );

  const handleSearch = useCallback(() => {
    updateFilters({ search: searchTerm });
  }, [searchTerm, updateFilters]);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      let filterValue = value;
      if (key === "country") {
        filterValue =
          value === "all" ? "all" : countryLabelToEnum[value] || value;
      } else if (key === "type") {
        filterValue = value === "all" ? "all" : typeLabelToEnum[value] || value;
      } else if (key === "size") {
        filterValue = value === "all" ? "all" : sizeLabelToEnum[value] || value;
      }
      updateFilters({ [key]: filterValue });
    },
    [updateFilters]
  );

  const clearAllFilters = useCallback(() => {
    startTransition(() => {
      setSearchTerm("");
      router.push("/wines");
    });
  }, [router]);

  // Verificar se tem filtros ativos
  const hasActiveFilters = Array.from(searchParams.entries()).some(
    ([key, value]) =>
      key !== "page" &&
      key !== "limit" &&
      value &&
      value !== "all" &&
      value !== "active" &&
      value !== "createdAt" &&
      value !== "desc"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="ml-auto"
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca por nome */}
        <div className="grid gap-2">
          <Label htmlFor="search">Buscar por nome</Label>
          <div className="relative flex gap-2">
            <Input
              id="search"
              placeholder="Digite o nome do vinho..."
              value={searchTerm}
              defaultValue={searchParams.get("search") || searchTerm || ""}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button
              type="button"
              onClick={handleSearch}
              title="Pesquisar"
              variant="outline"
              disabled={isPending}
            >
              <Search />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por país */}
          <div className="grid gap-2">
            <Label htmlFor="country">País</Label>
            <Select
              value={searchParams.get("country") || "all"}
              onValueChange={(value) => handleFilterChange("country", value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os países</SelectItem>
                {availableCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por tipo */}
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={searchParams.get("type") || "all"}
              onValueChange={(value) => handleFilterChange("type", value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por tamanho */}
          <div className="grid gap-2">
            <Label htmlFor="size">Tamanho</Label>
            <Select
              value={searchParams.get("size") || "all"}
              onValueChange={(value) => handleFilterChange("size", value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tamanhos</SelectItem>
                {availableSizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por estoque */}
          <div className="grid gap-2">
            <Label htmlFor="stock">Estoque</Label>
            <Select
              value={searchParams.get("inStock") || "all"}
              onValueChange={(value) => handleFilterChange("inStock", value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="available">Com estoque</SelectItem>
                <SelectItem value="out-of-stock">Sem estoque</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por status */}
          <div className="grid gap-2">
            <Label htmlFor="discontinued">Status</Label>
            <Select
              value={searchParams.get("discontinued") || "active"}
              onValueChange={(value) =>
                handleFilterChange("discontinued", value)
              }
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ativos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="discontinued">Descontinuados</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ordenação */}
          <div className="grid gap-2">
            <Label htmlFor="sortBy">Ordenar por</Label>
            <Select
              value={searchParams.get("sortBy") || "createdAt"}
              onValueChange={(value) => handleFilterChange("sortBy", value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Data de criação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="country">País</SelectItem>
                <SelectItem value="type">Tipo</SelectItem>
                <SelectItem value="inStock">Estoque</SelectItem>
                <SelectItem value="createdAt">Data de criação</SelectItem>
                <SelectItem value="updatedAt">Última atualização</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ordem */}
          <div className="grid gap-2">
            <Label htmlFor="sortOrder">Ordem</Label>
            <Select
              value={searchParams.get("sortOrder") || "desc"}
              onValueChange={(value) => handleFilterChange("sortOrder", value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Decrescente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Decrescente</SelectItem>
                <SelectItem value="asc">Crescente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
