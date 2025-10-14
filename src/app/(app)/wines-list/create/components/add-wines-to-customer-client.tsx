"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Users,
  Wine as WineIcon,
  Check,
  ChevronsUpDown,
  Search,
  ArrowLeft,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { useCustomerWinesActions } from "@/hooks/use-customer-wines-actions";
import { getCustomers } from "@/app/actions/customers";
import { getWines } from "@/app/actions/wines";
import type { Customer } from "@/app/actions/customers";
import type { Wine } from "@/app/actions/wines";
import { cn } from "@/lib/utils";

interface WineSelection extends Wine {
  selected: boolean;
}

interface AddWinesToCustomerClientProps {
  initialCustomers: Customer[];
  initialWines: Wine[];
}

export function AddWinesToCustomerClient({
  initialCustomers,
  initialWines,
}: AddWinesToCustomerClientProps) {
  const router = useRouter();

  // Estados principais
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [wines, setWines] = useState<WineSelection[]>(
    initialWines.map((wine) => ({ ...wine, selected: false }))
  );
  const [selectedWineIds, setSelectedWineIds] = useState<Set<string>>(
    new Set()
  );

  // Estados de loading
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingWines, setLoadingWines] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estados de UI
  const [error, setError] = useState<string>("");
  const [customerComboboxOpen, setCustomerComboboxOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [wineSearch, setWineSearch] = useState("");

  // Refs para debounce
  const customerSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wineSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { handleAddWineToCustomer } = useCustomerWinesActions();

  // Cliente selecionado
  const selectedCustomer = useMemo(() => {
    return customers.find((customer) => customer.id === customerId);
  }, [customers, customerId]);

  // Carregar clientes com busca
  const loadCustomers = useCallback(async (search?: string) => {
    setLoadingCustomers(true);
    try {
      const result = await getCustomers({
        limit: 30,
        search: search?.trim() || undefined,
        sortBy: "name",
        sortOrder: "asc",
      });
      if (result.success && result.data) {
        setCustomers(result.data.customers);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      setError("Erro ao carregar clientes");
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  // Carregar vinhos com busca
  const loadWines = useCallback(async (search?: string) => {
    setLoadingWines(true);
    try {
      const result = await getWines({
        limit: 50,
        discontinued: "active",
        search: search?.trim() || undefined,
        sortBy: "name",
        sortOrder: "asc",
      });
      if (result.success && result.data) {
        const winesWithSelection: WineSelection[] = result.data.wines.map(
          (wine) => ({
            ...wine,
            selected: false,
          })
        );
        setWines(winesWithSelection);
        // Manter seleções existentes
        setSelectedWineIds((prev) => {
          const newSet = new Set<string>();
          prev.forEach((id) => {
            if (winesWithSelection.some((wine) => wine.id === id)) {
              newSet.add(id);
            }
          });
          return newSet;
        });
      }
    } catch (error) {
      console.error("Erro ao carregar vinhos:", error);
      setError("Erro ao carregar vinhos");
    } finally {
      setLoadingWines(false);
    }
  }, []);

  // Busca de clientes com debounce
  const debouncedSearchCustomers = useCallback(
    (search: string) => {
      if (customerSearchTimeoutRef.current) {
        clearTimeout(customerSearchTimeoutRef.current);
      }
      customerSearchTimeoutRef.current = setTimeout(() => {
        loadCustomers(search);
      }, 300);
    },
    [loadCustomers]
  );

  // Busca de vinhos com debounce
  const debouncedSearchWines = useCallback(
    (search: string) => {
      if (wineSearchTimeoutRef.current) {
        clearTimeout(wineSearchTimeoutRef.current);
      }
      wineSearchTimeoutRef.current = setTimeout(() => {
        loadWines(search);
      }, 300);
    },
    [loadWines]
  );

  // Efeito para buscar clientes
  useEffect(() => {
    if (customerSearch) {
      debouncedSearchCustomers(customerSearch);
    }
  }, [customerSearch, debouncedSearchCustomers]);

  // Efeito para buscar vinhos
  useEffect(() => {
    if (wineSearch) {
      debouncedSearchWines(wineSearch);
    }
  }, [wineSearch, debouncedSearchWines]);

  // Cleanup dos timeouts
  useEffect(() => {
    return () => {
      if (customerSearchTimeoutRef.current) {
        clearTimeout(customerSearchTimeoutRef.current);
      }
      if (wineSearchTimeoutRef.current) {
        clearTimeout(wineSearchTimeoutRef.current);
      }
    };
  }, []);

  // Funções de manipulação
  const handleCustomerSelect = useCallback((selectedCustomerId: string) => {
    setCustomerId(selectedCustomerId);
    setCustomerComboboxOpen(false);
  }, []);

  const handleWineToggle = useCallback((wineId: string) => {
    setSelectedWineIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(wineId)) {
        newSet.delete(wineId);
      } else {
        newSet.add(wineId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedWineIds.size === wines.length) {
      setSelectedWineIds(new Set());
    } else {
      setSelectedWineIds(new Set(wines.map((wine) => wine.id)));
    }
  }, [selectedWineIds.size, wines]);

  const handleSubmit = useCallback(async () => {
    if (!customerId || selectedWineIds.size === 0) {
      setError("Selecione um cliente e pelo menos um vinho");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Adicionar vinhos um por um
      const promises = Array.from(selectedWineIds).map((wineId) =>
        handleAddWineToCustomer({ customerId, wineId })
      );

      const results = await Promise.all(promises);
      const failedResults = results.filter((result) => !result.success);

      if (failedResults.length > 0) {
        setError(`Erro ao adicionar ${failedResults.length} vinho(s) à lista`);
      } else {
        // Sucesso - redirecionar
        router.push(`/customers/${customerId}/wines`);
      }
    } catch (error) {
      console.error("Erro ao adicionar vinhos:", error);
      setError("Erro interno do servidor");
    } finally {
      setSubmitting(false);
    }
  }, [customerId, selectedWineIds, handleAddWineToCustomer, router]);

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Adicionar Vinhos à Lista</h1>
          <p className="text-muted-foreground">
            Selecione um cliente e os vinhos que deseja adicionar à sua lista
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer Selection */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Cliente
              </CardTitle>
              <CardDescription>
                Escolha o cliente para adicionar os vinhos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Popover
                  open={customerComboboxOpen}
                  onOpenChange={setCustomerComboboxOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerComboboxOpen}
                      className="w-full justify-between"
                      disabled={loadingCustomers}
                    >
                      {loadingCustomers
                        ? "Carregando..."
                        : selectedCustomer?.name || "Selecione um cliente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popper-anchor-width] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Pesquisar cliente..."
                        value={customerSearch}
                        onValueChange={setCustomerSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {loadingCustomers
                            ? "Carregando..."
                            : "Nenhum cliente encontrado."}
                        </CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name}
                              onSelect={() => handleCustomerSelect(customer.id)}
                            >
                              <Users className="mr-2 h-4 w-4" />
                              <span>{customer.name}</span>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  customerId === customer.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected Customer Info */}
                {selectedCustomer && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {selectedCustomer.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wine Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WineIcon className="h-5 w-5" />
                Vinhos Disponíveis
              </CardTitle>
              <CardDescription>
                Selecione os vinhos para adicionar à lista
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquisar vinhos..."
                  value={wineSearch}
                  onChange={(e) => setWineSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Selection Summary */}
              {wines.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="text-sm font-medium">
                    {selectedWineIds.size} de {wines.length} vinho(s)
                    selecionado(s)
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedWineIds.size === wines.length
                      ? "Desmarcar Todos"
                      : "Selecionar Todos"}
                  </Button>
                </div>
              )}

              {/* Wine Table */}
              <div className="border rounded-md">
                {loadingWines ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Carregando vinhos...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              wines.length > 0 &&
                              selectedWineIds.size === wines.length
                            }
                            onCheckedChange={handleSelectAll}
                            aria-label="Selecionar todos"
                          />
                        </TableHead>
                        <TableHead>Vinho</TableHead>
                        <TableHead>País</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estoque</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wines.length > 0 ? (
                        wines.map((wine) => (
                          <TableRow
                            key={wine.id}
                            className={cn(
                              "cursor-pointer transition-colors hover:bg-muted/50",
                              selectedWineIds.has(wine.id) && "bg-muted/50"
                            )}
                            onClick={() => handleWineToggle(wine.id)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedWineIds.has(wine.id)}
                                onCheckedChange={() =>
                                  handleWineToggle(wine.id)
                                }
                                aria-label={`Selecionar ${wine.name}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <WineIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{wine.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {wine.country}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {wine.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  wine.inStock === 0
                                    ? "text-destructive"
                                    : wine.inStock <= wine.minStock
                                    ? "text-yellow-600"
                                    : "text-green-600"
                                )}
                              >
                                {wine.inStock}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-muted-foreground"
                          >
                            {wineSearch
                              ? "Nenhum vinho encontrado para esta busca."
                              : "Nenhum vinho disponível."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 border-t pt-6">
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !customerId || selectedWineIds.size === 0}
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adicionando...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Adicionar {selectedWineIds.size} Vinho
              {selectedWineIds.size !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
