"use client";

import { useState, useEffect } from "react";
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
import { Filter, X, Users } from "lucide-react";
import { useCustomerWinesFilters } from "@/hooks/use-customer-wines-actions";
import { getCustomers } from "@/app/actions/customers";
import type { Customer } from "@/app/actions/customers";

interface CustomerWinesFiltersProps {
  availableWineTypes?: string[];
  availableCountries?: string[];
}

export function CustomerWinesFilters({
  availableWineTypes = [],
  availableCountries = [],
}: CustomerWinesFiltersProps) {
  const { currentFilters, updateFilters, clearFilters } =
    useCustomerWinesFilters();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const result = await getCustomers({ limit: 100 });
      if (result.success && result.data) {
        setCustomers(result.data.customers);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    updateFilters({ [key]: value });
  };

  const hasActiveFilters = Object.entries(currentFilters).some(
    ([key, value]) =>
      key !== "page" &&
      key !== "sortBy" &&
      key !== "sortOrder" &&
      value &&
      value !== "all" &&
      value !== "active" &&
      value !== "addedAt" &&
      value !== "desc" &&
      value !== ""
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por cliente */}
          <div className="grid gap-2">
            <Label htmlFor="customer">Cliente</Label>
            <Select
              value={currentFilters.customerId}
              onValueChange={(value) => handleFilterChange("customerId", value)}
              disabled={loadingCustomers}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os clientes</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {customer.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por tipo de vinho */}
          <div className="grid gap-2">
            <Label htmlFor="wineType">Tipo de Vinho</Label>
            <Select
              value={currentFilters.wineType}
              onValueChange={(value) => handleFilterChange("wineType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {availableWineTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por país */}
          <div className="grid gap-2">
            <Label htmlFor="country">País</Label>
            <Select
              value={currentFilters.country}
              onValueChange={(value) => handleFilterChange("country", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os países" />
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

          {/* Filtro por status */}
          <div className="grid gap-2">
            <Label htmlFor="discontinued">Status do Vinho</Label>
            <Select
              value={currentFilters.discontinued}
              onValueChange={(value) =>
                handleFilterChange("discontinued", value)
              }
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ordenação */}
          <div className="grid gap-2">
            <Label htmlFor="sortBy">Ordenar por</Label>
            <Select
              value={currentFilters.sortBy}
              onValueChange={(value) => handleFilterChange("sortBy", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Data de adição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wineName">Nome do Vinho</SelectItem>
                <SelectItem value="wineCountry">País do Vinho</SelectItem>
                <SelectItem value="wineType">Tipo do Vinho</SelectItem>
                <SelectItem value="addedAt">Data de Adição</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ordem */}
          <div className="grid gap-2">
            <Label htmlFor="sortOrder">Ordem</Label>
            <Select
              value={currentFilters.sortOrder}
              onValueChange={(value) => handleFilterChange("sortOrder", value)}
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
