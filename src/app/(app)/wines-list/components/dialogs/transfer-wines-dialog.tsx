"use client";

import { useState, useEffect, useCallback } from "react";
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
import { ArrowRightLeft, AlertTriangle, Users } from "lucide-react";
import { useCustomerWinesActions } from "@/hooks/use-customer-wines-actions";
import { getCustomers } from "@/app/actions/customers";
import type { Customer } from "@/app/actions/customers";

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

  const loadCustomers = useCallback(async () => {
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
  }, [fromCustomerId]);

  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open, loadCustomers]);

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
