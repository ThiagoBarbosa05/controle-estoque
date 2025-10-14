"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
import {
  Plus,
  AlertTriangle,
  Users,
  Wine as WineIcon,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { useCustomerWinesActions } from "@/hooks/use-customer-wines-actions";
import { getCustomers } from "@/app/actions/customers";
import { getWines } from "@/app/actions/wines";
import type { Customer } from "@/app/actions/customers";
import type { Wine } from "@/app/actions/wines";
import { cn } from "@/lib/utils";

interface AddWineToCustomerDialogProps {
  trigger?: React.ReactNode;
  preselectedCustomerId?: string;
  preselectedWineId?: string;
}

export function AddWineToCustomerDialog({
  trigger,
  preselectedCustomerId,
  preselectedWineId,
}: AddWineToCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState(preselectedCustomerId || "");
  const [wineId, setWineId] = useState(preselectedWineId || "");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [wines, setWines] = useState<Wine[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingWines, setLoadingWines] = useState(false);
  const [error, setError] = useState<string>("");
  const [customerComboboxOpen, setCustomerComboboxOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [wineComboboxOpen, setWineComboboxOpen] = useState(false);
  const [wineSearch, setWineSearch] = useState("");

  const { handleAddWineToCustomer, isPending } = useCustomerWinesActions();

  // Refs para timeouts de debounce
  const customerSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wineSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Estados para clientes/vinhos pré-selecionados
  const [preselectedCustomer, setPreselectedCustomer] =
    useState<Customer | null>(null);
  const [preselectedWine, setPreselectedWine] = useState<Wine | null>(null);

  // Função para obter o cliente selecionado
  const selectedCustomer = useMemo(() => {
    return (
      customers.find((customer) => customer.id === customerId) ||
      preselectedCustomer
    );
  }, [customers, customerId, preselectedCustomer]);

  // Função para obter o vinho selecionado
  const selectedWine = useMemo(() => {
    return wines.find((wine) => wine.id === wineId) || preselectedWine;
  }, [wines, wineId, preselectedWine]);

  // Carregar cliente específico por ID
  const loadCustomerById = useCallback(async (id: string) => {
    try {
      const result = await getCustomers({ limit: 1 });
      if (result.success && result.data && result.data.customers.length > 0) {
        const customer = result.data.customers.find((c) => c.id === id);
        if (customer) {
          setPreselectedCustomer(customer);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar cliente por ID:", error);
    }
  }, []);

  // Carregar vinho específico por ID
  const loadWineById = useCallback(async (id: string) => {
    try {
      const result = await getWines({ limit: 1 });
      if (result.success && result.data && result.data.wines.length > 0) {
        const wine = result.data.wines.find((w) => w.id === id);
        if (wine) {
          setPreselectedWine(wine);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar vinho por ID:", error);
    }
  }, []);

  // Função para selecionar cliente
  const handleCustomerSelect = useCallback(
    (selectedCustomerId: string) => {
      setCustomerId(
        selectedCustomerId === customerId ? "" : selectedCustomerId
      );
      setCustomerComboboxOpen(false);
    },
    [customerId]
  );

  // Função para selecionar vinho
  const handleWineSelect = useCallback(
    (selectedWineId: string) => {
      setWineId(selectedWineId === wineId ? "" : selectedWineId);
      setWineComboboxOpen(false);
    },
    [wineId]
  );

  // Carregar clientes com busca
  const loadCustomers = useCallback(async (search?: string) => {
    setLoadingCustomers(true);
    try {
      const result = await getCustomers({
        limit: 50,
        search: search?.trim() || undefined,
        sortBy: "name",
        sortOrder: "asc",
      });
      if (result.success && result.data) {
        setCustomers(result.data.customers);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
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
      console.error("Erro ao carregar vinhos:", error);
    } finally {
      setLoadingWines(false);
    }
  }, []);

  // Função para buscar clientes com debounce
  const debouncedSearchCustomers = useCallback(
    (search: string) => {
      // Limpar timeout anterior
      if (customerSearchTimeoutRef.current) {
        clearTimeout(customerSearchTimeoutRef.current);
      }

      // Definir novo timeout
      customerSearchTimeoutRef.current = setTimeout(() => {
        loadCustomers(search);
      }, 300); // 300ms de debounce
    },
    [loadCustomers]
  );

  // Função para buscar vinhos com debounce
  const debouncedSearchWines = useCallback(
    (search: string) => {
      // Limpar timeout anterior
      if (wineSearchTimeoutRef.current) {
        clearTimeout(wineSearchTimeoutRef.current);
      }

      // Definir novo timeout
      wineSearchTimeoutRef.current = setTimeout(() => {
        loadWines(search);
      }, 300); // 300ms de debounce
    },
    [loadWines]
  );

  // Carregar dados iniciais ao abrir o dialog
  useEffect(() => {
    if (open) {
      loadCustomers();
      loadWines();

      // Carregar cliente pré-selecionado se necessário
      if (preselectedCustomerId && !selectedCustomer) {
        loadCustomerById(preselectedCustomerId);
      }

      // Carregar vinho pré-selecionado se necessário
      if (preselectedWineId && !selectedWine) {
        loadWineById(preselectedWineId);
      }
    }
  }, [
    open,
    loadCustomers,
    loadWines,
    preselectedCustomerId,
    preselectedWineId,
    selectedCustomer,
    selectedWine,
    loadCustomerById,
    loadWineById,
  ]);

  // Efeito para buscar clientes quando customerSearch muda
  useEffect(() => {
    if (open) {
      debouncedSearchCustomers(customerSearch);
    }
  }, [customerSearch, open, debouncedSearchCustomers]);

  // Efeito para buscar vinhos quando wineSearch muda
  useEffect(() => {
    if (open) {
      debouncedSearchWines(wineSearch);
    }
  }, [wineSearch, open, debouncedSearchWines]);

  // Cleanup dos timeouts ao desmontar
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

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);

    if (!newOpen) {
      setError("");
      setCustomerComboboxOpen(false);
      setCustomerSearch("");
      setWineComboboxOpen(false);
      setWineSearch("");
      setPreselectedCustomer(null);
      setPreselectedWine(null);
      if (!preselectedCustomerId) setCustomerId("");
      if (!preselectedWineId) setWineId("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerId || !wineId) {
      setError("Selecione um cliente e um vinho");
      return;
    }

    const result = await handleAddWineToCustomer({ customerId, wineId });

    if (result.success) {
      handleOpenChange(false);
    } else {
      setError(result.error || "Erro ao adicionar vinho à lista");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar à Lista
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Vinho à Lista do Cliente
            </DialogTitle>
            <DialogDescription>
              Selecione um cliente e um vinho para adicionar à lista.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="customer">Cliente *</Label>
              <Popover
                open={customerComboboxOpen}
                onOpenChange={setCustomerComboboxOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerComboboxOpen}
                    aria-label={
                      selectedCustomer?.name
                        ? `Cliente selecionado: ${selectedCustomer.name}`
                        : "Selecionar cliente"
                    }
                    className="w-full justify-between"
                    disabled={
                      isPending || loadingCustomers || !!preselectedCustomerId
                    }
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
                      className="h-9"
                      value={customerSearch}
                      onValueChange={setCustomerSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {loadingCustomers
                          ? "Carregando clientes..."
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
            </div>

            <div className="grid gap-2">
              <Label htmlFor="wine">Vinho *</Label>
              <Popover
                open={wineComboboxOpen}
                onOpenChange={setWineComboboxOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={wineComboboxOpen}
                    aria-label={
                      selectedWine?.name
                        ? `Vinho selecionado: ${selectedWine.name}`
                        : "Selecionar vinho"
                    }
                    className="w-full justify-between"
                    disabled={isPending || loadingWines || !!preselectedWineId}
                  >
                    {loadingWines
                      ? "Carregando..."
                      : selectedWine?.name || "Selecione um vinho..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popper-anchor-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Pesquisar vinho..."
                      className="h-9"
                      value={wineSearch}
                      onValueChange={setWineSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {loadingWines
                          ? "Carregando vinhos..."
                          : "Nenhum vinho encontrado."}
                      </CommandEmpty>
                      <CommandGroup>
                        {wines.map((wine) => (
                          <CommandItem
                            key={wine.id}
                            value={wine.name}
                            onSelect={() => handleWineSelect(wine.id)}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <WineIcon className="h-4 w-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {wine.name}
                                </div>
                                <div className="flex gap-1 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {wine.country}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {wine.type}
                                  </Badge>
                                </div>
                              </div>
                              <Check
                                className={cn(
                                  "h-4 w-4 flex-shrink-0",
                                  wineId === wine.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !customerId || !wineId}
            >
              {isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
