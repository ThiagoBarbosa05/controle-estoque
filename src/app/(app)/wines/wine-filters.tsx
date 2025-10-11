"use client"
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
import { useWineFilters } from "@/hooks/use-wine-actions";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface WineFiltersProps {
  availableCountries?: string[];
  availableTypes?: string[];
  availableSizes?: string[];
}

export function WineFilters({
  availableCountries = [],
  availableTypes = [],
  availableSizes = [],
}: WineFiltersProps) {
  // const { currentFilters, updateFilters, clearFilters } = useWineFilters();

  // const handleFilterChange = (key: string, value: string) => {
  //   updateFilters({ [key]: value });
  // };

  // const handleSearchChange = (value: string) => {
  //   updateFilters({ search: value });
  // };

  // const hasActiveFilters = Object.entries(currentFilters).some(
  //   ([key, value]) =>
  //     key !== "page" &&
  //     key !== "sortBy" &&
  //     key !== "sortOrder" &&
  //     value &&
  //     value !== "all" &&
  //     value !== "active" &&
  //     value !== "createdAt" &&
  //     value !== "desc"
  // );
  const [searchTerm, setSearchTerm] = useState("");
  
  const searchParams = useSearchParams();
  const router = useRouter();

  function handleSearch() {
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }
    router.push(`/wines?${params.toString()}`);
  }
 

  function clearFilters() {
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    setSearchTerm("");
    router.push(`/wines?${params.toString()}`);

  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
          {/* {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )} */}
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
          <Button type="button" onClick={handleSearch} title="Pesquisar" variant="outline">
              <Search />
              
              </Button>

          </div>
          {searchParams.get("search") && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por país */}
          <div className="grid gap-2">
            <Label htmlFor="country">País</Label>
            <Select
              // value={currentFilters.country}
              // onValueChange={(value) => handleFilterChange("country", value)}
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
              // value={currentFilters.type}
              // onValueChange={(value) => handleFilterChange("type", value)}
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
              // value={currentFilters.size}
              // onValueChange={(value) => handleFilterChange("size", value)}
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
              // value={currentFilters.inStock}
              // onValueChange={(value) => handleFilterChange("inStock", value)}
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
              // value={currentFilters.discontinued}
              // onValueChange={(value) =>
              //   handleFilterChange("discontinued", value)
              // }
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
              // value={currentFilters.sortBy}
              // onValueChange={(value) => handleFilterChange("sortBy", value)}
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
              // value={currentFilters.sortOrder}
              // onValueChange={(value) => handleFilterChange("sortOrder", value)}
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
