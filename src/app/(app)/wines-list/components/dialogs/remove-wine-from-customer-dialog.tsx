"use client";

import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle } from "lucide-react";
import { useCustomerWinesActions } from "@/hooks/use-customer-wines-actions";

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
