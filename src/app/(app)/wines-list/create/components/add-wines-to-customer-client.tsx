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
    } catch {
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
    <div className="container mx-auto py-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="self-start sm:self-auto hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Voltar</span>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Adicionar Vinhos à Lista
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Selecione um cliente e os vinhos que deseja adicionar à sua lista
            pessoal
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          variant="destructive"
          className="border-destructive/20 bg-destructive/5"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-12 gap-6 xl:gap-8">
        {/* Customer Selection */}
        <div className="lg:col-span-4 xl:col-span-3">
          <Card className="h-fit shadow-sm border-0 bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-lg font-semibold">Cliente</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Escolha o cliente para adicionar os vinhos selecionados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Cliente *</Label>
                <Popover
                  open={customerComboboxOpen}
                  onOpenChange={setCustomerComboboxOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerComboboxOpen}
                      className={cn(
                        "w-full justify-between h-11",
                        "hover:bg-accent hover:border-accent-foreground/20",
                        "transition-all duration-200",
                        !selectedCustomer && "text-muted-foreground"
                      )}
                      disabled={loadingCustomers}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {loadingCustomers ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Carregando...</span>
                          </>
                        ) : selectedCustomer ? (
                          <>
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">
                              {selectedCustomer.name}
                            </span>
                          </>
                        ) : (
                          <span>Selecione um cliente...</span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popper-anchor-width] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Pesquisar cliente..."
                        value={customerSearch}
                        onValueChange={setCustomerSearch}
                        className="border-none focus:ring-0"
                      />
                      <CommandList>
                        <CommandEmpty className="py-6 text-center">
                          {loadingCustomers ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Carregando...</span>
                            </div>
                          ) : (
                            "Nenhum cliente encontrado."
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name}
                              onSelect={() => handleCustomerSelect(customer.id)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate">
                                  {customer.name}
                                </span>
                              </div>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4 text-primary",
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
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">
                          Cliente selecionado
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {selectedCustomer.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wine Selection */}
        <div className="lg:col-span-8 xl:col-span-9">
          <Card className="shadow-sm border-0 bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <WineIcon className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <span className="text-lg font-semibold">
                    Vinhos Disponíveis
                  </span>
                  {selectedWineIds.size > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {selectedWineIds.size} vinho
                        {selectedWineIds.size !== 1 ? "s" : ""} selecionado
                        {selectedWineIds.size !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </CardTitle>
              <CardDescription className="text-sm">
                Selecione os vinhos para adicionar à lista do cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquisar vinhos por nome, país ou tipo..."
                  value={wineSearch}
                  onChange={(e) => setWineSearch(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-4 py-3 border border-input rounded-lg",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                    "transition-all duration-200",
                    "placeholder:text-muted-foreground/60"
                  )}
                />
                {loadingWines && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
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
      <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6">
          {/* Info sobre seleção */}
          <div className="flex items-center gap-3">
            {selectedWineIds.size > 0 && selectedCustomer && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <ShoppingCart className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm font-medium">
                  {selectedWineIds.size} vinho
                  {selectedWineIds.size !== 1 ? "s" : ""} para{" "}
                  <span className="text-primary">{selectedCustomer.name}</span>
                </span>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !customerId || selectedWineIds.size === 0}
              size="lg"
              className={cn(
                "flex-1 sm:flex-none shadow-sm",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Adicionar{" "}
                  {selectedWineIds.size > 0 ? selectedWineIds.size : ""} Vinho
                  {selectedWineIds.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
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
