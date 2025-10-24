"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, Search, X } from "lucide-react";
import type { CustomerWinesFilters } from "@/types/customer-wines";

interface CustomerWinesFiltersProps {
  currentFilters: CustomerWinesFilters;
}

export function CustomerWinesFiltersSimple({
  currentFilters,
}: CustomerWinesFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentFilters.search || "");

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== "all" && value !== "") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset to first page when filtering
    params.set("page", "1");

    router.push(`?${params.toString()}`);
  };

  const handleSearch = () => {
    updateFilter("search", searchValue);
  };

  const clearFilters = () => {
    router.push(window.location.pathname);
  };

  const hasActiveFilters =
    currentFilters.search ||
    (currentFilters.wineType && currentFilters.wineType !== "all") ||
    (currentFilters.country && currentFilters.country !== "all") ||
    (currentFilters.discontinued && currentFilters.discontinued !== "active");

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
              onClick={clearFilters}
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="grid gap-2">
          <Label htmlFor="search">Buscar vinho</Label>
          <div className="flex gap-2">
            <Input
              id="search"
              placeholder="Nome do vinho..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <Button onClick={handleSearch} size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status */}
          <div className="grid gap-2">
            <Label htmlFor="discontinued">Status</Label>
            <Select
              value={currentFilters.discontinued || "active"}
              onValueChange={(value) => updateFilter("discontinued", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="discontinued">Descontinuados</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Wine Type */}
          <div className="grid gap-2">
            <Label htmlFor="wineType">Tipo</Label>
            <Select
              value={currentFilters.wineType || "all"}
              onValueChange={(value) => updateFilter("wineType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="Tinto">Tinto</SelectItem>
                <SelectItem value="Branco">Branco</SelectItem>
                <SelectItem value="Rosé">Rosé</SelectItem>
                <SelectItem value="Espumante">Espumante</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Country */}
          <div className="grid gap-2">
            <Label htmlFor="country">País</Label>
            <Select
              value={currentFilters.country || "all"}
              onValueChange={(value) => updateFilter("country", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os países" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os países</SelectItem>
                <SelectItem value="Brasil">Brasil</SelectItem>
                <SelectItem value="França">França</SelectItem>
                <SelectItem value="Itália">Itália</SelectItem>
                <SelectItem value="Espanha">Espanha</SelectItem>
                <SelectItem value="Portugal">Portugal</SelectItem>
                <SelectItem value="Chile">Chile</SelectItem>
                <SelectItem value="Argentina">Argentina</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
