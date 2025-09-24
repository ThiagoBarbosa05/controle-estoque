"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, SortAsc, SortDesc, X } from "lucide-react";
import { useCustomerFilters } from "@/hooks/use-customer-actions";

export function CustomerFilters() {
  const { currentSearch, currentSortBy, currentSortOrder, updateSearchParams } =
    useCustomerFilters();

  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams({ search: searchInput });
  };

  const handleSortChange = (value: string) => {
    updateSearchParams({ sortBy: value });
  };

  const handleOrderChange = () => {
    const newOrder = currentSortOrder === "asc" ? "desc" : "asc";
    updateSearchParams({ sortOrder: newOrder });
  };

  const clearSearch = () => {
    setSearchInput("");
    updateSearchParams({ search: null });
  };

  const hasActiveFilters =
    currentSearch ||
    currentSortBy !== "createdAt" ||
    currentSortOrder !== "desc";

  return (
    <div className="space-y-4">
      {/* Busca */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar clientes por nome..."
            className="pl-10 pr-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={clearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Button type="submit" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Filtros e Ordenação */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Ordenar por:</span>
        </div>

        <Select value={currentSortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Data de Criação</SelectItem>
            <SelectItem value="updatedAt">Última Atualização</SelectItem>
            <SelectItem value="name">Nome</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleOrderChange}
          className="flex items-center gap-1"
        >
          {currentSortOrder === "asc" ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
          {currentSortOrder === "asc" ? "Crescente" : "Decrescente"}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              updateSearchParams({
                search: null,
                sortBy: "createdAt",
                sortOrder: "desc",
              })
            }
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Badges dos filtros ativos */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>

          {currentSearch && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{currentSearch}"
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={clearSearch}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {currentSortBy !== "createdAt" && (
            <Badge variant="secondary">
              Ordenação:{" "}
              {currentSortBy === "name" ? "Nome" : "Última Atualização"}
            </Badge>
          )}

          {currentSortOrder !== "desc" && (
            <Badge variant="secondary">Ordem: Crescente</Badge>
          )}
        </div>
      )}
    </div>
  );
}
