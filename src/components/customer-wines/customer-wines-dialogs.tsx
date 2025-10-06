"use client";

import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  AlertTriangle,
  Users,
  Wine as WineIcon,
  ArrowRightLeft,
  X,
} from "lucide-react";
import { useCustomerWinesActions } from "@/hooks/use-customer-wines-actions";
import { getCustomers } from "@/app/actions/customers";
import { getWines } from "@/app/actions/wines";
import type { Customer } from "@/app/actions/customers";
import type { Wine } from "@/app/actions/wines";

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

  const { handleAddWineToCustomer, isPending } = useCustomerWinesActions();

  useEffect(() => {
    if (open) {
      loadCustomers();
      loadWines();
    }
  }, [open]);

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

  const loadWines = async () => {
    setLoadingWines(true);
    try {
      const result = await getWines({ limit: 100, discontinued: "active" });
      if (result.success && result.data) {
        setWines(result.data.wines);
      }
    } catch (error) {
      console.error("Erro ao carregar vinhos:", error);
    } finally {
      setLoadingWines(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);

    if (!newOpen) {
      setError("");
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
              <Select
                value={customerId}
                onValueChange={setCustomerId}
                disabled={
                  isPending || loadingCustomers || !!preselectedCustomerId
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
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

            <div className="grid gap-2">
              <Label htmlFor="wine">Vinho *</Label>
              <Select
                value={wineId}
                onValueChange={setWineId}
                disabled={isPending || loadingWines || !!preselectedWineId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um vinho" />
                </SelectTrigger>
                <SelectContent>
                  {wines.map((wine) => (
                    <SelectItem key={wine.id} value={wine.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <WineIcon className="h-4 w-4" />
                          <span>{wine.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {wine.country}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {wine.type}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

interface RemoveWineFromCustomerDialogProps {
  customerId: string;
  wineId: string;
  customerName: string;
  wineName: string;
  trigger?: React.ReactNode;
}

export function RemoveWineFromCustomerDialog({
  customerId,
  wineId,
  customerName,
  wineName,
  trigger,
}: RemoveWineFromCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>("");

  const { handleRemoveWineFromCustomer, isPending } = useCustomerWinesActions();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);

    if (!newOpen) {
      setError("");
    }
  };

  const handleRemove = async () => {
    setError("");

    const result = await handleRemoveWineFromCustomer({ customerId, wineId });

    if (result.success) {
      handleOpenChange(false);
    } else {
      setError(result.error || "Erro ao remover vinho da lista");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-red-600">
            <Trash2 className="h-4 w-4 mr-1" />
            Remover
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Remover da Lista
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover <strong>{wineName}</strong> da lista
            de <strong>{customerName}</strong>?
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
            variant="destructive"
            onClick={handleRemove}
            disabled={isPending}
          >
            {isPending ? "Removendo..." : "Remover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TransferWinesDialogProps {
  fromCustomerId: string;
  fromCustomerName: string;
  selectedWineIds: string[];
  trigger?: React.ReactNode;
}

export function TransferWinesDialog({
  fromCustomerId,
  fromCustomerName,
  selectedWineIds,
  trigger,
}: TransferWinesDialogProps) {
  const [open, setOpen] = useState(false);
  const [toCustomerId, setToCustomerId] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const { handleTransferWines, isPending } = useCustomerWinesActions();

  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const result = await getCustomers({ limit: 100 });
      if (result.success && result.data) {
        // Filtrar o cliente de origem
        const filteredCustomers = result.data.customers.filter(
          (c) => c.id !== fromCustomerId
        );
        setCustomers(filteredCustomers);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);

    if (!newOpen) {
      setError("");
      setToCustomerId("");
    }
  };

  const handleTransfer = async () => {
    setError("");

    if (!toCustomerId) {
      setError("Selecione um cliente de destino");
      return;
    }

    const result = await handleTransferWines({
      fromCustomerId,
      toCustomerId,
      wineIds: selectedWineIds,
    });

    if (result.success) {
      handleOpenChange(false);
    } else {
      setError(result.error || "Erro ao transferir vinhos");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <ArrowRightLeft className="h-4 w-4 mr-1" />
            Transferir
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transferir Vinhos
          </DialogTitle>
          <DialogDescription>
            Transferir {selectedWineIds.length} vinho(s) de{" "}
            <strong>{fromCustomerName}</strong> para outro cliente.
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
            <Label htmlFor="toCustomer">Cliente de Destino *</Label>
            <Select
              value={toCustomerId}
              onValueChange={setToCustomerId}
              disabled={isPending || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
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
            onClick={handleTransfer}
            disabled={isPending || !toCustomerId}
          >
            {isPending ? "Transferindo..." : "Transferir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ClearCustomerListDialogProps {
  customerId: string;
  customerName: string;
  trigger?: React.ReactNode;
}

export function ClearCustomerListDialog({
  customerId,
  customerName,
  trigger,
}: ClearCustomerListDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>("");

  const { handleClearCustomerList, isPending } = useCustomerWinesActions();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);

    if (!newOpen) {
      setError("");
    }
  };

  const handleClear = async () => {
    setError("");

    const result = await handleClearCustomerList(customerId);

    if (result.success) {
      handleOpenChange(false);
    } else {
      setError(result.error || "Erro ao limpar lista do cliente");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-red-600">
            <X className="h-4 w-4 mr-1" />
            Limpar Lista
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Limpar Lista Completa
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover TODOS os vinhos da lista de{" "}
            <strong>{customerName}</strong>? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
            variant="destructive"
            onClick={handleClear}
            disabled={isPending}
          >
            {isPending ? "Limpando..." : "Limpar Lista"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
