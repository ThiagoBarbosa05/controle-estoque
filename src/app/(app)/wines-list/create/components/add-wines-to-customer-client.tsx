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
import { cn } from "@/lib/utils";
import {
  useWineSelection,
  WineSelectionProvider,
} from "./WineSelectionContext";
import { SelectedWinesTable } from "./SelectedWinesTable";
import { WineSelectionTable } from "./WineSelectionTable";
import type { Customer } from "@/app/actions/customers";
import type { Wine } from "@/app/actions/wines";

interface AddWinesToCustomerClientProps {
  initialCustomers: Customer[];
  initialWines: Wine[];
}

function AddWinesToCustomerContent({
  initialCustomers,
  initialWines,
}: AddWinesToCustomerClientProps) {
  const router = useRouter();

  const { selectedWineIds } = useWineSelection();
  // Estados principais
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [wines, setWines] = useState<Wine[]>(initialWines);

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
    } catch {
      console.error("Erro ao carregar clientes");
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
        setWines(result.data.wines);
      }
    } catch (error) {
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

  const handleSubmit = useCallback(async () => {
    if (!customerId || selectedWineIds.size === 0) {
      setError("Selecione um cliente e pelo menos um vinho");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const promises = Array.from(selectedWineIds).map((wineId) =>
        handleAddWineToCustomer({ customerId, wineId: wineId as string })
      );
      const results = await Promise.all(promises);
      const failedResults = results.filter((result) => !result.success);
      if (failedResults.length > 0)
        setError(`Erro ao adicionar ${failedResults.length} vinho(s) à lista`);
      else router.push(`/customers/${customerId}/wines`);
    } catch {
      setError("Erro interno do servidor");
    } finally {
      setSubmitting(false);
    }
  }, [customerId, handleAddWineToCustomer, router, selectedWineIds]);

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
              {/* Vinhos selecionados sempre visíveis */}
              <SelectedWinesTable />
              {/* Wine Table */}
              <WineSelectionTable wines={wines} loading={loadingWines} />
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

export function AddWinesToCustomerClient({
  initialCustomers,
  initialWines,
}: AddWinesToCustomerClientProps) {
  return (
    <WineSelectionProvider>
      <AddWinesToCustomerContent
        initialCustomers={initialCustomers}
        initialWines={initialWines}
      />
    </WineSelectionProvider>
  );
}
